from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ToolInvocation(BaseModel):
    tool_name: str
    arguments: Dict[str, Any]
    result_summary: str
    status: str = "SUCCESS"


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user', 'assistant', or 'system'")
    content: str
    created_at: Optional[str] = None


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Clinician prompt or inquiry")
    session_id: Optional[str] = Field(None, description="Conversation session ID")
    case_id: Optional[str] = Field(None, description="Active case ID for context")
    symptoms: Optional[List[str]] = Field(None, description="Optional active symptom list")
    medical_text: Optional[str] = Field(None, description="Optional active transcription text")


class ChatResponse(BaseModel):
    reply: str
    session_id: str
    tools_executed: List[ToolInvocation] = []
    concordance_status: str = Field(
        default="INFORMATIONAL",
        description="'CONCORDANT', 'DISCORDANT', 'INCOMPLETE', or 'INFORMATIONAL'"
    )
    suggested_actions: List[str] = []
    disclaimer: str
    safety_note: str
