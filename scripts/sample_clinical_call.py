import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["OMP_NUM_THREADS"] = "1"

import json
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)
with client:
    res = client.post(
        "/api/clinical/predict",
        json={"symptoms": ["symptom_cough", "symptom_fever", "symptom_chills", "symptom_shortness_of_breath"]}
    )
    data = res.json()
    print("Status:", res.status_code)
    print("Predicted Disease:", data["predicted_disease_display"])
    print(f"Model Confidence: {data['model_confidence'] * 100:.2f}%")
    print("Top 5 Predictions:")
    for p in data["top_5_predictions"]:
        print(f"  - {p['disease_display_name']}: {p['probability']*100:.2f}%")
    print("\nTop SHAP Feature Contributors (Model Evidence):")
    for e in data["model_evidence"][:5]:
        val_str = "Present" if e["symptom_value"] == 1 else "Absent"
        print(f"  - {e['symptom_name']} [{val_str}]: {e['shap_value']:+.4f} ({e['contribution']})")
    print("\nDisclaimer:", data["disclaimer"])
    print("Safety Note:", data["safety_note"])
