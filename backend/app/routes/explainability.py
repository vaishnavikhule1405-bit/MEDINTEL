import json
import logging
from pathlib import Path
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, status
import pandas as pd

from backend.app.config import settings

logger = logging.getLogger("medintel.routes.explainability")

router = APIRouter(prefix="/api/explainability", tags=["Explainable AI (XAI)"])


@router.get(
    "/clinical/global",
    summary="Get global SHAP feature importance for Clinical XGBoost",
    description="Returns mean absolute SHAP values across all 174 symptom features from the training dataset."
)
def get_global_shap_importance():
    path = settings.resolve_path(settings.CLINICAL_SHAP_GLOBAL_PATH)
    if not path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Global SHAP importance file not found."
        )
    df = pd.read_csv(path)
    # Format symptom names for display
    records = []
    for _, row in df.iterrows():
        symptom_id = str(row.get("Symptom", ""))
        clean_name = symptom_id.replace("rare_symptom_", "").replace("symptom_", "").replace("_symptom", "").replace("_rare", "").replace("_", " ").title()
        records.append({
            "symptom_id": symptom_id,
            "symptom_name": clean_name,
            "mean_abs_shap": float(row.get("Mean_Absolute_SHAP", 0.0))
        })
    records.sort(key=lambda r: r["mean_abs_shap"], reverse=True)
    return {
        "model": "XGBoost Multiclass Classifier (37 classes)",
        "total_features": len(records),
        "top_features": records[:30],
        "all_features": records,
        "method": "TreeSHAP (Mean Absolute SHAP value)",
        "disclaimer": "SHAP reflects model feature attribution and is not causal clinical reasoning."
    }


@router.get(
    "/clinical/example",
    summary="Get patient-level SHAP explainability example",
    description="Returns precomputed patient-level SHAP values showing how individual symptom values pushed the model prediction."
)
def get_patient_shap_example():
    path = settings.resolve_path("models/clinical/clinical_patient_shap_example.csv")
    if not path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient SHAP example file not found."
        )
    df = pd.read_csv(path)
    records = []
    for _, row in df.iterrows():
        symptom_id = str(row.get("Symptom", ""))
        clean_name = symptom_id.replace("rare_symptom_", "").replace("symptom_", "").replace("_symptom", "").replace("_rare", "").replace("_", " ").title()
        shap_val = float(row.get("SHAP_Value", 0.0))
        records.append({
            "symptom_id": symptom_id,
            "symptom_name": clean_name,
            "symptom_value": int(row.get("Symptom_Value", 0)),
            "shap_value": shap_val,
            "absolute_shap": float(row.get("Absolute_SHAP", abs(shap_val))),
            "contribution": "increases_prediction" if shap_val > 0 else "decreases_prediction"
        })
    records.sort(key=lambda r: r["absolute_shap"], reverse=True)
    return {
        "example_case": "Clinical Patient SHAP Attribution Demonstration",
        "top_contributions": records[:15],
        "all_contributions": records,
        "disclaimer": "SHAP attributions indicate mathematical model influence and do not prove causal medical etiology."
    }


@router.get(
    "/imaging/samples",
    summary="Get Grad-CAM visual evidence metadata and sample artifacts",
    description="Returns metadata about precomputed Grad-CAM visual overlays and heatmaps on layer block4.0."
)
def get_imaging_gradcam_samples():
    gradcam_dir = settings.resolve_path("results/imaging/gradcam")
    samples = []
    if gradcam_dir.exists():
        for img_file in gradcam_dir.glob("*.png"):
            samples.append({
                "filename": img_file.name,
                "type": "overlay" if "overlay" in img_file.name else ("heatmap" if "heatmap" in img_file.name else "comparison"),
                "relative_path": f"results/imaging/gradcam/{img_file.name}",
                "target_layer": "block4.0"
            })
    return {
        "method": "Grad-CAM (Gradient-weighted Class Activation Mapping)",
        "target_layer": "block4.0 (Conv2d: 128 -> 256)",
        "label": "Visual Model Evidence",
        "sample_artifacts": samples,
        "disclaimer": settings.VISUAL_EVIDENCE_DISCLAIMER
    }


@router.get(
    "/nlp/examples",
    summary="Get sample NLP explainability examples with entity context",
    description="Returns precomputed clinical NLP explainability examples showing entity extraction, confidence, and context detection."
)
def get_nlp_explainability_examples(limit: int = 10):
    path = settings.resolve_path(settings.NLP_EXPLAINABILITY_PATH)
    if not path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NLP explainability examples file not found."
        )
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {
        "total_examples": len(data),
        "examples": data[:limit],
        "disclaimer": "NLP entity attributions represent model-derived textual evidence and not clinically validated diagnoses."
    }
