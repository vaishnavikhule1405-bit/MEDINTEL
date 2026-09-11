import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, status

from backend.app.config import settings
from backend.app.schemas.imaging import (
    ImagingPredictionResponse,
    ImagingModelInfoResponse
)
from backend.app.services.imaging_service import imaging_service

logger = logging.getLogger("medintel.routes.imaging")

router = APIRouter(prefix="/api/imaging", tags=["Chest X-Ray Analysis"])


def _validate_image_file(file: UploadFile, contents: bytes) -> None:
    """Validate uploaded image extension and byte size."""
    filename = file.filename or ""
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    
    if ext not in settings.ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported image file extension: '.{ext}'. "
                f"Allowed formats: {', '.join(settings.ALLOWED_IMAGE_EXTENSIONS)}"
            )
        )

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image file exceeds maximum allowable size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )


@router.post(
    "/predict",
    response_model=ImagingPredictionResponse,
    summary="Classify Chest X-Ray (Normal vs Pneumonia) with Dynamic Grad-CAM",
    description="Upload a chest X-ray image (JPEG/PNG). Evaluates with Custom CNN and dynamically generates Grad-CAM visual model evidence."
)
async def predict_xray(file: UploadFile = File(...)) -> ImagingPredictionResponse:
    try:
        contents = await file.read()
        _validate_image_file(file, contents)
        response = imaging_service.predict_and_explain(contents)
        return response
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid image uploaded: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error during chest X-ray classification: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chest X-ray analysis failed: {str(e)}"
        )


@router.post(
    "/gradcam",
    response_model=ImagingPredictionResponse,
    summary="Generate Grad-CAM Visual Model Evidence for Chest X-Ray",
    description="Dedicated endpoint for generating Grad-CAM heatmaps and visual overlay on layer block4.0."
)
async def generate_gradcam(file: UploadFile = File(...)) -> ImagingPredictionResponse:
    # Direct alias to predict_and_explain as it generates full visual evidence
    return await predict_xray(file)


@router.get(
    "/model-info",
    response_model=ImagingModelInfoResponse,
    summary="Get Custom CNN vs DenseNet121 imaging metrics",
    description="Returns performance comparison showing Custom CNN accuracy 84.46% vs DenseNet121 82.53% and ROC-AUC 93.25%."
)
def get_imaging_model_info() -> ImagingModelInfoResponse:
    try:
        return imaging_service.get_model_info()
    except Exception as e:
        logger.error(f"Error retrieving imaging model info: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve imaging model info: {str(e)}"
        )


@router.get(
    "/sample/{sample_type}",
    summary="Get sample chest radiograph image",
    description="Returns a sample Normal or Pneumonia radiograph from the test dataset for rapid testing."
)
def get_sample_radiograph(sample_type: str):
    from fastapi.responses import FileResponse
    sample_type_clean = sample_type.lower().strip()
    if sample_type_clean == "normal":
        path = settings.resolve_path("datasets/chest_xray/test/NORMAL/IM-0001-0001.jpeg")
    elif sample_type_clean in ("pneumonia", "abnormal"):
        path = settings.resolve_path("datasets/chest_xray/test/PNEUMONIA/person1_virus_6.jpeg")
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid sample type. Choose 'normal' or 'pneumonia'.")

    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Sample file not found at {path}")
    return FileResponse(str(path), media_type="image/jpeg")

