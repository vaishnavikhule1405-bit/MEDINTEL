import os
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["OMP_NUM_THREADS"] = "1"

from backend.app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_list_synthetic_cases(client):
    """Verify GET /api/fusion/synthetic-cases returns precomputed cases with synthetic badge."""
    response = client.get("/api/fusion/synthetic-cases?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 10
    first_case = data[0]
    assert first_case["case_id"] == "SYNTH-0001"
    assert first_case["is_synthetic"] is True
    assert first_case["case_type"] == "SYNTHETIC_DEMONSTRATION"
    assert "evidence_level" in first_case
    assert "cross_modality_relationship" in first_case


def test_get_synthetic_case_detail(client):
    """Verify GET /api/fusion/synthetic-cases/SYNTH-0001 returns complete profile."""
    response = client.get("/api/fusion/synthetic-cases/SYNTH-0001")
    assert response.status_code == 200
    data = response.json()
    assert data["profile_type"] == "Multimodal Evidence Profile"
    assert data["is_synthetic_demonstration"] is True
    assert data["synthetic_badge"] == "SYNTHETIC DEMONSTRATION"
    assert "independent datasets" in data["disclaimer"]

    # Verify Evidence Profile
    profile = data["evidence_profile"]
    assert 0.0 <= profile["overall_evidence_index"] <= 1.0
    assert profile["evidence_level"] in ["LOW", "MODERATE", "HIGH"]
    assert profile["cross_modality_relationship"] in ["HIGH AGREEMENT", "LOW-EVIDENCE AGREEMENT", "MODALITY DISAGREEMENT"]
    assert profile["modality_availability"]["active_modality_count"] == 3


def test_live_fusion_with_missing_modality(client):
    """
    Verify POST /api/fusion/analyze with Clinical + Medical Text (Missing X-Ray).
    Tests robust missing modality handling.
    """
    payload = {
        "symptoms": "symptom_cough,symptom_fever,symptom_shortness_of_breath",
        "medical_text": "Patient presents with severe cough and fever. Denies chest pain. Possible pneumonia."
    }
    response = client.post("/api/fusion/analyze", data=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["profile_type"] == "Multimodal Evidence Profile"
    assert data["is_synthetic_demonstration"] is False

    profile = data["evidence_profile"]
    assert profile["modality_availability"]["clinical_provided"] is True
    assert profile["modality_availability"]["text_provided"] is True
    assert profile["modality_availability"]["imaging_provided"] is False
    assert "Chest X-Ray" in profile["modality_availability"]["missing_modalities"]

    # Contribution of missing modality must be 0.0
    assert profile["modality_contributions"]["imaging"] == 0.0
    assert profile["modality_contributions"]["clinical"] > 0.0
    assert profile["modality_contributions"]["medical_text"] > 0.0


def test_global_shap_importance(client):
    """Verify GET /api/explainability/clinical/global returns 174 feature importances."""
    response = client.get("/api/explainability/clinical/global")
    assert response.status_code == 200
    data = response.json()
    assert data["total_features"] == 174
    assert len(data["top_features"]) == 30
    assert "not causal clinical reasoning" in data["disclaimer"]


def test_patient_shap_example(client):
    """Verify GET /api/explainability/clinical/example returns patient attribution."""
    response = client.get("/api/explainability/clinical/example")
    assert response.status_code == 200
    data = response.json()
    assert len(data["top_contributions"]) > 0
    first_contrib = data["top_contributions"][0]
    assert "symptom_name" in first_contrib
    assert "shap_value" in first_contrib


def test_imaging_gradcam_samples(client):
    """Verify GET /api/explainability/imaging/samples returns sample overlays."""
    response = client.get("/api/explainability/imaging/samples")
    assert response.status_code == 200
    data = response.json()
    assert data["label"] == "Visual Model Evidence"
    assert data["target_layer"] == "block4.0 (Conv2d: 128 -> 256)"
    assert len(data["sample_artifacts"]) > 0
