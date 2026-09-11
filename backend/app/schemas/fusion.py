from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from backend.app.schemas.clinical import ClinicalPredictionResponse
from backend.app.schemas.imaging import ImagingPredictionResponse
from backend.app.schemas.nlp import NLPAnalysisResponse


class ModalityContributions(BaseModel):
    clinical: float = Field(..., ge=0.0, le=1.0)
    imaging: float = Field(..., ge=0.0, le=1.0)
    medical_text: float = Field(..., ge=0.0, le=1.0)


class ModalityAvailability(BaseModel):
    clinical_provided: bool
    imaging_provided: bool
    text_provided: bool
    missing_modalities: List[str]
    active_modality_count: int


class EvidenceProfile(BaseModel):
    overall_evidence_index: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Multimodal evidence aggregation score (prototype index, not calibrated clinical probability)"
    )
    evidence_level: str = Field(..., description="'LOW', 'MODERATE', or 'HIGH'")
    cross_modality_relationship: str = Field(
        ...,
        description="'HIGH AGREEMENT', 'LOW-EVIDENCE AGREEMENT', or 'MODALITY DISAGREEMENT'"
    )
    relationship_explanation: str
    modality_contributions: ModalityContributions
    modality_availability: ModalityAvailability
    uncertainty_notes: List[str]


class MultimodalFusionRequest(BaseModel):
    # Any combination of modalities may be supplied
    symptoms: Optional[List[str]] = Field(None, description="Clinical symptom IDs or names")
    medical_report_text: Optional[str] = Field(None, description="Medical transcription text")
    # For imaging, base64 data URI or binary file can be passed via multipart endpoint


class MultimodalEvidenceProfileResponse(BaseModel):
    profile_type: str = Field(default="Multimodal Evidence Profile", description="Never labeled as 'Final Diagnosis'")
    case_type: str = Field(default="LIVE_ANALYSIS", description="'LIVE_ANALYSIS' or 'SYNTHETIC_DEMONSTRATION'")
    is_synthetic_demonstration: bool = False
    synthetic_case_id: Optional[str] = None
    
    evidence_profile: EvidenceProfile

    # Individual modality outputs (optional depending on availability)
    clinical_analysis: Optional[ClinicalPredictionResponse] = None
    imaging_analysis: Optional[ImagingPredictionResponse] = None
    textual_analysis: Optional[NLPAnalysisResponse] = None

    clinical_evidence_score: Optional[float] = None
    imaging_evidence_score: Optional[float] = None
    textual_evidence_score: Optional[float] = None

    synthetic_badge: str = "SYNTHETIC DEMONSTRATION"
    disclaimer: str
    safety_note: str


class SyntheticCaseSummary(BaseModel):
    case_id: str
    case_type: str = "SYNTHETIC_DEMONSTRATION"
    clinical_prediction: str
    clinical_confidence: float
    imaging_prediction: str
    pneumonia_probability: float
    text_entity_count: int
    overall_evidence_index: float
    evidence_level: str
    cross_modality_relationship: str
    is_synthetic: bool = True
