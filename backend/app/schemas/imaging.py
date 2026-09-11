from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class VisualEvidence(BaseModel):
    evidence_label: str = Field(
        default="Visual Model Evidence",
        description="Must be labeled 'Visual Model Evidence' rather than 'Confirmed lesion' or 'Medical proof'"
    )
    target_layer: str = Field(default="block4.0", description="Layer hooked for Grad-CAM attribution")
    heatmap_base64: str = Field(..., description="Data URI for the colorized Grad-CAM attention heatmap")
    overlay_base64: str = Field(..., description="Data URI for the blended Grad-CAM overlay over original X-Ray")
    original_base64: str = Field(..., description="Data URI of the original preprocessed chest X-ray")
    disclaimer: str = Field(
        default=(
            "Visual Model Evidence: Grad-CAM indicates image regions influencing the model prediction "
            "and is not clinically validated lesion localization."
        )
    )


class ImagingModelMetrics(BaseModel):
    model_name: str
    architecture: str
    task: str
    accuracy: str
    macro_precision: str
    macro_recall: str
    macro_f1: str
    pneumonia_precision: str
    pneumonia_f1: str
    pneumonia_sensitivity: str
    specificity: str
    roc_auc: str


class ImagingPredictionResponse(BaseModel):
    predicted_class: str = Field(..., description="'NORMAL' or 'PNEUMONIA'")
    normal_probability: float = Field(..., ge=0.0, le=1.0)
    pneumonia_probability: float = Field(..., ge=0.0, le=1.0)
    model_confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence of the predicted class")
    visual_evidence: VisualEvidence
    model_metrics: ImagingModelMetrics
    disclaimer: str
    safety_note: str


class ImagingModelInfoResponse(BaseModel):
    selected_model: ImagingModelMetrics
    benchmark_model: ImagingModelMetrics
    comparison_summary: str
    target_gradcam_layer: str
    disclaimer: str
