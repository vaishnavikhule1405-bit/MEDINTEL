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


def test_list_cases(client):
    """Verify GET /api/cases returns case list with pagination."""
    response = client.get("/api/cases?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    first = data[0]
    assert "id" in first
    assert "title" in first
    assert "overall_evidence_index" in first
    assert first["evidence_level"] in ["LOW", "MODERATE", "HIGH"]


def test_case_detail(client):
    """Verify GET /api/cases/{id} returns full clinical dossier."""
    # First get a case id
    list_res = client.get("/api/cases?limit=1")
    assert list_res.status_code == 200
    cases = list_res.json()
    assert len(cases) > 0
    target_id = cases[0]["id"]

    res = client.get(f"/api/cases/{target_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == target_id
    assert "clinical_data" in data or "imaging_data" in data or "nlp_data" in data


def test_analytics_summary(client):
    """Verify GET /api/analytics/summary returns aggregated metrics."""
    response = client.get("/api/analytics/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_cases"] > 0
    assert "evidence_level_distribution" in data
    assert "modality_distribution" in data
    assert "top_predicted_conditions" in data
    assert "model_benchmarks" in data
    assert data["model_benchmarks"]["clinical_xgboost_accuracy"] == "67.57%"
    assert data["model_benchmarks"]["custom_cnn_accuracy"] == "84.46%"


def test_assistant_tools(client):
    """Verify GET /api/assistant/tools lists all 8 clinical tools."""
    response = client.get("/api/assistant/tools")
    assert response.status_code == 200
    data = response.json()
    tools = [t["name"] for t in data["tools"]]
    assert len(tools) == 8
    expected_tools = [
        "analyze_symptoms",
        "analyze_xray",
        "analyze_medical_report",
        "get_case_history",
        "get_model_explanation",
        "get_multimodal_evidence",
        "retrieve_similar_reports",
        "summarize_case"
    ]
    for exp in expected_tools:
        assert exp in tools, f"Missing tool {exp}"


def test_assistant_chat_symptom_inquiry(client):
    """Verify POST /api/assistant/chat invokes symptom analysis and provides decision support."""
    payload = {
        "message": "Patient has severe cough, high fever, and shortness of breath. Please analyze."
    }
    response = client.post("/api/assistant/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "reply" in data
    assert len(data["tools_executed"]) > 0
    tool_names = [t["tool_name"] for t in data["tools_executed"]]
    assert "analyze_symptoms" in tool_names

    # Check that it provides decision support and disclaimer
    assert "AI-generated clinical decision support" in data["disclaimer"]
    assert "Model Confidence" in data["reply"] or "confidence" in data["reply"].lower()
    assert "Not a substitute for professional medical judgment" in data["safety_note"]


def test_assistant_chat_multimodal_inquiry(client):
    """Verify POST /api/assistant/chat evaluates multimodal concordance."""
    payload = {
        "message": "Evaluate chest X-ray and clinical symptoms: patient has cough and fever, check the radiograph as well."
    }
    response = client.post("/api/assistant/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert data["concordance_status"] in ["CONCORDANT", "DISCORDANT", "INCOMPLETE", "INFORMATIONAL"]
