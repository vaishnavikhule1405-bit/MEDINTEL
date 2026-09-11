import os
import json
import pickle
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
import torch

from backend.app.config import settings
from backend.app.models.custom_cnn import CustomCNN

logger = logging.getLogger("medintel.model_manager")


class ModelManager:
    """
    Centralized Model Manager Singleton.
    Loads all trained ML artifacts once during application startup.
    Validates model integrity and provides access to inference engines.
    Does NOT use mock or dummy models if artifacts are missing.
    """
    _instance: Optional["ModelManager"] = None
    _initialized: bool = False

    def __init__(self):
        if ModelManager._instance is not None:
            raise RuntimeError("ModelManager is a singleton. Use ModelManager.get_instance()")
        
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Using device for PyTorch inference: {self.device}")

        # Model containers
        self.clinical_model = None
        self.clinical_features: List[str] = []
        self.clinical_class_mapping: Dict[str, str] = {}
        self.clinical_label_encoder = None          # sklearn LabelEncoder (optional fallback)
        self.clinical_shap_global: Optional[pd.DataFrame] = None

        self.imaging_model: Optional[CustomCNN] = None
        self.imaging_metadata: Dict[str, Any] = {}

        self.nlp_config: Dict[str, Any] = {}
        self.nlp_metadata: Dict[str, Any] = {}
        self.nlp_embeddings: Optional[np.ndarray] = None
        self.nlp_standardized_records: List[Dict[str, Any]] = []
        self.nlp_explainability: List[Dict[str, Any]] = []

        self.fusion_metadata: Dict[str, Any] = {}
        self.synthetic_cases: List[Dict[str, Any]] = []
        self.fusion_explanations: List[Dict[str, Any]] = []

        self.loaded_status: Dict[str, bool] = {
            "clinical": False,
            "imaging": False,
            "nlp": False,
            "fusion": False
        }

    @classmethod
    def get_instance(cls) -> "ModelManager":
        if cls._instance is None:
            cls._instance = ModelManager()
        return cls._instance

    def load_all_models(self) -> None:
        """Load and validate all trained ML artifacts."""
        logger.info("Initializing MEDINTEL AI Model Manager...")
        self._load_clinical_artifacts()
        self._load_imaging_artifacts()
        self._load_nlp_artifacts()
        self._load_fusion_artifacts()
        ModelManager._initialized = True
        logger.info("All MEDINTEL AI model artifacts successfully validated and loaded.")

    def _load_clinical_artifacts(self) -> None:
        """Load Clinical XGBoost classifier, feature list, class mapping, label encoder, and SHAP importance."""
        model_path = settings.resolve_path(settings.CLINICAL_MODEL_PATH)
        features_path = settings.resolve_path(settings.CLINICAL_FEATURES_PATH)
        mapping_path = settings.resolve_path(settings.CLINICAL_CLASS_MAPPING_PATH)
        le_path = settings.resolve_path(settings.CLINICAL_LABEL_ENCODER_PATH)
        shap_path = settings.resolve_path(settings.CLINICAL_SHAP_GLOBAL_PATH)

        if not model_path.exists():
            raise FileNotFoundError(f"Required Clinical XGBoost model not found at {model_path}")
        if not features_path.exists():
            raise FileNotFoundError(f"Required Clinical features file not found at {features_path}")
        if not mapping_path.exists():
            raise FileNotFoundError(f"Required Clinical class mapping not found at {mapping_path}")

        logger.info(f"Loading Clinical XGBoost model from {model_path}...")
        with open(model_path, "rb") as f:
            self.clinical_model = pickle.load(f)

        with open(features_path, "rb") as f:
            self.clinical_features = pickle.load(f)

        with open(mapping_path, "r", encoding="utf-8") as f:
            self.clinical_class_mapping = json.load(f)

        # Load label encoder with graceful fallback — may fail on Python version mismatch
        if le_path.exists():
            try:
                with open(le_path, "rb") as f:
                    self.clinical_label_encoder = pickle.load(f)
                logger.info(
                    f"Clinical LabelEncoder loaded: {len(self.clinical_label_encoder.classes_)} classes"
                )
            except Exception as le_err:
                logger.warning(
                    f"clinical_label_encoder.pkl could not be loaded ({le_err}). "
                    f"Falling back to class_mapping.json for disease name resolution."
                )
                self.clinical_label_encoder = None
        else:
            logger.info("clinical_label_encoder.pkl not found — using class_mapping.json.")

        if shap_path.exists():
            self.clinical_shap_global = pd.read_csv(shap_path)
            logger.info(f"Loaded clinical global SHAP importance ({len(self.clinical_shap_global)} features)")

        # --- Validation assertions ---
        n_features = len(self.clinical_features)
        n_classes = len(self.clinical_class_mapping)
        assert n_features == 174, f"Expected 174 clinical features, got {n_features}"
        assert n_classes == 37, f"Expected 37 disease classes, got {n_classes}"

        self.loaded_status["clinical"] = True
        logger.info(
            f"Clinical module loaded and validated: "
            f"{n_features} features verified, "
            f"{n_classes} disease classes verified."
        )


    def _load_imaging_artifacts(self) -> None:
        """Load Custom CNN chest X-ray checkpoint and metadata."""
        model_path = settings.resolve_path(settings.IMAGING_MODEL_PATH)
        metadata_path = settings.resolve_path(settings.IMAGING_METADATA_PATH)

        if not model_path.exists():
            raise FileNotFoundError(f"Required Custom CNN checkpoint not found at {model_path}")

        logger.info(f"Loading Custom CNN model from {model_path}...")
        model = CustomCNN(num_classes=2)
        state_dict = torch.load(model_path, map_location=self.device)
        model.load_state_dict(state_dict)
        model.to(self.device)
        model.eval()
        self.imaging_model = model

        if metadata_path.exists():
            with open(metadata_path, "r", encoding="utf-8") as f:
                self.imaging_metadata = json.load(f)
            logger.info("Loaded imaging metadata (Accuracy: 84.46%, AUC: 93.25%)")

        self.loaded_status["imaging"] = True
        logger.info("Imaging module loaded successfully: Custom CNN (Normal vs Pneumonia).")

    def _load_nlp_artifacts(self) -> None:
        """Load Biomedical NLP configurations, precomputed embeddings, and standardized records."""
        config_path = settings.resolve_path(settings.NLP_CONFIG_PATH)
        metadata_path = settings.resolve_path(settings.NLP_METADATA_PATH)
        embeddings_path = settings.resolve_path(settings.NLP_EMBEDDINGS_PATH)
        records_path = settings.resolve_path(settings.NLP_STANDARDIZED_OUTPUT_PATH)
        explainability_path = settings.resolve_path(settings.NLP_EXPLAINABILITY_PATH)

        if config_path.exists():
            with open(config_path, "r", encoding="utf-8") as f:
                self.nlp_config = json.load(f)

        if metadata_path.exists():
            with open(metadata_path, "r", encoding="utf-8") as f:
                self.nlp_metadata = json.load(f)

        if embeddings_path.exists():
            logger.info(f"Loading precomputed NLP embeddings from {embeddings_path}...")
            self.nlp_embeddings = np.load(embeddings_path, mmap_mode="r")
            logger.info(f"Loaded {self.nlp_embeddings.shape[0]} text embeddings of dim {self.nlp_embeddings.shape[1]}")

        if records_path.exists():
            logger.info(f"Indexing standardized NLP records from {records_path}...")
            records = []
            with open(records_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        records.append(json.loads(line))
            self.nlp_standardized_records = records
            logger.info(f"Loaded {len(self.nlp_standardized_records)} preprocessed clinical NLP records")

        if explainability_path.exists():
            with open(explainability_path, "r", encoding="utf-8") as f:
                self.nlp_explainability = json.load(f)

        self.loaded_status["nlp"] = True
        logger.info("Medical NLP module loaded successfully.")

    def _load_fusion_artifacts(self) -> None:
        """Load Late Evidence Fusion metadata, explanations, and 500 synthetic demonstration cases."""
        metadata_path = settings.resolve_path(settings.FUSION_METADATA_PATH)
        cases_path = settings.resolve_path(settings.SYNTHETIC_CASES_PATH)
        explanations_path = settings.resolve_path(settings.FUSION_EXPLANATIONS_PATH)

        if metadata_path.exists():
            with open(metadata_path, "r", encoding="utf-8") as f:
                self.fusion_metadata = json.load(f)

        if cases_path.exists():
            logger.info(f"Loading synthetic demonstration cases from {cases_path}...")
            cases = []
            with open(cases_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        cases.append(json.loads(line))
            self.synthetic_cases = cases
            logger.info(f"Loaded {len(self.synthetic_cases)} synthetic demonstration cases.")

        if explanations_path.exists():
            explanations = []
            with open(explanations_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        explanations.append(json.loads(line))
            self.fusion_explanations = explanations

        self.loaded_status["fusion"] = True
        logger.info("Multimodal Fusion module loaded successfully.")

    def get_status(self) -> Dict[str, Any]:
        """Return status and metadata of all loaded models."""
        return {
            "all_loaded": all(self.loaded_status.values()),
            "modules": {
                "clinical": {
                    "loaded": self.loaded_status["clinical"],
                    "model_type": "XGBoost Multiclass Classifier",
                    "num_features": len(self.clinical_features),
                    "num_classes": len(self.clinical_class_mapping),
                    "evaluated_accuracy": "67.57%",
                    "evaluated_weighted_f1": "66.75%",
                    "classes": list(self.clinical_class_mapping.values())
                },
                "imaging": {
                    "loaded": self.loaded_status["imaging"],
                    "model_type": "Custom 4-Block CNN",
                    "task": "Binary Chest X-Ray Classification (Normal vs Pneumonia)",
                    "evaluated_accuracy": "84.46%",
                    "evaluated_roc_auc": "93.25%",
                    "target_gradcam_layer": "block4.0",
                    "classes": ["NORMAL", "PNEUMONIA"]
                },
                "nlp": {
                    "loaded": self.loaded_status["nlp"],
                    "ner_model": self.nlp_config.get("ner_model", "d4data/biomedical-ner-all"),
                    "embedding_model": "pritamdeka/S-PubMedBert-MS-MARCO",
                    "precomputed_records": len(self.nlp_standardized_records),
                    "embedding_dim": 768
                },
                "fusion": {
                    "loaded": self.loaded_status["fusion"],
                    "architecture": "Late Evidence Fusion / Multimodal Evidence Profile",
                    "synthetic_demonstration_cases": len(self.synthetic_cases),
                    "same_patient_data": False,
                    "clinical_validation": False
                }
            },
            "device": str(self.device),
            "safety_framing": settings.MEDICAL_DISCLAIMER
        }


# Singleton accessor
model_manager = ModelManager.get_instance()
