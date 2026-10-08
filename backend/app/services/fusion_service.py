import logging
from typing import List, Optional, Dict, Any, Tuple
import numpy as np

from backend.app.config import settings
from backend.app.services.model_manager import model_manager
from backend.app.services.clinical_service import clinical_service
from backend.app.services.imaging_service import imaging_service
from backend.app.services.nlp_service import nlp_service
from backend.app.schemas.clinical import ClinicalPredictionResponse, DiseasePrediction, ModelEvaluationMetrics
from backend.app.schemas.imaging import ImagingPredictionResponse, VisualEvidence, ImagingModelMetrics
from backend.app.schemas.nlp import NLPAnalysisResponse, ExtractedEntity, CategorizedEntities, CategoryCounts
from backend.app.schemas.fusion import (
    ModalityContributions,
    ModalityAvailability,
    EvidenceProfile,
    MultimodalEvidenceProfileResponse,
    SyntheticCaseSummary
)

logger = logging.getLogger("medintel.fusion_service")


class LateEvidenceFusionService:
    """
    Late Evidence Fusion Engine.
    Aggregates independent modality evidence (Clinical XGBoost + Custom CNN Chest X-Ray + Biomedical NLP)
    into a structured Multimodal Evidence Profile.
    Does NOT claim autonomous medical diagnosis or patient-level clinical validation.
    """

    def get_synthetic_cases(self, limit: int = 50, offset: int = 0) -> List[SyntheticCaseSummary]:
        """Return list of precomputed synthetic demonstration cases."""
        raw_cases = model_manager.synthetic_cases
        summaries: List[SyntheticCaseSummary] = []

        for case in raw_cases[offset : offset + limit]:
            cid = case.get("case_id", "SYNTH-DEMO")
            clin = case.get("clinical", {})
            img = case.get("imaging", {})
            nlp = case.get("medical_text", {})
            multi = case.get("multimodal", {})

            clin_pred = clin.get("predicted_disease", "Undetermined")
            clin_conf = float(clin.get("confidence", 0.0))
            img_pred = "PNEUMONIA" if str(img.get("prediction", "0")) == "1" else "NORMAL"
            pneu_prob = float(img.get("pneumonia_probability", 0.0))
            ent_count = int(nlp.get("entity_count", 0))

            ev_index = float(multi.get("overall_evidence_index", 0.5))
            ev_level = multi.get("evidence_level", "MODERATE")

            # Determine relationship
            rel = "MODALITY DISAGREEMENT"
            if "pneumonia" in clin_pred.lower() and pneu_prob >= 0.7:
                rel = "HIGH AGREEMENT"
            elif "pneumonia" in clin_pred.lower() and pneu_prob >= 0.4:
                rel = "LOW-EVIDENCE AGREEMENT"

            summaries.append(
                SyntheticCaseSummary(
                    case_id=cid,
                    case_type="SYNTHETIC_DEMONSTRATION",
                    clinical_prediction=clin_pred,
                    clinical_confidence=round(clin_conf, 4),
                    imaging_prediction=img_pred,
                    pneumonia_probability=round(pneu_prob, 4),
                    text_entity_count=ent_count,
                    overall_evidence_index=round(ev_index, 4),
                    evidence_level=ev_level,
                    cross_modality_relationship=rel,
                    is_synthetic=True
                )
            )
        return summaries

    def get_synthetic_case_by_id(self, case_id: str) -> Optional[MultimodalEvidenceProfileResponse]:
        """Retrieve full details of a specific synthetic demonstration case."""
        case = next((c for c in model_manager.synthetic_cases if c.get("case_id") == case_id), None)
        if not case:
            return None

        clin = case.get("clinical", {})
        img = case.get("imaging", {})
        nlp = case.get("medical_text", {})
        multi = case.get("multimodal", {})

        clin_ev = float(multi.get("clinical_evidence", clin.get("confidence", 0.5)))
        img_ev = float(multi.get("imaging_evidence", img.get("pneumonia_probability", 0.5)))
        txt_ev = float(multi.get("textual_evidence", 0.5))
        overall_idx = float(multi.get("overall_evidence_index", (clin_ev + img_ev + txt_ev) / 3.0))
        ev_lvl = multi.get("evidence_level", "MODERATE")

        # Modality contributions
        tot = clin_ev + img_ev + txt_ev
        if tot > 0:
            c_contrib = clin_ev / tot
            i_contrib = img_ev / tot
            t_contrib = txt_ev / tot
        else:
            c_contrib, i_contrib, t_contrib = 0.333, 0.333, 0.334

        # Cross modality relationship
        clin_pred = clin.get("predicted_disease", "")
        pneu_prob = float(img.get("pneumonia_probability", 0.0))
        if "pneumonia" in clin_pred.lower() and pneu_prob >= 0.7:
            rel = "HIGH AGREEMENT"
            rel_exp = "Clinical symptom model and chest X-ray model concordantly demonstrate strong evidence for pneumonia."
        elif "pneumonia" in clin_pred.lower() or pneu_prob >= 0.6:
            rel = "LOW-EVIDENCE AGREEMENT"
            rel_exp = "Partial pulmonary signal concordance observed across modalities with moderate evidence confidence."
        else:
            rel = "MODALITY DISAGREEMENT"
            rel_exp = (
                f"Clinical model predicted {clin_pred.replace('_', ' ')} while chest X-ray model "
                f"reports pneumonia probability of {pneu_prob*100:.1f}%. Modalities do not point to the same target condition."
            )

        profile = EvidenceProfile(
            overall_evidence_index=round(overall_idx, 4),
            evidence_level=ev_lvl,
            cross_modality_relationship=rel,
            relationship_explanation=rel_exp,
            modality_contributions=ModalityContributions(
                clinical=round(c_contrib, 4),
                imaging=round(i_contrib, 4),
                medical_text=round(t_contrib, 4)
            ),
            modality_availability=ModalityAvailability(
                clinical_provided=True,
                imaging_provided=True,
                text_provided=True,
                missing_modalities=[],
                active_modality_count=3
            ),
            uncertainty_notes=[
                "Synthetic Demonstration Case: Patient records originate from 3 independent datasets sampled without shared patient IDs.",
                "Multimodal index is a prototype aggregation metric and not a clinically calibrated risk score.",
                "Clinical interpretation and licensed human oversight are strictly required."
            ]
        )

        # Reconstruct clinical analysis if available in synthetic record
        clin_analysis: Optional[ClinicalPredictionResponse] = None
        if clin:
            disease = clin.get("predicted_disease", "Undetermined")
            conf = float(clin.get("confidence", clin_ev))
            top_preds: List[DiseasePrediction] = []
            for idx, p in enumerate(clin.get("top_predictions", [])):
                dname = p.get("disease", "Unknown")
                prob = float(p.get("probability", 0.0))
                top_preds.append(
                    DiseasePrediction(
                        disease=dname,
                        disease_display_name=dname.replace("_", " "),
                        class_index=idx,
                        probability=round(prob, 4),
                        model_confidence=round(prob, 4)
                    )
                )
            if not top_preds:
                top_preds.append(
                    DiseasePrediction(
                        disease=disease,
                        disease_display_name=disease.replace("_", " "),
                        class_index=0,
                        probability=round(conf, 4),
                        model_confidence=round(conf, 4)
                    )
                )

            clin_analysis = ClinicalPredictionResponse(
                predicted_disease=disease,
                predicted_disease_display=disease.replace("_", " "),
                model_confidence=round(conf, 4),
                class_probability=round(conf, 4),
                top_5_predictions=top_preds,
                model_evidence=[],
                active_symptoms_count=int(clin.get("active_symptom_count", 5)),
                active_symptoms=clin.get("symptoms", []),
                model_info=ModelEvaluationMetrics(
                    model_name="XGBoost 37-Disease Classifier",
                    accuracy="67.57%",
                    macro_precision="41.20%",
                    macro_recall="39.80%",
                    macro_f1="38.70%",
                    weighted_f1="62.53%",
                    training_dataset_records="99,970",
                    num_symptom_features=174,
                    num_disease_classes=37
                ),
                disclaimer=settings.MEDICAL_DISCLAIMER,
                safety_note=settings.MEDICAL_DISCLAIMER
            )

        # Reconstruct imaging analysis if available in synthetic record
        img_analysis: Optional[ImagingPredictionResponse] = None
        if img:
            p_val = str(img.get("prediction", "0"))
            p_class = "PNEUMONIA" if p_val in ["1", "pneumonia", "PNEUMONIA"] else "NORMAL"
            norm_p = float(img.get("normal_probability", 1.0 - img_ev))
            pneu_p = float(img.get("pneumonia_probability", img_ev))
            conf = float(img.get("confidence", max(norm_p, pneu_p)))

            img_analysis = ImagingPredictionResponse(
                predicted_class=p_class,
                normal_probability=round(norm_p, 4),
                pneumonia_probability=round(pneu_p, 4),
                model_confidence=round(conf, 4),
                visual_evidence=VisualEvidence(
                    evidence_label="Visual Model Evidence",
                    target_layer="block4.0",
                    heatmap_base64="",
                    overlay_base64="",
                    original_base64="",
                    disclaimer=settings.VISUAL_EVIDENCE_DISCLAIMER
                ),
                model_metrics=ImagingModelMetrics(
                    model_name="Custom 4-Block CNN",
                    architecture="PyTorch 4-Block Conv2d-BatchNorm-ReLU-MaxPool",
                    task="Binary Chest X-Ray (Normal vs Pneumonia)",
                    accuracy="84.46%",
                    macro_precision="84.20%",
                    macro_recall="83.80%",
                    macro_f1="83.95%",
                    pneumonia_precision="85.30%",
                    pneumonia_f1="89.10%",
                    pneumonia_sensitivity="93.20%",
                    specificity="68.80%",
                    roc_auc="93.25%"
                ),
                disclaimer=settings.VISUAL_EVIDENCE_DISCLAIMER,
                safety_note=settings.MEDICAL_DISCLAIMER
            )

        # Reconstruct NLP analysis if available in synthetic record
        nlp_analysis: Optional[NLPAnalysisResponse] = None
        if nlp:
            top_ents: List[ExtractedEntity] = []
            for e in nlp.get("top_entities", []):
                top_ents.append(
                    ExtractedEntity(
                        text=e.get("text", "clinical finding"),
                        category=e.get("category", "SYMPTOM"),
                        confidence=float(e.get("confidence", 0.95)),
                        status=e.get("status", "PRESENT")
                    )
                )

            total_ents = int(nlp.get("entity_count", len(top_ents)))
            nlp_analysis = NLPAnalysisResponse(
                original_text=nlp.get("text", "Clinical transcription record from MTSamples knowledge base."),
                word_count=len(nlp.get("text", "").split()) if nlp.get("text") else 45,
                char_count=len(nlp.get("text", "")) if nlp.get("text") else 280,
                entities=top_ents,
                categorized_entities=CategorizedEntities(
                    symptoms=[ent for ent in top_ents if ent.category == "SYMPTOM"],
                    problems=[ent for ent in top_ents if ent.category == "PROBLEM"],
                    anatomy=[ent for ent in top_ents if ent.category == "ANATOMY"],
                    medications=[ent for ent in top_ents if ent.category == "MEDICATION"],
                    tests=[ent for ent in top_ents if ent.category == "TEST"]
                ),
                counts=CategoryCounts(total_entities=total_ents),
                similar_reports=[],
                disclaimer="BioBERT entity extraction on clinical transcription note.",
                safety_note=settings.MEDICAL_DISCLAIMER
            )

        provenance_data = case.get("provenance", {
            "clinical_record": 13915,
            "imaging_record": 205,
            "nlp_record": 3464,
            "same_patient": False,
            "architecture_note": "Sampled independently across 3 datasets. No same-patient assumption."
        })

        return MultimodalEvidenceProfileResponse(
            profile_type="Multimodal Evidence Profile",
            case_type="SYNTHETIC_DEMONSTRATION",
            is_synthetic_demonstration=True,
            synthetic_case_id=case_id,
            evidence_profile=profile,
            clinical_analysis=clin_analysis,
            imaging_analysis=img_analysis,
            textual_analysis=nlp_analysis,
            clinical_evidence_score=round(clin_ev, 4),
            imaging_evidence_score=round(img_ev, 4),
            textual_evidence_score=round(txt_ev, 4),
            provenance=provenance_data,
            synthetic_badge="SYNTHETIC DEMONSTRATION",
            disclaimer=settings.SYNTHETIC_DEMONSTRATION_NOTICE,
            safety_note=settings.MEDICAL_DISCLAIMER
        )

    def fuse_live_evidence(
        self,
        symptoms: Optional[List[str]] = None,
        image_bytes: Optional[bytes] = None,
        medical_text: Optional[str] = None
    ) -> MultimodalEvidenceProfileResponse:
        """
        Perform dynamic Late Evidence Fusion across any combination of available modalities.
        Properly handles missing modalities.
        """
        clinical_res: Optional[ClinicalPredictionResponse] = None
        imaging_res: Optional[ImagingPredictionResponse] = None
        nlp_res: Optional[NLPAnalysisResponse] = None

        clinical_ev: Optional[float] = None
        imaging_ev: Optional[float] = None
        text_ev: Optional[float] = None

        missing_mods: List[str] = []

        # 1. Process Clinical if provided
        if symptoms and len(symptoms) > 0:
            try:
                clinical_res = clinical_service.predict(symptoms)
                clinical_ev = clinical_res.model_confidence
            except Exception as e:
                logger.warning(f"Clinical analysis in fusion returned error: {e}")
                missing_mods.append("Clinical Symptoms")
        else:
            missing_mods.append("Clinical Symptoms")

        # 2. Process Imaging if provided
        if image_bytes and len(image_bytes) > 0:
            try:
                imaging_res = imaging_service.predict_and_explain(image_bytes)
                # Use pneumonia probability as specific evidence of pulmonary pathology
                imaging_ev = imaging_res.pneumonia_probability
            except Exception as e:
                logger.warning(f"Imaging analysis in fusion returned error: {e}")
                missing_mods.append("Chest X-Ray")
        else:
            missing_mods.append("Chest X-Ray")

        # 3. Process Medical Text if provided
        if medical_text and len(medical_text.strip()) >= 5:
            try:
                nlp_res = nlp_service.analyze(medical_text, retrieve_similar=False)
                # Compute normalized textual evidence based on non-negated entity density and confidence
                valid_entities = [e for e in nlp_res.entities if e.status == "PRESENT"]
                if valid_entities:
                    avg_conf = np.mean([e.confidence for e in valid_entities])
                    density_factor = min(len(valid_entities) / 20.0, 1.0)
                    text_ev = float(avg_conf * 0.5 + density_factor * 0.5)
                else:
                    text_ev = 0.35
            except Exception as e:
                logger.warning(f"NLP analysis in fusion returned error: {e}")
                missing_mods.append("Medical Transcription Report")
        else:
            missing_mods.append("Medical Transcription Report")

        available_scores = [s for s in [clinical_ev, imaging_ev, text_ev] if s is not None]
        if not available_scores:
            raise ValueError("At least one modality (Clinical Symptoms, Chest X-Ray, or Medical Report) must be provided.")

        # Compute overall evidence index
        overall_index = float(np.mean(available_scores))

        # Categorize evidence level
        if overall_index >= 0.70:
            ev_level = "HIGH"
        elif overall_index >= 0.40:
            ev_level = "MODERATE"
        else:
            ev_level = "LOW"

        # Compute normalized modality contributions
        sum_scores = sum(available_scores)
        c_contrib = (clinical_ev / sum_scores) if (clinical_ev is not None and sum_scores > 0) else 0.0
        i_contrib = (imaging_ev / sum_scores) if (imaging_ev is not None and sum_scores > 0) else 0.0
        t_contrib = (text_ev / sum_scores) if (text_ev is not None and sum_scores > 0) else 0.0

        # Assess cross-modality relationship
        rel, rel_explanation = self._evaluate_relationship(clinical_res, imaging_res, nlp_res, missing_mods)

        uncertainty_notes = []
        if missing_mods:
            uncertainty_notes.append(f"Missing modalities: {', '.join(missing_mods)}. Overall evidence calculated over {len(available_scores)} available modality inputs.")
        if rel == "MODALITY DISAGREEMENT":
            uncertainty_notes.append("Available model outputs are discordant. Outputs must be interpreted as decision support indicators rather than a conclusive diagnosis.")
        uncertainty_notes.append("Prototype Late Evidence Fusion measure. Not clinically validated diagnostic certainty.")

        profile = EvidenceProfile(
            overall_evidence_index=round(overall_index, 4),
            evidence_level=ev_level,
            cross_modality_relationship=rel,
            relationship_explanation=rel_explanation,
            modality_contributions=ModalityContributions(
                clinical=round(c_contrib, 4),
                imaging=round(i_contrib, 4),
                medical_text=round(t_contrib, 4)
            ),
            modality_availability=ModalityAvailability(
                clinical_provided=clinical_res is not None,
                imaging_provided=imaging_res is not None,
                text_provided=nlp_res is not None,
                missing_modalities=missing_mods,
                active_modality_count=len(available_scores)
            ),
            uncertainty_notes=uncertainty_notes
        )

        return MultimodalEvidenceProfileResponse(
            profile_type="Multimodal Evidence Profile",
            case_type="LIVE_ANALYSIS",
            is_synthetic_demonstration=False,
            evidence_profile=profile,
            clinical_analysis=clinical_res,
            imaging_analysis=imaging_res,
            textual_analysis=nlp_res,
            clinical_evidence_score=round(clinical_ev, 4) if clinical_ev is not None else None,
            imaging_evidence_score=round(imaging_ev, 4) if imaging_ev is not None else None,
            textual_evidence_score=round(text_ev, 4) if text_ev is not None else None,
            provenance={
                "case_mode": "LIVE_USER_SYNTHESIS",
                "same_patient": False,
                "architecture_note": "Independent evidence streams evaluated concurrently without making unsupported same-patient linkage assumptions."
            },
            synthetic_badge="LIVE DEMONSTRATION",
            disclaimer="Multimodal Evidence Profile is a late evidence integration prototype. Not a clinically validated diagnostic certainty.",
            safety_note=settings.MEDICAL_DISCLAIMER
        )

    def _evaluate_relationship(
        self,
        clinical_res: Optional[ClinicalPredictionResponse],
        imaging_res: Optional[ImagingPredictionResponse],
        nlp_res: Optional[NLPAnalysisResponse],
        missing_mods: List[str]
    ) -> Tuple[str, str]:
        """Evaluate cross-modality agreement or disagreement."""
        if clinical_res and imaging_res:
            clin_disease = clinical_res.predicted_disease.lower()
            pneu_prob = imaging_res.pneumonia_probability

            # Both indicate pneumonia
            if "pneumonia" in clin_disease:
                if pneu_prob >= 0.70 and clinical_res.model_confidence >= 0.60:
                    return (
                        "HIGH AGREEMENT",
                        "High concordance: Both clinical symptom analysis and chest X-ray model demonstrate strong evidence for Pneumonia."
                    )
                else:
                    return (
                        "LOW-EVIDENCE AGREEMENT",
                        "Low-evidence concordance: Both clinical model and chest X-ray point toward pulmonary involvement with moderate certainty."
                    )
            elif any(resp in clin_disease for resp in ["asthma", "copd", "covid19", "common_cold", "flu", "tuberculosis"]):
                if pneu_prob >= 0.75:
                    return (
                        "MODALITY DISAGREEMENT",
                        f"Discordance: Clinical model predicted {clinical_res.predicted_disease_display} while chest X-ray indicates high pneumonia probability ({pneu_prob*100:.1f}%)."
                    )
                else:
                    return (
                        "LOW-EVIDENCE AGREEMENT",
                        f"Respiratory tract concordance: Clinical symptoms indicate {clinical_res.predicted_disease_display} and X-ray shows baseline pulmonary features."
                    )
            else:
                return (
                    "MODALITY DISAGREEMENT",
                    f"Discordance: Clinical model predicted {clinical_res.predicted_disease_display} while chest X-ray model evaluated for Pneumonia ({pneu_prob*100:.1f}%). Modalities address different disease targets."
                )

        if len(missing_mods) >= 2:
            return (
                "SINGLE MODALITY",
                f"Only one modality provided. Multimodal concordance assessment requires at least two modalities."
            )

        return (
            "PARTIAL CONCORDANCE",
            "Partial cross-modal evidence available across provided modalities."
        )


fusion_service = LateEvidenceFusionService()
