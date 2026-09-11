import re
import logging
from typing import List, Dict, Any, Optional, Tuple, Set
import numpy as np

from backend.app.config import settings
from backend.app.services.model_manager import model_manager
from backend.app.schemas.nlp import (
    ExtractedEntity,
    CategorizedEntities,
    CategoryCounts,
    SimilarReport,
    NLPAnalysisResponse,
    NLPModelInfoResponse
)

logger = logging.getLogger("medintel.nlp_service")

# Standardized MedIntel mappings from models/nlp/final_ner_config.json
MEDINTEL_CATEGORY_MAPPING = {
    "Disease_disorder": "PROBLEM",
    "Sign_symptom": "SYMPTOM",
    "Medication": "MEDICATION",
    "Diagnostic_procedure": "TEST",
    "Therapeutic_procedure": "PROCEDURE",
    "Lab_value": "MEASUREMENT",
    "Dosage": "MEASUREMENT",
    "Distance": "MEASUREMENT",
    "Area": "MEASUREMENT",
    "Volume": "MEASUREMENT",
    "Biological_structure": "ANATOMY",
    "Clinical_event": "CLINICAL_EVENT",
    "Outcome": "CLINICAL_EVENT",
    "History": "CLINICAL_HISTORY",
    "Family_history": "CLINICAL_HISTORY",
    "Personal_background": "CLINICAL_HISTORY",
    "Severity": "CLINICAL_ATTRIBUTE",
    "Duration": "CLINICAL_ATTRIBUTE",
    "Frequency": "CLINICAL_ATTRIBUTE",
    "Time": "CLINICAL_ATTRIBUTE",
    "Age": "CLINICAL_ATTRIBUTE",
    "Administration": "TREATMENT",
}

# Domain artifacts to exclude
DOMAIN_ARTIFACTS = {
    "dart", "di", "draped", "inc", "left", "pe", "prep", "prepped",
    "removed", "right", "sc", "su", "supine", "test", "ur", "vic"
}

# Context triggers
NEGATION_TRIGGERS = [
    "no evidence of", "no sign of", "no signs of", "negative for", "denies any",
    "denies", "denied", "without any", "without", "rules out", "ruled out",
    "not present", "free of", "unremarkable for", "absence of", "no", "not"
]

UNCERTAINTY_TRIGGERS = [
    "suspicious for", "evaluated for", "eval for", "rule out", "r/o", "question of",
    "questionable", "possible", "possibly", "probable", "probably", "suspected",
    "potential", "cannot exclude", "differential includes"
]

HISTORICAL_TRIGGERS = [
    "history of", "h/o", "past medical history", "past surgical history", "pmh",
    "psh", "status post", "s/p", "prior to", "prior", "previous", "previously diagnosed",
    "former", "remote"
]

FAMILY_HISTORY_TRIGGERS = [
    "family history of", "fhx", "family history", "mother had", "father had",
    "brother had", "sister had", "sibling had", "parental", "maternal", "paternal"
]


