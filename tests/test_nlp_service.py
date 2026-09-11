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


def test_nlp_model_info(client):
    """Verify GET /api/nlp/model-info returns correct model and embedding details."""
    response = client.get("/api/nlp/model-info")
    assert response.status_code == 200
    data = response.json()
    assert "d4data/biomedical-ner-all" in data["ner_model"]
    assert "pritamdeka/S-PubMedBert-MS-MARCO" in data["embedding_model"]
    assert data["embedding_dimension"] == 768
    assert "PROBLEM" in data["standardized_categories"]
    assert "NEGATED" in data["context_modifiers_detected"]
    assert "UNCERTAIN" in data["context_modifiers_detected"]


def test_nlp_entity_extraction_and_context(client):
    """
    Verify POST /api/nlp/analyze correctly extracts entities and context:
    - 'denies chest pain' -> SYMPTOM / NEGATED
    - 'possible pneumonia' -> PROBLEM / UNCERTAIN
    - 'history of diabetes' -> PROBLEM / HISTORICAL
    - 'fever' -> SYMPTOM / PRESENT
    - 'albuterol' -> MEDICATION / PRESENT
    """
    payload = {
        "text": (
            "Patient is a 54-year-old male who denies chest pain. "
            "Presents with fever and possible pneumonia. "
            "Started on albuterol for wheezing. "
            "Patient has a history of diabetes and family history of coronary artery disease."
        ),
        "retrieve_similar": True,
        "top_k": 3
    }
    response = client.post("/api/nlp/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["word_count"] > 0
    assert len(data["entities"]) > 0

    # Verify Negation: chest pain
    chest_pain_ent = next((e for e in data["entities"] if "chest pain" in e["text"].lower()), None)
    assert chest_pain_ent is not None, "chest pain entity not found"
    assert chest_pain_ent["status"] == "NEGATED"
    assert chest_pain_ent["category"] == "SYMPTOM"

    # Verify Uncertainty: pneumonia
    pneumonia_ent = next((e for e in data["entities"] if "pneumonia" in e["text"].lower()), None)
    assert pneumonia_ent is not None, "pneumonia entity not found"
    assert pneumonia_ent["status"] == "UNCERTAIN"
    assert pneumonia_ent["category"] == "PROBLEM"

    # Verify Historical: diabetes
    diabetes_ent = next((e for e in data["entities"] if "diabetes" in e["text"].lower()), None)
    assert diabetes_ent is not None, "diabetes entity not found"
    assert diabetes_ent["status"] == "HISTORICAL"

    # Verify Family History: coronary artery disease
    cad_ent = next((e for e in data["entities"] if "coronary artery disease" in e["text"].lower()), None)
    assert cad_ent is not None, "coronary artery disease entity not found"
    assert cad_ent["status"] == "FAMILY_HISTORY"

    # Verify Categorized sections
    categorized = data["categorized_entities"]
    assert len(categorized["symptoms"]) > 0
    assert len(categorized["problems"]) > 0

    # Verify Counts
    counts = data["counts"]
    assert counts["negated_count"] >= 1
    assert counts["uncertain_count"] >= 1
    assert counts["historical_count"] >= 1
    assert counts["family_history_count"] >= 1

    # Verify Similar reports retrieval
    assert len(data["similar_reports"]) == 3
    assert all(r["similarity_score"] > 0.0 for r in data["similar_reports"])


def test_nlp_empty_text_fails(client):
    """Verify empty text returns 400 or 422."""
    response = client.post("/api/nlp/analyze", json={"text": "   "})
    assert response.status_code in [400, 422]
