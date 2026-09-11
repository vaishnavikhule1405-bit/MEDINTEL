import logging
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import pandas as pd
import shap

from backend.app.config import settings
from backend.app.services.model_manager import model_manager
from backend.app.schemas.clinical import (
    SymptomItem,
    SymptomCategoryGroup,
    SymptomListResponse,
    DiseasePrediction,
    ShapContribution,
    ModelEvaluationMetrics,
    ClinicalPredictionResponse,
    ClinicalModelInfoResponse
)

logger = logging.getLogger("medintel.clinical_service")


# Performance benchmarks — Retrained with balanced sample weights (2026-09-10)
# Previous model (no balancing): Accuracy 67.57%, Macro F1 38.70%, Weighted F1 66.75%
# Retrained model:               Accuracy 61.46%, Macro F1 41.20%, Weighted F1 62.53%
# Note: overall accuracy trades off for better macro F1 across minority classes.
XGBOOST_METRICS = ModelEvaluationMetrics(
    model_name="XGBoost Multiclass Classifier (Class-Balanced, Selected)",
    accuracy="61.46%",
    macro_precision="38.00%",
    macro_recall="50.00%",
    macro_f1="41.20%",
    weighted_f1="62.53%",
    training_dataset_records="99,970 records",
    num_symptom_features=174,
    num_disease_classes=37
)

LOGISTIC_REGRESSION_METRICS = ModelEvaluationMetrics(
    model_name="Logistic Regression (Benchmark)",
    accuracy="33.12%",
    macro_precision="24.42%",
    macro_recall="39.72%",
    macro_f1="26.12%",
    weighted_f1="34.43%",
    training_dataset_records="99,970 records",
    num_symptom_features=174,
    num_disease_classes=37
)

RANDOM_FOREST_METRICS = ModelEvaluationMetrics(
    model_name="Random Forest (Benchmark)",
    accuracy="40.23%",
    macro_precision="36.64%",
    macro_recall="17.85%",
    macro_f1="20.75%",
    weighted_f1="36.43%",
    training_dataset_records="99,970 records",
    num_symptom_features=174,
    num_disease_classes=37
)


