import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship

from backend.app.database import Base


def generate_case_id() -> str:
    """Generate human-readable case ID."""
    return f"CASE-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"


class Case(Base):
    __tablename__ = "cases"

    id = Column(String(50), primary_key=True, default=generate_case_id, index=True)
    case_number = Column(String(50), unique=True, index=True)
    case_type = Column(String(50), default="LIVE_ANALYSIS")  # LIVE_ANALYSIS or SYNTHETIC_DEMONSTRATION
    patient_identifier = Column(String(50), index=True)
    patient_age = Column(Integer, nullable=True)
    patient_sex = Column(String(20), nullable=True)
    title = Column(String(200), default="Clinical Consultation Case")
    
    # Overview metrics
    primary_condition = Column(String(100), nullable=True)
    overall_evidence_index = Column(Float, default=0.5)
    evidence_level = Column(String(20), default="MODERATE")  # LOW, MODERATE, HIGH
    cross_modality_relationship = Column(String(50), default="PENDING")
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    clinical_inputs = relationship("ClinicalInput", back_populates="case", cascade="all, delete-orphan")
    xray_analyses = relationship("XRayAnalysis", back_populates="case", cascade="all, delete-orphan")
    medical_reports = relationship("MedicalReport", back_populates="case", cascade="all, delete-orphan")
    multimodal_analyses = relationship("MultimodalAnalysis", back_populates="case", cascade="all, delete-orphan")
    assistant_interactions = relationship("AssistantInteraction", back_populates="case", cascade="all, delete-orphan")


class ClinicalInput(Base):
    __tablename__ = "clinical_inputs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(String(50), ForeignKey("cases.id", ondelete="CASCADE"), index=True)
    
    symptoms = Column(JSON)  # List of symptom IDs
    predicted_disease = Column(String(100))
    confidence = Column(Float)
    top_predictions = Column(JSON)  # Top 5 predictions list
    shap_evidence = Column(JSON)  # Top SHAP feature contributions
    
    created_at = Column(DateTime, default=datetime.utcnow)
    case = relationship("Case", back_populates="clinical_inputs")


class XRayAnalysis(Base):
    __tablename__ = "xray_analyses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(String(50), ForeignKey("cases.id", ondelete="CASCADE"), index=True)

    image_filename = Column(String(200))
    predicted_class = Column(String(20))  # NORMAL or PNEUMONIA
    normal_probability = Column(Float)
    pneumonia_probability = Column(Float)
    confidence = Column(Float)
    gradcam_target_layer = Column(String(50), default="block4.0")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    case = relationship("Case", back_populates="xray_analyses")


class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(String(50), ForeignKey("cases.id", ondelete="CASCADE"), index=True)

    word_count = Column(Integer)
    char_count = Column(Integer)
    entities_count = Column(Integer)
    category_counts = Column(JSON)
    negated_count = Column(Integer, default=0)
    uncertain_count = Column(Integer, default=0)
    historical_count = Column(Integer, default=0)
    family_history_count = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    case = relationship("Case", back_populates="medical_reports")
    entities = relationship("NLPEntity", back_populates="report", cascade="all, delete-orphan")


class NLPEntity(Base):
    __tablename__ = "nlp_entities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(Integer, ForeignKey("medical_reports.id", ondelete="CASCADE"), index=True)

    entity_text = Column(String(200))
    category = Column(String(50))  # PROBLEM, SYMPTOM, MEDICATION, etc.
    confidence = Column(Float)
    status = Column(String(50))  # PRESENT, NEGATED, UNCERTAIN, HISTORICAL, FAMILY_HISTORY
    trigger_word = Column(String(100), nullable=True)

    report = relationship("MedicalReport", back_populates="entities")


class MultimodalAnalysis(Base):
    __tablename__ = "multimodal_analyses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(String(50), ForeignKey("cases.id", ondelete="CASCADE"), index=True)

    clinical_evidence = Column(Float, nullable=True)
    imaging_evidence = Column(Float, nullable=True)
    textual_evidence = Column(Float, nullable=True)
    overall_evidence_index = Column(Float)
    evidence_level = Column(String(20))
    cross_modality_relationship = Column(String(50))
    modality_contributions = Column(JSON)
    missing_modalities = Column(JSON)

    created_at = Column(DateTime, default=datetime.utcnow)
    case = relationship("Case", back_populates="multimodal_analyses")


class AssistantInteraction(Base):
    __tablename__ = "assistant_interactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(String(50), ForeignKey("cases.id", ondelete="SET NULL"), nullable=True, index=True)
    session_id = Column(String(100), index=True)

    user_message = Column(Text)
    assistant_response = Column(Text)
    tool_calls = Column(JSON)  # List of tools invoked and parameters
    concordance_flag = Column(String(50), default="UNSPECIFIED")

    created_at = Column(DateTime, default=datetime.utcnow)
    case = relationship("Case", back_populates="assistant_interactions")
