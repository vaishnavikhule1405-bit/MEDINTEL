import uuid
import logging
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_

from backend.app.database import engine, Base
from backend.app.models.db_models import (
    Case,
    ClinicalInput,
    XRayAnalysis,
    MedicalReport,
    NLPEntity,
    MultimodalAnalysis,
    AssistantInteraction,
    generate_case_id
)
from backend.app.schemas.cases import (
    CaseListItem,
    CaseDetailResponse,
    AnalyticsSummaryResponse
)
from backend.app.services.model_manager import model_manager

logger = logging.getLogger("medintel.case_service")


class CaseService:
    def __init__(self):
        # Create database tables automatically
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema initialized.")

    def seed_initial_cases_if_empty(self, db: Session, count: int = 25) -> int:
        """Seed initial demonstration cases from synthetic cases if database is empty."""
        existing = db.query(func.count(Case.id)).scalar()
        if existing and existing > 0:
            return 0

        logger.info(f"Seeding {count} demonstration cases into database...")
        raw_cases = model_manager.synthetic_cases[:count]
        seeded = 0

        for raw in raw_cases:
            cid = raw.get("case_id", f"SYNTH-{seeded+1:04d}")
            clin = raw.get("clinical", {})
            img = raw.get("imaging", {})
            nlp = raw.get("medical_text", {})
            multi = raw.get("multimodal", {})

            clin_pred = clin.get("predicted_disease", "Irritable_Bowel_Syndrome")
            clin_conf = float(clin.get("confidence", 0.5))
            img_pred = "PNEUMONIA" if str(img.get("prediction", "0")) == "1" else "NORMAL"
            pneu_prob = float(img.get("pneumonia_probability", 0.5))
            norm_prob = float(img.get("normal_probability", 0.5))
            
            ev_idx = float(multi.get("overall_evidence_index", 0.5))
            ev_lvl = multi.get("evidence_level", "MODERATE")
            
            rel = "MODALITY DISAGREEMENT"
            if "pneumonia" in clin_pred.lower() and pneu_prob >= 0.7:
                rel = "HIGH AGREEMENT"
            elif "pneumonia" in clin_pred.lower() and pneu_prob >= 0.4:
                rel = "LOW-EVIDENCE AGREEMENT"

            new_case = Case(
                id=cid,
                case_number=cid,
                case_type="SYNTHETIC_DEMONSTRATION",
                patient_identifier=f"SYNTH-PATIENT-{seeded+101}",
                patient_age=45 + (seeded % 35),
                patient_sex="Female" if seeded % 2 == 0 else "Male",
                title=f"Multimodal Evidence Case ({clin_pred.replace('_', ' ')})",
                primary_condition=clin_pred.replace("_", " "),
                overall_evidence_index=round(ev_idx, 4),
                evidence_level=ev_lvl,
                cross_modality_relationship=rel
            )
            db.add(new_case)

            # Add Clinical
            clin_obj = ClinicalInput(
                case_id=cid,
                symptoms=["symptom_cough", "symptom_fever"] if "pneumonia" in clin_pred.lower() else ["symptom_fatigue", "symptom_nausea"],
                predicted_disease=clin_pred,
                confidence=round(clin_conf, 4),
                top_predictions=clin.get("top_predictions", []),
                shap_evidence=[]
            )
            db.add(clin_obj)

            # Add X-Ray
            xray_obj = XRayAnalysis(
                case_id=cid,
                image_filename="synthetic_demo_xray.png",
                predicted_class=img_pred,
                normal_probability=round(norm_prob, 4),
                pneumonia_probability=round(pneu_prob, 4),
                confidence=round(pneu_prob if img_pred == "PNEUMONIA" else norm_prob, 4),
                gradcam_target_layer="block4.0"
            )
            db.add(xray_obj)

            # Add Medical Report
            cat_counts = nlp.get("category_counts", {})
            nlp_obj = MedicalReport(
                case_id=cid,
                word_count=180 + (seeded * 5),
                char_count=1200 + (seeded * 20),
                entities_count=int(nlp.get("entity_count", 15)),
                category_counts=cat_counts,
                negated_count=int(nlp.get("negated_entities", 0)),
                uncertain_count=int(nlp.get("uncertain_entities", 0)),
                historical_count=int(nlp.get("historical_entities", 0)),
                family_history_count=int(nlp.get("family_history_entities", 0))
            )
            db.add(nlp_obj)

            # Add Multimodal Analysis
            multi_obj = MultimodalAnalysis(
                case_id=cid,
                clinical_evidence=round(clin_conf, 4),
                imaging_evidence=round(pneu_prob, 4),
                textual_evidence=round(float(multi.get("textual_evidence", 0.5)), 4),
                overall_evidence_index=round(ev_idx, 4),
                evidence_level=ev_lvl,
                cross_modality_relationship=rel,
                modality_contributions={"clinical": 0.35, "imaging": 0.40, "medical_text": 0.25},
                missing_modalities=[]
            )
            db.add(multi_obj)
            seeded += 1

        db.commit()
        logger.info(f"Successfully seeded {seeded} demonstration cases.")
        return seeded

    def list_cases(
        self,
        db: Session,
        limit: int = 50,
        offset: int = 0,
        case_type: Optional[str] = None,
        evidence_level: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[CaseListItem]:
        """Query and return paginated list of cases."""
        self.seed_initial_cases_if_empty(db)
        query = db.query(Case)

        if case_type:
            query = query.filter(Case.case_type == case_type)
        if evidence_level:
            query = query.filter(Case.evidence_level == evidence_level)
        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.filter(or_(
                Case.id.ilike(search_pattern),
                Case.case_number.ilike(search_pattern),
                Case.patient_identifier.ilike(search_pattern),
                Case.primary_condition.ilike(search_pattern),
                Case.title.ilike(search_pattern)
            ))

        records = query.order_by(desc(Case.created_at)).offset(offset).limit(limit).all()

        return [
            CaseListItem(
                id=c.id,
                case_number=c.case_number or c.id,
                case_type=c.case_type,
                patient_identifier=c.patient_identifier,
                title=c.title,
                primary_condition=c.primary_condition,
                overall_evidence_index=c.overall_evidence_index,
                evidence_level=c.evidence_level,
                cross_modality_relationship=c.cross_modality_relationship,
                created_at=c.created_at,
                modalities_present=[
                    modality
                    for modality, records in (
                        ("Clinical", c.clinical_inputs),
                        ("X-ray", c.xray_analyses),
                        ("Report", c.medical_reports),
                        ("Fusion", c.multimodal_analyses)
                    )
                    if records
                ]
            )
            for c in records
        ]

    def get_case_detail(self, db: Session, case_id: str) -> Optional[CaseDetailResponse]:
        """Return full detail of a case with all linked records."""
        self.seed_initial_cases_if_empty(db)
        c = db.query(Case).filter(Case.id == case_id).first()
        if not c:
            return None

        clin = c.clinical_inputs[0] if c.clinical_inputs else None
        xray = c.xray_analyses[0] if c.xray_analyses else None
        report = c.medical_reports[0] if c.medical_reports else None
        multi = c.multimodal_analyses[0] if c.multimodal_analyses else None

        clinical_data = {
            "predicted_disease": clin.predicted_disease,
            "confidence": clin.confidence,
            "symptoms": clin.symptoms,
            "top_predictions": clin.top_predictions
        } if clin else None

        imaging_data = {
            "predicted_class": xray.predicted_class,
            "normal_probability": xray.normal_probability,
            "pneumonia_probability": xray.pneumonia_probability,
            "confidence": xray.confidence,
            "gradcam_target_layer": xray.gradcam_target_layer
        } if xray else None

        nlp_data = {
            "word_count": report.word_count,
            "entities_count": report.entities_count,
            "category_counts": report.category_counts,
            "negated_count": report.negated_count,
            "uncertain_count": report.uncertain_count
        } if report else None

        multimodal_data = {
            "overall_evidence_index": multi.overall_evidence_index,
            "evidence_level": multi.evidence_level,
            "cross_modality_relationship": multi.cross_modality_relationship,
            "modality_contributions": multi.modality_contributions
        } if multi else None

        interactions = [
            {
                "user_message": i.user_message,
                "assistant_response": i.assistant_response,
                "tool_calls": i.tool_calls,
                "created_at": i.created_at.isoformat()
            }
            for i in c.assistant_interactions
        ]

        return CaseDetailResponse(
            id=c.id,
            case_number=c.case_number or c.id,
            case_type=c.case_type,
            patient_identifier=c.patient_identifier,
            patient_age=c.patient_age,
            patient_sex=c.patient_sex,
            title=c.title,
            primary_condition=c.primary_condition,
            overall_evidence_index=c.overall_evidence_index,
            evidence_level=c.evidence_level,
            cross_modality_relationship=c.cross_modality_relationship,
            created_at=c.created_at,
            clinical_data=clinical_data,
            imaging_data=imaging_data,
            nlp_data=nlp_data,
            multimodal_data=multimodal_data,
            assistant_interactions=interactions
        )

    def get_analytics_summary(self, db: Session) -> AnalyticsSummaryResponse:
        """Compute aggregated statistics for the Analytics & History Dashboard."""
        self.seed_initial_cases_if_empty(db)
        total_cases = db.query(func.count(Case.id)).scalar() or 0
        clinical_count = db.query(func.count(ClinicalInput.id)).scalar() or 0
        xray_count = db.query(func.count(XRayAnalysis.id)).scalar() or 0
        nlp_count = db.query(func.count(MedicalReport.id)).scalar() or 0
        multi_count = db.query(func.count(MultimodalAnalysis.id)).scalar() or 0

        # Evidence level distribution
        ev_counts = {"LOW": 0, "MODERATE": 0, "HIGH": 0}
        for lvl, count in db.query(Case.evidence_level, func.count(Case.id)).group_by(Case.evidence_level).all():
            if lvl in ev_counts:
                ev_counts[lvl] = count

        # Cross modal agreement
        agreement_counts = {
            "HIGH AGREEMENT": 0,
            "LOW-EVIDENCE AGREEMENT": 0,
            "MODALITY DISAGREEMENT": 0
        }
        for rel, count in db.query(Case.cross_modality_relationship, func.count(Case.id)).group_by(Case.cross_modality_relationship).all():
            if rel in agreement_counts:
                agreement_counts[rel] = count

        # Top predicted conditions
        top_conditions = []
        for cond, count in db.query(Case.primary_condition, func.count(Case.id)).group_by(Case.primary_condition).order_by(desc(func.count(Case.id))).limit(8).all():
            if cond:
                top_conditions.append({"condition": cond, "case_count": count})

        return AnalyticsSummaryResponse(
            total_cases=total_cases,
            clinical_analyses_count=clinical_count,
            xray_analyses_count=xray_count,
            medical_reports_count=nlp_count,
            multimodal_analyses_count=multi_count,
            evidence_level_distribution=ev_counts,
            modality_distribution={
                "Clinical XGBoost": clinical_count,
                "Chest X-Ray CNN": xray_count,
                "Biomedical NLP": nlp_count,
                "Multimodal Fusion": multi_count
            },
            cross_modal_agreement_distribution=agreement_counts,
            top_predicted_conditions=top_conditions,
            model_benchmarks={
                "clinical_xgboost_accuracy": "67.57%",
                "clinical_xgboost_f1": "66.75%",
                "custom_cnn_accuracy": "84.46%",
                "custom_cnn_auc": "93.25%",
                "nlp_embeddings_records": 4966
            }
        )


case_service = CaseService()
