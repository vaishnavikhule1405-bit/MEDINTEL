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
from backend.app.services.model_manager import model_manager


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_get_symptoms(client):
    """Verify GET /api/clinical/symptoms returns 174 categorized symptoms."""
    response = client.get("/api/clinical/symptoms")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 174
    assert len(data["all_symptoms"]) == 174
    assert len(data["categories"]) > 0

    # Verify category structure
    categories = [cat["category"] for cat in data["categories"]]
    assert "Respiratory" in categories
    assert "Cardiovascular" in categories

    # Check a specific symptom
    cough_item = next((s for s in data["all_symptoms"] if s["id"] == "symptom_cough"), None)
    assert cough_item is not None
    assert cough_item["name"] == "Cough"
    assert cough_item["category"] == "Respiratory"


def test_clinical_model_info(client):
    """Verify GET /api/clinical/model-info returns XGBoost metrics and 37 classes."""
    response = client.get("/api/clinical/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["selected_model"]["model_name"] == "XGBoost Multiclass Classifier (Selected)"
    assert data["selected_model"]["accuracy"] == "67.57%"
    assert data["selected_model"]["weighted_f1"] == "66.75%"
    assert data["selected_model"]["num_disease_classes"] == 37
    assert data["selected_model"]["num_symptom_features"] == 174
    assert len(data["disease_classes"]) == 37
    assert len(data["comparison_models"]) == 2  # Logistic Regression & Random Forest


def test_predict_disease_respiratory(client):
    """Verify POST /api/clinical/predict generates prediction and SHAP evidence."""
    payload = {
        "symptoms": ["symptom_cough", "symptom_fever", "symptom_shortness_of_breath"]
    }
    response = client.post("/api/clinical/predict", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Verify predicted disease and confidence
    assert "predicted_disease" in data
    assert "predicted_disease_display" in data
    assert 0.0 <= data["model_confidence"] <= 1.0
    assert 0.0 <= data["class_probability"] <= 1.0

    # Top-5 predictions
    assert len(data["top_5_predictions"]) == 5
    assert data["top_5_predictions"][0]["disease"] == data["predicted_disease"]
    # Check probabilities are non-increasing
    probs = [p["probability"] for p in data["top_5_predictions"]]
    assert probs == sorted(probs, reverse=True)

    # SHAP Model Evidence
    assert len(data["model_evidence"]) > 0
    top_evidence = data["model_evidence"][0]
    assert "symptom_id" in top_evidence
    assert "shap_value" in top_evidence
    assert top_evidence["contribution"] in ["increases_prediction", "decreases_prediction"]

    # Active symptoms count
    assert data["active_symptoms_count"] == 3
    assert "disclaimer" in data
    assert "safety_note" in data


def test_predict_disease_alias_matching(client):
    """Verify symptom matching works with clean human-readable names."""
    payload = {
        "symptoms": ["cough", "chest pain", "palpitations"]
    }
    response = client.post("/api/clinical/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["active_symptoms_count"] == 3


def test_predict_empty_symptoms_fails(client):
    """Verify empty symptom list returns 422 or 400."""
    response = client.post("/api/clinical/predict", json={"symptoms": []})
    assert response.status_code in [400, 422]


def test_predict_unmatched_symptoms_fails(client):
    """Verify unrecognized symptom strings return 400."""
    response = client.post("/api/clinical/predict", json={"symptoms": ["completely_invented_symptom_xyz"]})
    assert response.status_code == 400
    assert "None of the provided symptoms matched" in response.json()["detail"]
