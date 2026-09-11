import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.dependencies import get_db
from backend.app.schemas.cases import (
    CaseListItem,
    CaseDetailResponse
)
from backend.app.services.case_service import case_service

logger = logging.getLogger("medintel.routes.cases")

router = APIRouter(prefix="/api/cases", tags=["Case History & Records"])


@router.get(
    "",
    response_model=List[CaseListItem],
    summary="List patient cases with filters and pagination",
    description="Returns consultation cases with evidence levels, primary condition, and cross-modality agreement status."
)
def list_cases(
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    case_type: Optional[str] = Query(None, description="Filter by LIVE_ANALYSIS or SYNTHETIC_DEMONSTRATION"),
    evidence_level: Optional[str] = Query(None, description="Filter by LOW, MODERATE, HIGH"),
    db: Session = Depends(get_db)
) -> List[CaseListItem]:
    try:
        return case_service.list_cases(
            db=db,
            limit=limit,
            offset=offset,
            case_type=case_type,
            evidence_level=evidence_level
        )
    except Exception as e:
        logger.error(f"Error querying cases: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query cases: {str(e)}"
        )


@router.get(
    "/{case_id}",
    response_model=CaseDetailResponse,
    summary="Get detailed case record with all linked modalities",
    description="Returns full case dossier including clinical symptoms, X-ray probabilities, NLP entities, and assistant interactions."
)
def get_case(case_id: str, db: Session = Depends(get_db)) -> CaseDetailResponse:
    c = case_service.get_case_detail(db, case_id)
    if not c:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID '{case_id}' was not found."
        )
    return c