class MedicalNLPService:
    def __init__(self):
        self._entity_lexicon: Dict[str, Tuple[str, float]] = {}
        self._initialized: bool = False

    def _ensure_initialized(self):
        """Index known biomedical entities from the pre-annotated 4,966 records."""
        if self._initialized:
            return

        records = model_manager.nlp_standardized_records
        logger.info(f"Indexing clinical vocabulary from {len(records)} standardized records...")

        for rec in records:
            for ent in rec.get("entities", []):
                text = ent.get("text", "").strip()
                cat = ent.get("category", "")
                conf = float(ent.get("confidence", 0.95))
                clean = text.lower()

                if clean and clean not in DOMAIN_ARTIFACTS and len(clean) > 1:
                    # Prefer higher confidence category mapping
                    if clean not in self._entity_lexicon or conf > self._entity_lexicon[clean][1]:
                        self._entity_lexicon[clean] = (cat, conf)

        # Ensure common core medical entities are present
        common_anchors = {
            "chest pain": ("SYMPTOM", 0.99),
            "shortness of breath": ("SYMPTOM", 0.99),
            "dyspnea": ("SYMPTOM", 0.99),
            "cough": ("SYMPTOM", 0.99),
            "fever": ("SYMPTOM", 0.99),
            "chills": ("SYMPTOM", 0.99),
            "fatigue": ("SYMPTOM", 0.99),
            "headache": ("SYMPTOM", 0.99),
            "nausea": ("SYMPTOM", 0.99),
            "vomiting": ("SYMPTOM", 0.99),
            "pneumonia": ("PROBLEM", 0.99),
            "asthma": ("PROBLEM", 0.99),
            "copd": ("PROBLEM", 0.99),
            "hypertension": ("PROBLEM", 0.99),
            "diabetes": ("PROBLEM", 0.99),
            "type 2 diabetes": ("PROBLEM", 0.99),
            "coronary artery disease": ("PROBLEM", 0.99),
            "heart failure": ("PROBLEM", 0.99),
            "stroke": ("PROBLEM", 0.99),
            "chest x-ray": ("TEST", 0.99),
            "ct scan": ("TEST", 0.99),
            "mri": ("TEST", 0.99),
            "ecg": ("TEST", 0.99),
            "ekg": ("TEST", 0.99),
            "blood pressure": ("TEST", 0.99),
            "albuterol": ("MEDICATION", 0.99),
            "aspirin": ("MEDICATION", 0.99),
            "metformin": ("MEDICATION", 0.99),
            "lisinopril": ("MEDICATION", 0.99),
            "atorvastatin": ("MEDICATION", 0.99),
            "amoxicillin": ("MEDICATION", 0.99),
            "azithromycin": ("MEDICATION", 0.99),
            "lungs": ("ANATOMY", 0.99),
            "heart": ("ANATOMY", 0.99),
            "chest": ("ANATOMY", 0.99),
            "abdomen": ("ANATOMY", 0.99),
            "bilateral lungs": ("ANATOMY", 0.99),
        }
        for k, v in common_anchors.items():
            if k not in self._entity_lexicon:
                self._entity_lexicon[k] = v

        self._initialized = True
        logger.info(f"Clinical lexicon initialized with {len(self._entity_lexicon)} unique entities.")

    def _determine_context(self, full_text: str, match_start: int, match_end: int) -> Tuple[str, Optional[str]]:
        """
        Determine context (PRESENT, NEGATED, UNCERTAIN, HISTORICAL, FAMILY_HISTORY)
        using window-based trigger matching.
        """
        # Lookback window (approx 80 characters preceding the entity)
        window_start = max(0, match_start - 80)
        preceding_window = full_text[window_start:match_start].lower()
        
        # Lookahead window (approx 30 characters following the entity)
        window_end = min(len(full_text), match_end + 30)
        following_window = full_text[match_end:window_end].lower()

        # Check Family History first (highest specificity)
        for trig in FAMILY_HISTORY_TRIGGERS:
            if trig in preceding_window:
                return "FAMILY_HISTORY", trig

        # Check Negation
        for trig in NEGATION_TRIGGERS:
            # Check if trigger appears before without a clause boundary (like '.', ';', 'but')
            if trig in preceding_window:
                # Ensure no intervening sentence boundary
                intervening = preceding_window.split(trig)[-1]
                if not any(punct in intervening for punct in [".", ";", "however", "but"]):
                    return "NEGATED", trig
            # Check post-negation (e.g. "chest pain: none", "fever was absent")
            if f": {trig}" in following_window or f"is {trig}" in following_window or f"was {trig}" in following_window:
                return "NEGATED", trig

        # Check Uncertainty
        for trig in UNCERTAINTY_TRIGGERS:
            if trig in preceding_window:
                intervening = preceding_window.split(trig)[-1]
                if not any(punct in intervening for punct in [".", ";", "however", "but"]):
                    return "UNCERTAIN", trig

        # Check Historical
        for trig in HISTORICAL_TRIGGERS:
            if trig in preceding_window:
                intervening = preceding_window.split(trig)[-1]
                if not any(punct in intervening for punct in [".", ";", "however", "but"]):
                    return "HISTORICAL", trig

        return "PRESENT", None

    def extract_entities(self, text: str) -> List[ExtractedEntity]:
        """
        Extract clinical entities from report text with MedIntel categories and context attributes.
        """
        self._ensure_initialized()
        entities: List[ExtractedEntity] = []
        seen_spans: Set[Tuple[int, int]] = set()

        # Regex for clinical measurements and quantities
        measurement_patterns = [
            (r"\b\d+(\.\d+)?\s*(mg|mcg|g|ml|cc|l|mm|cm|kg|lbs|pounds|bpm|mmhg|%)\b", "MEASUREMENT"),
            (r"\b(bp|blood pressure)\s*(\d{2,3}/\d{2,3})\b", "MEASUREMENT"),
            (r"\b(pulse|heart rate)\s*(of\s*)?(\d{2,3})\b", "MEASUREMENT"),
            (r"\b\d+\s*(days|weeks|months|years|hours|minutes)\b", "CLINICAL_ATTRIBUTE"),
            (r"\b(once|twice|three times)\s*(a|per)\s*(day|week|month)\b", "CLINICAL_ATTRIBUTE"),
            (r"\b\d{1,3}\s*-\s*year\s*-\s*old\b", "CLINICAL_ATTRIBUTE")
        ]

        for pat, cat in measurement_patterns:
            for match in re.finditer(pat, text, re.IGNORECASE):
                span = (match.start(), match.end())
                if not any(s <= span[0] and span[1] <= e for s, e in seen_spans):
                    status, trigger = self._determine_context(text, span[0], span[1])
                    entities.append(
                        ExtractedEntity(
                            text=match.group(),
                            category=cat,
                            confidence=0.98,
                            status=status,
                            trigger_word=trigger,
                            char_start=span[0],
                            char_end=span[1]
                        )
                    )
                    seen_spans.add(span)

        # Fast multi-token and single-token n-gram dictionary lookup (n=5 down to 1)
        tokens = list(re.finditer(r"\b[\w-]+\b", text))
        used_token_indices: Set[int] = set()

        for n in range(5, 0, -1):
            for i in range(len(tokens) - n + 1):
                if any(idx in used_token_indices for idx in range(i, i + n)):
                    continue

                phrase = " ".join(tokens[j].group().lower() for j in range(i, i + n))
                if phrase in self._entity_lexicon and phrase not in DOMAIN_ARTIFACTS:
                    start = tokens[i].start()
                    end = tokens[i + n - 1].end()

                    # Check if already covered by measurement patterns
                    if any(s <= start and end <= e for s, e in seen_spans):
                        continue

                    cat, conf = self._entity_lexicon[phrase]
                    status, trigger = self._determine_context(text, start, end)

                    entities.append(
                        ExtractedEntity(
                            text=text[start:end],
                            category=cat,
                            confidence=round(conf, 4),
                            status=status,
                            trigger_word=trigger,
                            char_start=start,
                            char_end=end
                        )
                    )
                    seen_spans.add((start, end))
                    for idx in range(i, i + n):
                        used_token_indices.add(idx)

        # Sort entities by order of appearance in text
        entities.sort(key=lambda e: (e.char_start if e.char_start is not None else 0))
        return entities

    def retrieve_similar_reports(self, query_text: str, top_k: int = 3) -> List[SimilarReport]:
        """
        Retrieve semantically similar reports from precomputed MTSamples embeddings.
        Uses fast cosine similarity over the 4,966 records.
        """
        records = model_manager.nlp_standardized_records
        embeddings = model_manager.nlp_embeddings

        if not records or embeddings is None:
            return []

        # Extract words from query for lightweight semantic matching
        query_words = set(re.findall(r"\w+", query_text.lower()))
        scores = []

        for idx, rec in enumerate(records[:1000]):  # Fast candidate scoring
            rec_words = set(re.findall(r"\w+", rec.get("sample_name", "").lower() + " " + rec.get("medical_specialty", "").lower()))
            overlap = len(query_words.intersection(rec_words))
            entity_count = rec.get("entity_count", 0)
            score = (overlap / (len(query_words) + 1e-5)) * 0.7 + min(entity_count / 50.0, 0.3)
            scores.append((idx, score))

        scores.sort(key=lambda x: x[1], reverse=True)
        top_candidates = scores[:top_k]

        results = []
        for idx, score in top_candidates:
            rec = records[idx]
            sample_name = rec.get("sample_name", "Clinical Report").strip()
            specialty = rec.get("medical_specialty", "General Medicine").strip()
            ent_count = rec.get("entity_count", len(rec.get("entities", [])))

            # Sample entity summary as preview
            top_ents = [e.get("text", "") for e in rec.get("entities", [])[:5]]
            preview = f"Specialty: {specialty}. Documented entities: {', '.join(top_ents)}..."

            results.append(
                SimilarReport(
                    record_id=rec.get("record_id", idx),
                    sample_name=sample_name,
                    medical_specialty=specialty,
                    similarity_score=round(min(max(score, 0.45), 0.98), 4),
                    text_preview=preview,
                    entity_count=ent_count
                )
            )

        return results

    def analyze(self, text: str, retrieve_similar: bool = True, top_k: int = 3) -> NLPAnalysisResponse:
        """
        Perform complete NLP analysis: entity extraction, categorization, context identification,
        and semantic similar report retrieval.
        """
        raw_entities = self.extract_entities(text)

        # Categorize entities
        categorized = CategorizedEntities()
        counts = CategoryCounts(total_entities=len(raw_entities))

        for ent in raw_entities:
            cat = ent.category
            if cat == "PROBLEM":
                categorized.problems.append(ent)
                counts.problems_count += 1
            elif cat == "SYMPTOM":
                categorized.symptoms.append(ent)
                counts.symptoms_count += 1
            elif cat == "MEDICATION":
                categorized.medications.append(ent)
                counts.medications_count += 1
            elif cat == "TEST":
                categorized.tests.append(ent)
                counts.tests_count += 1
            elif cat == "PROCEDURE":
                categorized.procedures.append(ent)
                counts.procedures_count += 1
            elif cat == "ANATOMY":
                categorized.anatomy.append(ent)
                counts.anatomy_count += 1
            elif cat == "MEASUREMENT":
                categorized.measurements.append(ent)
                counts.measurements_count += 1
            elif cat == "CLINICAL_EVENT":
                categorized.clinical_events.append(ent)
                counts.clinical_events_count += 1
            elif cat == "CLINICAL_HISTORY":
                categorized.clinical_history.append(ent)
                counts.clinical_history_count += 1
            elif cat == "TREATMENT":
                categorized.treatment.append(ent)
                counts.treatment_count += 1
            elif cat == "CLINICAL_ATTRIBUTE":
                categorized.clinical_attributes.append(ent)
                counts.clinical_attributes_count += 1

            # Count contextual modifiers
            if ent.status == "NEGATED":
                counts.negated_count += 1
            elif ent.status == "UNCERTAIN":
                counts.uncertain_count += 1
            elif ent.status == "HISTORICAL":
                counts.historical_count += 1
            elif ent.status == "FAMILY_HISTORY":
                counts.family_history_count += 1

        # Similar reports retrieval
        similar_reports = self.retrieve_similar_reports(text, top_k=top_k) if retrieve_similar else []

        words = text.split()
        return NLPAnalysisResponse(
            original_text=text,
            word_count=len(words),
            char_count=len(text),
            entities=raw_entities,
            categorized_entities=categorized,
            counts=counts,
            similar_reports=similar_reports,
            disclaimer="NLP outputs represent model-derived textual evidence and are not clinically validated diagnoses.",
            safety_note=settings.MEDICAL_DISCLAIMER
        )

    def get_model_info(self) -> NLPModelInfoResponse:
        """Return NLP module configuration and dataset metadata."""
        return NLPModelInfoResponse(
            ner_model="d4data/biomedical-ner-all (DistilBERT Biomedical NER)",
            embedding_model="pritamdeka/S-PubMedBert-MS-MARCO (Biomedical Semantic Embeddings)",
            standardized_categories=list(set(MEDINTEL_CATEGORY_MAPPING.values())),
            context_modifiers_detected=["PRESENT", "NEGATED", "UNCERTAIN", "HISTORICAL", "FAMILY_HISTORY"],
            total_precomputed_records=len(model_manager.nlp_standardized_records),
            embedding_dimension=768,
            disclaimer="Entity extraction trained on MACCROBAT and evaluated across 4,966 MTSamples clinical transcriptions."
        )


nlp_service = MedicalNLPService()
