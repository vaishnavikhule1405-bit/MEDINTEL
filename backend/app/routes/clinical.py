import logging
from fastapi import APIRouter, HTTPException, status

from backend.app.schemas.clinical import (
    SymptomListResponse,
    ClinicalPredictionRequest,
    ClinicalPredictionResponse,
    ClinicalModelInfoResponse
)
from backend.app.services.clinical_service import clinical_service

logger = logging.getLogger("medintel.routes.clinical")

router = APIRouter(prefix="/api/clinical", tags=["Clinical Analysis"])


@router.get(
    "/symptoms",
    response_model=SymptomListResponse,
    summary="Get 174 structured clinical symptoms",
    description="Returns all 174 symptom features from the Community Healthcare MultiSymptoms dataset grouped by organ system."
)
def get_symptoms() -> SymptomListResponse:
    try:
        return clinical_service.get_symptoms_catalog()
    except Exception as e:
        logger.error(f"Error retrieving symptoms: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve symptoms catalog: {str(e)}"
        )


@router.post(
    "/predict",
    response_model=ClinicalPredictionResponse,
    summary="Predict disease from clinical symptoms with SHAP explanation",
    description="Vectorizes input symptoms across 174 features, runs trained XGBoost classifier, and returns top-5 predictions with SHAP model evidence."
)
def predict_disease(request: ClinicalPredictionRequest) -> ClinicalPredictionResponse:
    if not request.symptoms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one symptom must be selected for clinical analysis."
        )

    try:
        response = clinical_service.predict(request.symptoms)
        if response.active_symptoms_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="None of the provided symptoms matched the 174 clinical feature dictionary."
            )
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during clinical disease prediction: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Clinical analysis prediction failed: {str(e)}"
        )


@router.get(
    "/model-info",
    response_model=ClinicalModelInfoResponse,
    summary="Get clinical model architecture and benchmark metrics",
    description="Returns performance metrics comparing XGBoost against Logistic Regression and Random Forest benchmarks."
)
def get_model_info() -> ClinicalModelInfoResponse:
    try:
        return clinical_service.get_model_info()
    except Exception as e:
        logger.error(f"Error retrieving clinical model info: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve clinical model metadata: {str(e)}"
        )
