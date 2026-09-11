import json
import logging
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status

from backend.app.config import settings
from backend.app.schemas.fusion import (
    MultimodalEvidenceProfileResponse,
    SyntheticCaseSummary
)
from backend.app.services.fusion_service import fusion_service
from backend.app.services.model_manager import model_manager

logger = logging.getLogger("medintel.routes.fusion")

router = APIRouter(prefix="/api/fusion", tags=["Late Evidence Fusion"])


@router.post(
    "/analyze",
    response_model=MultimodalEvidenceProfileResponse,
    summary="Generate Multimodal Evidence Profile (Late Evidence Fusion)",
    description=(
        "Integrates any combination of Clinical Symptoms, Chest X-Ray image, and Medical Transcription Report. "
        "Calculates modality contributions, evidence index, and cross-modality concordance. "
        "Supports missing modalities."
    )
)
async def analyze_multimodal(
    symptoms: Optional[str] = Form(None, description="JSON array or comma-separated list of symptoms"),
    medical_text: Optional[str] = Form(None, description="Clinical report or transcription text"),
    file: Optional[UploadFile] = File(None, description="Chest X-Ray image file (optional)")
) -> MultimodalEvidenceProfileResponse:
    # Parse symptoms
    parsed_symptoms: Optional[List[str]] = None
    if symptoms:
        symptoms_clean = symptoms.strip()
        if symptoms_clean.startswith("["):
            try:
                parsed_symptoms = json.loads(symptoms_clean)
            except Exception:
                parsed_symptoms = [s.strip() for s in symptoms_clean.strip("[]").split(",") if s.strip()]
        else:
            parsed_symptoms = [s.strip() for s in symptoms_clean.split(",") if s.strip()]

    # Read image bytes if provided
    image_bytes: Optional[bytes] = None
    if file:
        try:
            image_bytes = await file.read()
            if len(image_bytes) == 0:
                image_bytes = None
        except Exception as e:
            logger.warning(f"Failed to read uploaded image in fusion: {e}")

    # Validate that at least one modality is provided
    if not parsed_symptoms and not image_bytes and not (medical_text and medical_text.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one modality (Clinical Symptoms, Chest X-Ray, or Medical Report) must be provided for fusion analysis."
        )

    try:
        response = fusion_service.fuse_live_evidence(
            symptoms=parsed_symptoms,
            image_bytes=image_bytes,
            medical_text=medical_text
        )
        return response
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error during multimodal late evidence fusion: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Multimodal evidence fusion failed: {str(e)}"
        )


@router.get(
    "/synthetic-cases",
    response_model=List[SyntheticCaseSummary],
    summary="List synthetic demonstration cases",
    description="Returns precomputed synthetic demonstration cases sampled independently across the 3 datasets. Explicitly labeled SYNTHETIC DEMONSTRATION."
)
def list_synthetic_cases(limit: int = 50, offset: int = 0) -> List[SyntheticCaseSummary]:
    try:
        return fusion_service.get_synthetic_cases(limit=limit, offset=offset)
    except Exception as e:
        logger.error(f"Error retrieving synthetic cases: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve synthetic demonstration cases: {str(e)}"
        )


@router.get(
    "/synthetic-cases/{case_id}",
    response_model=MultimodalEvidenceProfileResponse,
    summary="Get full Multimodal Evidence Profile for a synthetic demonstration case",
    description="Returns complete evidence profile and cross-modality relationship for a synthetic demonstration case."
)
def get_synthetic_case(case_id: str) -> MultimodalEvidenceProfileResponse:
    profile = fusion_service.get_synthetic_case_by_id(case_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Synthetic demonstration case '{case_id}' not found."
        )
    return profile


@router.get(
    "/analysis-summary",
    summary="Get precomputed multimodal fusion analysis summary and ablation benchmarks",
    description="Returns benchmark statistics across 500 synthetic cases including missing-modality ablation and cross-modal correlations."
)
def get_fusion_analysis_summary():
    path = settings.resolve_path("results/fusion/multimodal_fusion_analysis_summary.json")
    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fusion analysis summary file not found.")
    
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
