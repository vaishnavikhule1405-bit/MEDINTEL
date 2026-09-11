import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.dependencies import get_db
from backend.app.schemas.assistant import ChatRequest, ChatResponse
from backend.app.services.agent_service import agent_service
from backend.app.models.db_models import AssistantInteraction

logger = logging.getLogger("medintel.routes.assistant")

router = APIRouter(prefix="/api/assistant", tags=["Agentic AI Healthcare Assistant"])


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Chat with Agentic AI Clinical Intelligence Assistant",
    description=(
        "Orchestrates 8 backend diagnostic tools: analyze_symptoms, analyze_xray, "
        "analyze_medical_report, get_case_history, get_model_explanation, get_multimodal_evidence, "
        "retrieve_similar_reports, summarize_case. Detects modality concordance/discordance."
    )
)
def chat_with_assistant(request: ChatRequest, db: Session = Depends(get_db)) -> ChatResponse:
    if not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inquiry message cannot be empty."
        )

    try:
        response = agent_service.process_chat(request)
        
        # Persist interaction into database
        interaction = AssistantInteraction(
            case_id=request.case_id,
            session_id=response.session_id,
            user_message=request.message,
            assistant_response=response.reply,
            tool_calls=[t.model_dump() for t in response.tools_executed],
            concordance_flag=response.concordance_status
        )
        db.add(interaction)
        db.commit()

        return response
    except Exception as e:
        logger.error(f"Error processing assistant interaction: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Clinical assistant processing failed: {str(e)}"
        )


@router.get(
    "/tools",
    summary="List the 8 specialized clinical agent tools",
    description="Returns metadata and operational descriptions for each of the assistant's backend tools."
)
def list_agent_tools() -> Dict[str, Any]:
    return {
        "tools": [
            {
                "name": "analyze_symptoms",
                "description": "Evaluates 174 patient symptoms with Clinical XGBoost classifier and computes TreeSHAP evidence.",
                "parameters": ["symptoms: List[str]"]
            },
            {
                "name": "analyze_xray",
                "description": "Classifies chest radiograph with Custom CNN (Normal vs Pneumonia) and derives Grad-CAM visual evidence on block4.0.",
                "parameters": ["image_bytes or sample_type: str"]
            },
            {
                "name": "analyze_medical_report",
                "description": "Extracts biomedical entities into 11 MedIntel categories and detects Negation, Uncertainty, and History.",
                "parameters": ["text: str"]
            },
            {
                "name": "get_case_history",
                "description": "Retrieves clinical dossier and evidence index for a patient or synthetic demonstration case.",
                "parameters": ["case_id: str"]
            },
            {
                "name": "get_model_explanation",
                "description": "Returns methodological explanation of SHAP feature attribution, Grad-CAM visual maps, or NER context.",
                "parameters": ["modality: str"]
            },
            {
                "name": "get_multimodal_evidence",
                "description": "Calculates Late Evidence Profile and cross-modal concordance across available modalities.",
                "parameters": ["symptoms", "xray", "medical_text"]
            },
            {
                "name": "retrieve_similar_reports",
                "description": "Searches 4,966 MTSamples transcriptions using S-PubMedBERT semantic embeddings.",
                "parameters": ["query: str"]
            },
            {
                "name": "summarize_case",
                "description": "Compiles structured clinical evidence summary with uncertainty indicators for clinician review.",
                "parameters": ["case_id: str"]
            }
        ],
        "safety_guardrails": [
            "Never directly prescribe medications or definitive treatments.",
            "Never claim autonomous diagnosis or 100% certainty.",
            "Always identify missing and conflicting modalities.",
            "Always attach mandatory clinical decision support disclaimer."
        ]
    }
