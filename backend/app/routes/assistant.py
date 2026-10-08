import json
import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from backend.app.dependencies import get_db
from backend.app.config import settings
from backend.app.schemas.assistant import ChatMessage, ChatRequest, ChatResponse
from backend.app.services.agent_service import agent_service
from backend.app.models.db_models import AssistantInteraction
from backend.app.routes.imaging import _validate_image_file

logger = logging.getLogger("medintel.routes.assistant")

router = APIRouter(prefix="/api/assistant", tags=["Agentic AI Healthcare Assistant"])


def _save_interaction(request: ChatRequest, response: ChatResponse, db: Session) -> None:
    interaction = AssistantInteraction(
        case_id=request.case_id,
        session_id=response.session_id,
        user_message=request.message,
        assistant_response=response.reply,
        tool_calls=[tool.model_dump() for tool in response.tools_executed],
        concordance_flag=response.concordance_status
    )
    db.add(interaction)
    db.commit()


@router.get(
    "/status",
    summary="Check assistant language API configuration",
    description="Reports whether Groq is configured without exposing the API key."
)
def assistant_status() -> Dict[str, Any]:
    configured = bool(settings.GROQ_API_KEY.strip())
    return {
        "language_api": "groq" if configured else "built-in",
        "groq_configured": configured,
        "model": settings.GROQ_MODEL if configured else None,
    }


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
        _save_interaction(request, response, db)
        return response
    except Exception as e:
        logger.error(f"Error processing assistant interaction: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Clinical assistant processing failed: {str(e)}"
        )


@router.post(
    "/chat/image",
    response_model=ChatResponse,
    summary="Chat with an uploaded chest X-ray",
    description="Runs the imaging model on the image provided with the assistant message."
)
async def chat_with_image(
    message: str = Form(..., min_length=1, max_length=4000),
    file: UploadFile = File(...),
    session_id: str | None = Form(None),
    case_id: str | None = Form(None),
    symptoms: str = Form(""),
    medical_text: str = Form("", max_length=20000),
    history: str = Form("[]", max_length=50000),
    db: Session = Depends(get_db)
) -> ChatResponse:
    if not message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inquiry message cannot be empty."
        )

    try:
        contents = await file.read(settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024 + 1)
        _validate_image_file(file, contents)
        history_items = json.loads(history)
        if not isinstance(history_items, list):
            raise ValueError("Conversation history must be a list.")
        request = ChatRequest(
            message=message,
            session_id=session_id,
            case_id=case_id,
            symptoms=[item.strip() for item in symptoms.split(",") if item.strip()] or None,
            medical_text=medical_text or None,
            history=[ChatMessage.model_validate(item) for item in history_items]
        )
        response = await run_in_threadpool(agent_service.process_chat, request, contents)
        _save_interaction(request, response, db)
        return response
    except HTTPException:
        raise
    except (json.JSONDecodeError, ValueError) as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid assistant request: {error}"
        ) from error
    except Exception as error:
        logger.error("Error processing assistant image interaction: %s", error, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Clinical assistant processing failed: {error}"
        ) from error


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
                "parameters": ["uploaded_image: jpg, jpeg, or png"]
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
