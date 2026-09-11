from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class SymptomItem(BaseModel):
    id: str = Field(..., description="Machine learning feature identifier (e.g. symptom_cough)")
    name: str = Field(..., description="Human-readable symptom title (e.g. Cough)")
    category: str = Field(..., description="Clinical organ system category")
    is_rare: bool = Field(default=False, description="Whether this is a specialized or rare clinical symptom")


class SymptomCategoryGroup(BaseModel):
    category: str
    count: int
    symptoms: List[SymptomItem]


class SymptomListResponse(BaseModel):
    total: int
    categories: List[SymptomCategoryGroup]
    all_symptoms: List[SymptomItem]


class ClinicalPredictionRequest(BaseModel):
    symptoms: List[str] = Field(
        ...,
        min_length=1,
        description="List of symptom IDs or symptom names present in the patient"
    )
    patient_age: Optional[int] = Field(None, ge=0, le=125, description="Patient age (optional)")
    patient_sex: Optional[str] = Field(None, description="Patient biological sex (optional)")


class DiseasePrediction(BaseModel):
    disease: str = Field(..., description="Standardized disease class name")
    disease_display_name: str = Field(..., description="Formatted display name")
    class_index: int = Field(..., description="Class mapping index 0-36")
    probability: float = Field(..., ge=0.0, le=1.0, description="Predicted class probability")
    model_confidence: float = Field(..., ge=0.0, le=1.0, description="Model Confidence score")


class ShapContribution(BaseModel):
    symptom_id: str
    symptom_name: str
    symptom_value: int
    shap_value: float
    contribution: str = Field(..., description="'increases_prediction' or 'decreases_prediction'")
    absolute_impact: float


class ModelEvaluationMetrics(BaseModel):
    model_name: str
    accuracy: str
    macro_precision: str
    macro_recall: str
    macro_f1: str
    weighted_f1: str
    training_dataset_records: str
    num_symptom_features: int
    num_disease_classes: int


class ClinicalPredictionResponse(BaseModel):
    predicted_disease: str
    predicted_disease_display: str
    model_confidence: float = Field(..., description="Model Confidence (not calibrated clinical risk)")
    class_probability: float
    top_5_predictions: List[DiseasePrediction]
    model_evidence: List[ShapContribution]
    active_symptoms_count: int
    active_symptoms: List[str]
    model_info: ModelEvaluationMetrics
    disclaimer: str
    safety_note: str


class ClinicalModelInfoResponse(BaseModel):
    selected_model: ModelEvaluationMetrics
    comparison_models: List[ModelEvaluationMetrics]
    disease_classes: List[str]
    total_features: int
    disclaimer: str
