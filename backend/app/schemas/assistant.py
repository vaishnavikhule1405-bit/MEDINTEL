from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


class ToolInvocation(BaseModel):
    tool_name: str
    arguments: Dict[str, Any]
    result_summary: str
    status: str = "SUCCESS"


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., max_length=4000)
    created_at: Optional[str] = None


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000, description="Clinician prompt or inquiry")
    session_id: Optional[str] = Field(None, description="Conversation session ID")
    case_id: Optional[str] = Field(None, description="Active case ID for context")
    symptoms: Optional[List[str]] = Field(None, max_length=174, description="Optional active symptom list")
    medical_text: Optional[str] = Field(None, max_length=20000, description="Optional active transcription text")
    history: List[ChatMessage] = Field(default_factory=list, max_length=10)


class ChatResponse(BaseModel):
    reply: str
    session_id: str
    tools_executed: List[ToolInvocation] = Field(default_factory=list)
    concordance_status: str = Field(
        default="INFORMATIONAL",
        description="'CONCORDANT', 'DISCORDANT', 'INCOMPLETE', or 'INFORMATIONAL'"
    )
    suggested_actions: List[str] = Field(default_factory=list)
    response_source: Literal["groq", "local"] = "local"
    disclaimer: str
    safety_note: str
