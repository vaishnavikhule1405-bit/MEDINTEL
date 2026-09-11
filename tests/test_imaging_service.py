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


def test_imaging_model_info(client):
    """Verify GET /api/imaging/model-info returns Custom CNN and DenseNet121 metrics."""
    response = client.get("/api/imaging/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["selected_model"]["model_name"] == "Custom CNN (Selected Primary Model)"
    assert data["selected_model"]["accuracy"] == "84.46%"
    assert data["selected_model"]["roc_auc"] == "93.25%"
    assert data["selected_model"]["pneumonia_sensitivity"] == "98.97%"
    assert "block4.0" in data["target_gradcam_layer"]
    assert "DenseNet121" in data["benchmark_model"]["model_name"]


def test_predict_normal_xray(client):
    """Verify POST /api/imaging/predict on a NORMAL chest X-ray image."""
    img_path = PROJECT_ROOT / "datasets" / "chest_xray" / "test" / "NORMAL" / "IM-0001-0001.jpeg"
    assert img_path.exists(), f"Sample normal image not found at {img_path}"

    with open(img_path, "rb") as f:
        files = {"file": ("IM-0001-0001.jpeg", f, "image/jpeg")}
        response = client.post("/api/imaging/predict", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["predicted_class"] == "NORMAL"
    assert data["normal_probability"] > 0.5
    assert data["pneumonia_probability"] < 0.5
    assert 0.0 <= data["model_confidence"] <= 1.0

    # Visual Evidence checks
    ve = data["visual_evidence"]
    assert ve["evidence_label"] == "Visual Model Evidence"
    assert ve["target_layer"] == "block4.0"
    assert ve["heatmap_base64"].startswith("data:image/png;base64,")
    assert ve["overlay_base64"].startswith("data:image/png;base64,")
    assert ve["original_base64"].startswith("data:image/png;base64,")
    assert "not clinically validated lesion localization" in ve["disclaimer"]


def test_predict_pneumonia_xray(client):
    """Verify POST /api/imaging/predict on a PNEUMONIA chest X-ray image."""
    img_path = PROJECT_ROOT / "datasets" / "chest_xray" / "test" / "PNEUMONIA" / "person1_virus_6.jpeg"
    assert img_path.exists(), f"Sample pneumonia image not found at {img_path}"

    with open(img_path, "rb") as f:
        files = {"file": ("person1_virus_6.jpeg", f, "image/jpeg")}
        response = client.post("/api/imaging/predict", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["predicted_class"] == "PNEUMONIA"
    assert data["pneumonia_probability"] > 0.5
    assert data["normal_probability"] < 0.5

    ve = data["visual_evidence"]
    assert ve["evidence_label"] == "Visual Model Evidence"
    assert len(ve["overlay_base64"]) > 100


def test_predict_unsupported_format(client):
    """Verify non-image upload returns 400 Bad Request."""
    files = {"file": ("document.txt", b"Patient medical notes", "text/plain")}
    response = client.post("/api/imaging/predict", files=files)
    assert response.status_code == 400
    assert "Unsupported image file extension" in response.json()["detail"]


def test_predict_empty_file(client):
    """Verify empty image file returns 400 Bad Request."""
    files = {"file": ("blank.jpg", b"", "image/jpeg")}
    response = client.post("/api/imaging/predict", files=files)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"]
