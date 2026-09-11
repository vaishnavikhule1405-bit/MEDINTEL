from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class CaseFilterParams(BaseModel):
    case_type: Optional[str] = None
    evidence_level: Optional[str] = None
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class CreateCaseRequest(BaseModel):
    title: str = Field(default="Clinical Consultation Case")
    patient_identifier: Optional[str] = Field(None, description="Anonymized ID e.g. PATIENT-7821")
    patient_age: Optional[int] = None
    patient_sex: Optional[str] = None
    symptoms: Optional[List[str]] = None
    medical_text: Optional[str] = None


class CaseListItem(BaseModel):
    id: str
    case_number: Optional[str] = None
    case_type: str
    patient_identifier: Optional[str] = None
    title: str
    primary_condition: Optional[str] = None
    overall_evidence_index: float
    evidence_level: str
    cross_modality_relationship: str
    created_at: datetime


class CaseDetailResponse(BaseModel):
    id: str
    case_number: Optional[str] = None
    case_type: str
    patient_identifier: Optional[str] = None
    patient_age: Optional[int] = None
    patient_sex: Optional[str] = None
    title: str
    primary_condition: Optional[str] = None
    overall_evidence_index: float
    evidence_level: str
    cross_modality_relationship: str
    created_at: datetime
    
    clinical_data: Optional[Dict[str, Any]] = None
    imaging_data: Optional[Dict[str, Any]] = None
    nlp_data: Optional[Dict[str, Any]] = None
    multimodal_data: Optional[Dict[str, Any]] = None
    assistant_interactions: List[Dict[str, Any]] = []


class AnalyticsSummaryResponse(BaseModel):
    total_cases: int
    clinical_analyses_count: int
    xray_analyses_count: int
    medical_reports_count: int
    multimodal_analyses_count: int
    evidence_level_distribution: Dict[str, int]
    modality_distribution: Dict[str, int]
    cross_modal_agreement_distribution: Dict[str, int]
    top_predicted_conditions: List[Dict[str, Any]]
    model_benchmarks: Dict[str, Any]
