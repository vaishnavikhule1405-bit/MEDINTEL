from pathlib import Path
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

# Base project root (two levels up from backend/app)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Application Information
    APP_NAME: str = "MEDINTEL AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    ENVIRONMENT: str = "development"

    # Optional language-model API for natural-language assistant replies
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"

    # Database
    DATABASE_URL: str = "sqlite:///./medintel.db"

    # CORS
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"

    # Paths - Clinical
    CLINICAL_MODEL_PATH: str = "models/clinical_xgboost.pkl"
    CLINICAL_FEATURES_PATH: str = "models/clinical_features.pkl"
    CLINICAL_CLASS_MAPPING_PATH: str = "models/clinical_class_mapping.json"
    CLINICAL_LABEL_ENCODER_PATH: str = "models/clinical_label_encoder.pkl"
    CLINICAL_SHAP_GLOBAL_PATH: str = "models/clinical/clinical_global_shap_importance.csv"

    # Paths - Imaging
    IMAGING_MODEL_PATH: str = "models/imaging/custom_cnn_best.pth"
    IMAGING_METADATA_PATH: str = "models/imaging/final_imaging_model_metadata.json"

    # Paths - NLP
    NLP_CONFIG_PATH: str = "models/nlp/final_ner_config.json"
    NLP_METADATA_PATH: str = "models/nlp/nlp_module_metadata.json"
    NLP_EMBEDDINGS_PATH: str = "models/nlp/medical_text_embeddings.npy"
    NLP_STANDARDIZED_OUTPUT_PATH: str = "results/nlp/standardized_nlp_output.jsonl"
    NLP_EXPLAINABILITY_PATH: str = "results/nlp/nlp_explainability_examples.json"

    # Paths - Fusion & Synthetic Demonstrations
    FUSION_METADATA_PATH: str = "models/fusion/final_fusion_metadata.json"
    SYNTHETIC_CASES_PATH: str = "results/fusion/synthetic_multimodal_cases.jsonl"
    FUSION_EXPLANATIONS_PATH: str = "results/fusion/final_multimodal_explanations.jsonl"

    # Upload limits & security
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_IMAGE_EXTENSIONS: Union[str, List[str]] = "jpg,jpeg,png"

    # Safety Disclaimers
    MEDICAL_DISCLAIMER: str = (
        "AI-assisted clinical decision support. Not a substitute for professional medical judgment. "
        "Outputs do not constitute confirmed diagnoses, prescriptions, or autonomous medical decisions. "
        "Human and clinician oversight is strictly required."
    )
    VISUAL_EVIDENCE_DISCLAIMER: str = (
        "Visual Model Evidence: Grad-CAM highlights image regions influencing the model prediction "
        "and is not clinically validated lesion localization."
    )
    SYNTHETIC_DEMONSTRATION_NOTICE: str = (
        "SYNTHETIC DEMONSTRATION: The clinical, imaging, and textual records in demonstration cases originate "
        "from independent datasets and do not represent one real patient. Multimodal fusion represents a prototype "
        "late-evidence profile and is not clinically validated diagnostic certainty."
    )

    @field_validator("CORS_ORIGINS", mode="after")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [orig.strip() for orig in v.split(",") if orig.strip()]
        return v

    @field_validator("ALLOWED_IMAGE_EXTENSIONS", mode="after")
    @classmethod
    def parse_allowed_extensions(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [ext.strip().lower().lstrip(".") for ext in v.split(",") if ext.strip()]
        return [ext.lower().lstrip(".") for ext in v]

    def resolve_path(self, relative_or_absolute: str) -> Path:
        """Resolve a path relative to the project root directory."""
        p = Path(relative_or_absolute)
        if p.is_absolute():
            return p
        return (PROJECT_ROOT / p).resolve()


settings = Settings()
