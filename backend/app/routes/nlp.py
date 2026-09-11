import logging
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status

from backend.app.schemas.nlp import (
    NLPAnalysisRequest,
    NLPAnalysisResponse,
    NLPModelInfoResponse
)
from backend.app.services.nlp_service import nlp_service

logger = logging.getLogger("medintel.routes.nlp")

router = APIRouter(prefix="/api/nlp", tags=["Medical Text Intelligence"])


@router.post(
    "/analyze",
    response_model=NLPAnalysisResponse,
    summary="Extract clinical entities and context from medical report",
    description=(
        "Extracts problems, symptoms, medications, tests, anatomy, measurements, "
        "and identifies contextual modifiers (PRESENT, NEGATED, UNCERTAIN, HISTORICAL, FAMILY_HISTORY). "
        "Also retrieves semantically similar cases from MTSamples."
    )
)
def analyze_text(request: NLPAnalysisRequest) -> NLPAnalysisResponse:
    if not request.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Clinical report text cannot be empty."
        )

    try:
        return nlp_service.analyze(
            text=request.text,
            retrieve_similar=request.retrieve_similar,
            top_k=request.top_k
        )
    except Exception as e:
        logger.error(f"Error analyzing medical transcription: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Medical text analysis failed: {str(e)}"
        )


@router.post(
    "/upload",
    response_model=NLPAnalysisResponse,
    summary="Upload text file for clinical NLP extraction",
    description="Upload a plain text (.txt) medical transcription file for automated clinical extraction."
)
async def upload_text_file(
    file: UploadFile = File(...),
    retrieve_similar: bool = Form(True),
    top_k: int = Form(3)
) -> NLPAnalysisResponse:
    if not file.filename.lower().endswith((".txt", ".text")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only plain text files (.txt) are supported for medical report upload."
        )

    try:
        content_bytes = await file.read()
        text = content_bytes.decode("utf-8", errors="ignore")
        if not text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty."
            )
        return nlp_service.analyze(text=text, retrieve_similar=retrieve_similar, top_k=top_k)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing uploaded text report: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process uploaded medical text report: {str(e)}"
        )


@router.get(
    "/model-info",
    response_model=NLPModelInfoResponse,
    summary="Get NLP module configuration and dataset metadata",
    description="Returns metadata for d4data/biomedical-ner-all, S-PubMedBert embeddings, and standardized categories."
)
def get_nlp_model_info() -> NLPModelInfoResponse:
    try:
        return nlp_service.get_model_info()
    except Exception as e:
        logger.error(f"Error retrieving NLP model info: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve NLP module info: {str(e)}"
        )
