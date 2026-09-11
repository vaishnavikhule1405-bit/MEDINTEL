from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ExtractedEntity(BaseModel):
    text: str = Field(..., description="Extracted clinical entity phrase")
    category: str = Field(
        ...,
        description=(
            "MedIntel standardized category: PROBLEM, SYMPTOM, MEDICATION, TEST, "
            "PROCEDURE, MEASUREMENT, ANATOMY, CLINICAL_EVENT, CLINICAL_HISTORY, "
            "CLINICAL_ATTRIBUTE, TREATMENT"
        )
    )
    confidence: float = Field(default=0.95, ge=0.0, le=1.0, description="Model confidence score")
    status: str = Field(
        default="PRESENT",
        description="Clinical context: PRESENT, NEGATED, UNCERTAIN, HISTORICAL, FAMILY_HISTORY"
    )
    trigger_word: Optional[str] = Field(None, description="Contextual modifier that determined the status")
    char_start: Optional[int] = None
    char_end: Optional[int] = None


class CategorizedEntities(BaseModel):
    problems: List[ExtractedEntity] = []
    symptoms: List[ExtractedEntity] = []
    medications: List[ExtractedEntity] = []
    tests: List[ExtractedEntity] = []
    procedures: List[ExtractedEntity] = []
    anatomy: List[ExtractedEntity] = []
    measurements: List[ExtractedEntity] = []
    clinical_events: List[ExtractedEntity] = []
    clinical_history: List[ExtractedEntity] = []
    treatment: List[ExtractedEntity] = []
    clinical_attributes: List[ExtractedEntity] = []


class CategoryCounts(BaseModel):
    problems_count: int = 0
    symptoms_count: int = 0
    medications_count: int = 0
    tests_count: int = 0
    procedures_count: int = 0
    anatomy_count: int = 0
    measurements_count: int = 0
    clinical_events_count: int = 0
    clinical_history_count: int = 0
    treatment_count: int = 0
    clinical_attributes_count: int = 0
    negated_count: int = 0
    uncertain_count: int = 0
    historical_count: int = 0
    family_history_count: int = 0
    total_entities: int = 0


class SimilarReport(BaseModel):
    record_id: int
    sample_name: str
    medical_specialty: str
    similarity_score: float = Field(..., ge=0.0, le=1.0)
    text_preview: str
    entity_count: int


class NLPAnalysisRequest(BaseModel):
    text: str = Field(..., min_length=5, description="Medical transcription or clinical report text")
    retrieve_similar: bool = Field(default=True, description="Whether to retrieve similar reports from MTSamples corpus")
    top_k: int = Field(default=3, ge=1, le=10, description="Number of similar cases to retrieve")


class NLPAnalysisResponse(BaseModel):
    original_text: str
    word_count: int
    char_count: int
    entities: List[ExtractedEntity]
    categorized_entities: CategorizedEntities
    counts: CategoryCounts
    similar_reports: List[SimilarReport]
    disclaimer: str
    safety_note: str


class NLPModelInfoResponse(BaseModel):
    ner_model: str
    embedding_model: str
    standardized_categories: List[str]
    context_modifiers_detected: List[str]
    total_precomputed_records: int
    embedding_dimension: int
    disclaimer: str
