import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.dependencies import get_db
from backend.app.schemas.cases import AnalyticsSummaryResponse
from backend.app.services.case_service import case_service

logger = logging.getLogger("medintel.routes.analytics")

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Health Insights"])


@router.get(
    "/summary",
    response_model=AnalyticsSummaryResponse,
    summary="Get analytics dashboard metrics and model distributions",
    description="Aggregates case counts, modality distributions, evidence levels, top conditions, and cross-modality agreement stats."
)
def get_analytics_summary(db: Session = Depends(get_db)) -> AnalyticsSummaryResponse:
    try:
        return case_service.get_analytics_summary(db)
    except Exception as e:
        logger.error(f"Error compiling analytics summary: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate analytics summary: {str(e)}"
        )
