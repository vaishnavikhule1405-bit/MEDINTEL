import os
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["OMP_NUM_THREADS"] = "1"

from backend.app.config import settings
from backend.app.main import app
from backend.app.services.model_manager import model_manager
from backend.app.database import engine, Base


@pytest.fixture(scope="session")
def client():
    """Create FastAPI TestClient with lifespan context."""
    with TestClient(app) as test_client:
        yield test_client


def test_configuration():
    """Verify settings loaded correctly from environment."""
    assert settings.APP_NAME == "MEDINTEL AI"
    assert settings.PORT == 8000
    assert "clinical" in settings.CLINICAL_MODEL_PATH
    assert "custom_cnn_best.pth" in settings.IMAGING_MODEL_PATH
    assert isinstance(settings.CORS_ORIGINS, list)
    assert len(settings.CORS_ORIGINS) > 0


def test_model_manager_status(client):
    """Verify ModelManager loads all 4 modules without mock replacements."""
    status = model_manager.get_status()
    assert status["all_loaded"] is True
    assert status["modules"]["clinical"]["loaded"] is True
    assert status["modules"]["clinical"]["num_classes"] == 37
    assert status["modules"]["clinical"]["num_features"] == 174

    assert status["modules"]["imaging"]["loaded"] is True
    assert status["modules"]["imaging"]["model_type"] == "Custom 4-Block CNN"
    assert status["modules"]["imaging"]["classes"] == ["NORMAL", "PNEUMONIA"]

    assert status["modules"]["nlp"]["loaded"] is True
    assert status["modules"]["nlp"]["embedding_dim"] == 768

    assert status["modules"]["fusion"]["loaded"] is True
    assert status["modules"]["fusion"]["synthetic_demonstration_cases"] == 500


def test_root_endpoint(client):
    """Verify GET / returns correct system metadata and safety disclaimers."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["system"] == "MEDINTEL AI"
    assert data["autonomous_diagnosis"] is False
    assert data["clinical_validation"] is False
    assert data["human_oversight_required"] is True
    assert "AI-assisted clinical decision support" in data["disclaimer"]


def test_health_endpoint(client):
    """Verify GET /health returns status healthy and all ML models status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "models" in data
    assert data["models"]["clinical"]["loaded"] is True
    assert data["models"]["imaging"]["loaded"] is True
    assert data["models"]["nlp"]["loaded"] is True
    assert data["models"]["fusion"]["loaded"] is True
    assert "Not a substitute for professional medical judgment" in data["safety_framing"]


def test_database_connection():
    """Verify database engine connects and creates tables."""
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        assert conn is not None