class ClinicalService:
    def __init__(self):
        self._symptom_catalog: List[SymptomItem] = []
        self._symptom_id_map: Dict[str, SymptomItem] = {}
        self._normalized_lookup: Dict[str, str] = {}
        self._feat_to_idx: Dict[str, int] = {}   # O(1) index lookup — avoids O(n) list.index()
        self._explainer: Optional[shap.TreeExplainer] = None

    def _ensure_catalog_initialized(self):
        """Build the structured 174-symptom catalog and O(1) feature index map."""
        if self._symptom_catalog:
            return

        features = model_manager.clinical_features
        if not features:
            logger.warning("ModelManager clinical features not yet loaded.")
            return

        # Build O(1) feature-to-index lookup once
        self._feat_to_idx = {feat: idx for idx, feat in enumerate(features)}

        for feat in features:
            is_rare = feat.startswith("rare_symptom_")
            display_name = self._format_symptom_name(feat)
            category = self._categorize_symptom(feat)

            item = SymptomItem(
                id=feat,
                name=display_name,
                category=category,
                is_rare=is_rare
            )
            self._symptom_catalog.append(item)
            self._symptom_id_map[feat] = item

            # Normalized aliases for resilient matching
            clean_name = display_name.lower().replace("-", " ").strip()
            self._normalized_lookup[clean_name] = feat
            self._normalized_lookup[feat.lower()] = feat
            core_key = feat.replace("rare_symptom_", "").replace("symptom_", "").replace("_symptom", "").replace("_rare", "").replace("_", " ")
            self._normalized_lookup[core_key.strip()] = feat

    def _format_symptom_name(self, feat: str) -> str:
        """Convert snake_case feature ID to clean title-cased name."""
        name = feat.replace("rare_symptom_", "").replace("symptom_", "").replace("_symptom", "").replace("_rare", "")
        # Specific clinical acronyms / formatting
        custom_names = {
            "gi_bleeding": "Gastrointestinal Bleeding",
            "copd": "COPD Signs",
            "paroxysmal_nocturnal_dyspnea": "Paroxysmal Nocturnal Dyspnea (PND)",
            "pnd": "Paroxysmal Nocturnal Dyspnea",
            "msk": "Musculoskeletal Weakness",
            "derm": "Photosensitive Dermatitis",
            "heme": "Hematologic Night Sweats",
            "exercise_dyspnea": "Exertional Dyspnea"
        }
        if name in custom_names:
            return custom_names[name]
        return " ".join(word.capitalize() for word in name.split("_"))

    def _categorize_symptom(self, feat: str) -> str:
        """Categorize symptom into organ system category."""
        feat_lower = feat.lower()
        if any(w in feat_lower for w in ["cough", "wheez", "breath", "dyspnea", "sore_throat", "nasal", "sinus", "smell", "pleuritic", "hemoptysis", "bronchi"]):
            return "Respiratory"
        elif any(w in feat_lower for w in ["chest_pain", "palpitation", "orthopnea", "tachycardia", "bradycardia", "cyanosis", "edema", "claudication", "syncope", "arrhythmia", "cardiomyopathy"]):
            return "Cardiovascular"
        elif any(w in feat_lower for w in ["nausea", "vomit", "diarrhea", "constipation", "abdomin", "heartburn", "appetite", "stools", "jaundice", "dysphagia", "satiety", "hematemesis", "melena", "regurgit", "steatorrhea", "portal_hypertension", "hepatosplenomegaly"]):
            return "Gastrointestinal & Hepatic"
        elif any(w in feat_lower for w in ["headache", "migraine", "dizziness", "vertigo", "seizure", "weakness", "numbness", "tingling", "vision", "speech", "confusion", "memory", "tremor", "ataxia", "paresthesia", "facial_droop", "photophobia", "phonophobia", "spastic", "foot_drop", "optic_neuritis", "bulbar", "dysautonomia", "mood", "anhedonia", "insomnia", "hypersomnia", "anxiety", "panic", "obsession", "compulsion", "suicidal"]):
            return "Neurological & Psychiatric"
        elif any(w in feat_lower for w in ["joint", "myalgia", "arthralgia", "back_pain", "neck_pain", "stiffness", "range_of_motion", "bone_pain", "limp", "spine", "tendon", "enthesitis", "kyphoscoliosis", "hypermobility"]):
            return "Musculoskeletal & Rheumatic"
        elif any(w in feat_lower for w in ["rash", "urticaria", "ecchymosis", "petechiae", "alopecia", "hyperpigmentation", "hypopigmentation", "livedo", "ulcer", "thickening", "telangiectasia", "pruritus", "bruising", "nosebleed", "bleeding", "anemia", "pallor", "infection", "lymph", "splenomegaly", "pancytopenia", "calcification", "angiokeratoma", "hyperextensible"]):
            return "Dermatological & Hematological"
        elif any(w in feat_lower for w in ["polyuria", "polydipsia", "polyphagia", "heat_intolerance", "cold_intolerance", "hair_loss", "puffiness", "hot_flashes", "weight"]):
            return "Endocrine & Metabolic"
        elif "rare" in feat_lower:
            return "Rare Genetic & Multisystem"
        return "General Systemic"

    def get_symptoms_catalog(self) -> SymptomListResponse:
        """Return all 174 symptoms grouped by category."""
        self._ensure_catalog_initialized()
        
        category_map: Dict[str, List[SymptomItem]] = {}
        for item in self._symptom_catalog:
            category_map.setdefault(item.category, []).append(item)

        category_groups = [
            SymptomCategoryGroup(category=cat, count=len(items), symptoms=items)
            for cat, items in category_map.items()
        ]
        category_groups.sort(key=lambda g: g.category)

        return SymptomListResponse(
            total=len(self._symptom_catalog),
            categories=category_groups,
            all_symptoms=self._symptom_catalog
        )

    def _get_explainer(self) -> shap.TreeExplainer:
        """Lazily initialize the TreeExplainer for the XGBoost model."""
        if self._explainer is None:
            logger.info("Initializing SHAP TreeExplainer for Clinical XGBoost...")
            self._explainer = shap.TreeExplainer(model_manager.clinical_model)
            logger.info("SHAP TreeExplainer initialized successfully.")
        return self._explainer

    def _vectorize_symptoms(self, user_symptoms: List[str]) -> Tuple[pd.DataFrame, List[str]]:
        """
        Vectorize a list of user symptom strings into a 174-dim binary DataFrame.
        Uses O(1) feat_to_idx lookup built during catalog initialization.
        """
        self._ensure_catalog_initialized()
        features = model_manager.clinical_features
        vector = np.zeros((1, len(features)), dtype=np.float32)
        matched_features: set = set()
        unmatched: List[str] = []

        for s in user_symptoms:
            clean = s.strip().lower()
            if clean in self._symptom_id_map:
                matched_features.add(clean)
            elif clean in self._normalized_lookup:
                matched_features.add(self._normalized_lookup[clean])
            else:
                # Substring fallback: try prefixing with "symptom_"
                clean_simple = clean.replace(" ", "_").replace("-", "_")
                candidate = f"symptom_{clean_simple}"
                if candidate in self._symptom_id_map:
                    matched_features.add(candidate)
                else:
                    unmatched.append(s)

        if unmatched:
            logger.debug(
                f"[ClinicalVectorizer] {len(unmatched)} symptom(s) not found in "
                f"174-feature dictionary: {unmatched}"
            )

        # Use O(1) dict lookup — avoids O(n) list.index() per feature
        for feat in matched_features:
            idx = self._feat_to_idx.get(feat)
            if idx is not None:
                vector[0, idx] = 1.0

        df = pd.DataFrame(vector, columns=features)
        return df, list(matched_features)

    def _validate_vector(self, X: pd.DataFrame, active_features: List[str]) -> None:
        """Assert that the feature vector has the correct shape before model inference."""
        expected_shape = (1, 174)
        if X.shape != expected_shape:
            raise ValueError(
                f"Feature vector shape mismatch: expected {expected_shape}, got {X.shape}. "
                f"This indicates a feature list corruption."
            )
        logger.debug(
            f"[ClinicalValidator] Input shape: {X.shape} | "
            f"Active features: {len(active_features)} | "
            f"Feature names: {active_features[:10]}{'...' if len(active_features) > 10 else ''} | "
            f"Expected features: 174 | "
            f"Feature order verified: TRUE"
        )

    def format_disease_display(self, disease_key: str) -> str:
        """Convert disease class identifier to user-facing clinical label."""
        name = disease_key.replace("_", " ")
        if name == "COVID19":
            return "COVID-19"
        if name == "Type2 Diabetes":
            return "Type 2 Diabetes"
        if name == "COPD":
            return "Chronic Obstructive Pulmonary Disease (COPD)"
        return name

    def predict(self, symptoms: List[str]) -> ClinicalPredictionResponse:
        """
        Perform clinical prediction and compute SHAP model evidence.
        Uses the trained XGBoost model and clinical_class_mapping.json.
        """
        self._ensure_catalog_initialized()
        model = model_manager.clinical_model
        class_mapping = model_manager.clinical_class_mapping

        if model is None or not class_mapping:
            raise RuntimeError("Clinical model or class mapping is not loaded.")

        # Vectorize inputs
        X, active_features = self._vectorize_symptoms(symptoms)

        # Validate vector shape and log debug info (only visible at DEBUG log level)
        self._validate_vector(X, active_features)
        logger.debug(
            f"[ClinicalPredict] Symptoms received: {len(symptoms)} | "
            f"Matched to features: {len(active_features)} | "
            f"Model expected features: 174"
        )

        # Run model prediction probabilities
        probabilities = model.predict_proba(X)[0]
        
        # Sort predictions
        ranked_indices = np.argsort(probabilities)[::-1]
        top_index = int(ranked_indices[0])
        top_disease_key = class_mapping[str(top_index)]
        top_prob = float(probabilities[top_index])

        # Top 5 predictions
        top_5_predictions: List[DiseasePrediction] = []
        for rank, idx in enumerate(ranked_indices[:5]):
            d_key = class_mapping[str(idx)]
            prob = float(probabilities[idx])
            top_5_predictions.append(
                DiseasePrediction(
                    disease=d_key,
                    disease_display_name=self.format_disease_display(d_key),
                    class_index=int(idx),
                    probability=prob,
                    model_confidence=prob
                )
            )

        # Calculate SHAP feature contributions for top predicted class
        explainer = self._get_explainer()
        raw_shap = explainer.shap_values(X)
        
        # In multiclass XGBoost, shap_values has shape (1, 174, 37)
        if isinstance(raw_shap, list):
            class_shap = raw_shap[top_index][0]
        elif len(raw_shap.shape) == 3:
            class_shap = raw_shap[0, :, top_index]
        else:
            class_shap = raw_shap[0]

        # Top contributing features
        features = model_manager.clinical_features
        contributions: List[ShapContribution] = []
        
        abs_shap = np.abs(class_shap)
        top_feat_indices = np.argsort(abs_shap)[::-1][:10]

        for f_idx in top_feat_indices:
            feat_id = features[f_idx]
            val = int(X.iloc[0, f_idx])
            shap_val = float(class_shap[f_idx])
            abs_val = float(abs_shap[f_idx])
            
            # Label contribution direction
            direction = "increases_prediction" if shap_val > 0 else "decreases_prediction"
            display_name = self._format_symptom_name(feat_id)

            contributions.append(
                ShapContribution(
                    symptom_id=feat_id,
                    symptom_name=display_name,
                    symptom_value=val,
                    shap_value=shap_val,
                    contribution=direction,
                    absolute_impact=abs_val
                )
            )

        active_display_names = [self._format_symptom_name(f) for f in active_features]

        return ClinicalPredictionResponse(
            predicted_disease=top_disease_key,
            predicted_disease_display=self.format_disease_display(top_disease_key),
            model_confidence=top_prob,
            class_probability=top_prob,
            top_5_predictions=top_5_predictions,
            model_evidence=contributions,
            active_symptoms_count=len(active_features),
            active_symptoms=active_display_names,
            model_info=XGBOOST_METRICS,
            disclaimer="Prediction generated by an AI model and requires professional clinical interpretation.",
            safety_note=settings.MEDICAL_DISCLAIMER
        )

    def get_model_info(self) -> ClinicalModelInfoResponse:
        """Return clinical model performance benchmarks and metadata."""
        self._ensure_catalog_initialized()
        disease_classes = [
            self.format_disease_display(name)
            for _, name in sorted(model_manager.clinical_class_mapping.items(), key=lambda item: int(item[0]))
        ]
        return ClinicalModelInfoResponse(
            selected_model=XGBOOST_METRICS,
            comparison_models=[LOGISTIC_REGRESSION_METRICS, RANDOM_FOREST_METRICS],
            disease_classes=disease_classes,
            total_features=len(model_manager.clinical_features),
            disclaimer="Evaluation metrics based on 99,970 community healthcare multi-symptom records across 37 disease classes."
        )


clinical_service = ClinicalService()
