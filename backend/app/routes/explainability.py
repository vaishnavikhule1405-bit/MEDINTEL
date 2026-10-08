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
    
    from backend.app.services.clinical_service import clinical_service
    clinical_service._ensure_catalog_initialized()

    records = []
    for _, row in df.iterrows():
        symptom_id = str(row.get("Symptom", ""))
        clean_name = symptom_id.replace("rare_symptom_", "").replace("symptom_", "").replace("_symptom", "").replace("_rare", "").replace("_", " ").title()
        category = clinical_service._categorize_symptom(symptom_id)
        records.append({
            "symptom_id": symptom_id,
            "symptom_name": clean_name,
            "category": category,
            "mean_abs_shap": float(row.get("Mean_Absolute_SHAP", 0.0))
        })
    records.sort(key=lambda r: r["mean_abs_shap"], reverse=True)

    # Category aggregation
    category_map: Dict[str, List[float]] = {}
    for r in records:
        category_map.setdefault(r["category"], []).append(r["mean_abs_shap"])
    category_stats = [
        {
            "category": cat,
            "count": len(vals),
            "mean_shap": float(sum(vals) / len(vals)),
            "max_shap": float(max(vals))
        }
        for cat, vals in category_map.items()
    ]
    category_stats.sort(key=lambda c: c["mean_shap"], reverse=True)

    return {
        "model": "XGBoost Multiclass Classifier (37 classes)",
        "total_features": len(records),
        "top_features": records[:30],
        "all_features": records,
        "category_stats": category_stats,
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
    from backend.app.services.clinical_service import clinical_service
    records = []
    for _, row in df.iterrows():
        symptom_id = str(row.get("Symptom", ""))
        clean_name = symptom_id.replace("rare_symptom_", "").replace("symptom_", "").replace("_symptom", "").replace("_rare", "").replace("_", " ").title()
        shap_val = float(row.get("SHAP_Value", 0.0))
        category = clinical_service._categorize_symptom(symptom_id)
        records.append({
            "symptom_id": symptom_id,
            "symptom_name": clean_name,
            "category": category,
            "symptom_value": int(row.get("Symptom_Value", 0)),
            "shap_value": shap_val,
            "absolute_shap": float(row.get("Absolute_SHAP", abs(shap_val))),
            "contribution": "increases_prediction" if shap_val > 0 else "decreases_prediction"
        })
    records.sort(key=lambda r: r["absolute_shap"], reverse=True)
    return {
        "example_case": "Clinical Patient SHAP Attribution Demonstration",
        "primary_disease": "Pneumonia / Bronchial Infection",
        "top_contributions": records[:15],
        "all_contributions": records,
        "disclaimer": "SHAP attributions indicate mathematical model influence and do not prove causal medical etiology."
    }


@router.get(
    "/imaging/artifact/{filename}",
    summary="Serve Grad-CAM PNG artifact",
    description="Returns precomputed Grad-CAM visual evidence PNG files."
)
def get_imaging_gradcam_artifact(filename: str):
    from fastapi.responses import FileResponse
    gradcam_dir = settings.resolve_path("results/imaging/gradcam")
    file_path = gradcam_dir / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Artifact {filename} not found."
        )
    return FileResponse(str(file_path), media_type="image/png")


@router.get(
    "/imaging/samples",
    summary="Get Grad-CAM visual evidence metadata and sample artifacts",
    description="Returns metadata about precomputed Grad-CAM visual overlays and heatmaps on layer block4.0 with base64 data and direct artifact URLs."
)
def get_imaging_gradcam_samples():
    import base64
    gradcam_dir = settings.resolve_path("results/imaging/gradcam")
    
    def _read_b64(fname: str) -> str:
        p = gradcam_dir / fname
        if p.exists():
            return base64.b64encode(p.read_bytes()).decode("utf-8")
        return ""

    normal_heatmap_b64 = _read_b64("normal_gradcam_heatmap.png")
    normal_overlay_b64 = _read_b64("normal_gradcam_overlay.png")
    pneumonia_heatmap_b64 = _read_b64("pneumonia_gradcam_heatmap.png")
    pneumonia_overlay_b64 = _read_b64("pneumonia_gradcam_overlay.png")
    comparison_b64 = _read_b64("gradcam_normal_vs_pneumonia.png")

    cases = [
        {
            "id": "case_normal",
            "title": "Normal Pediatric Radiograph",
            "prediction": "NORMAL",
            "confidence": 0.942,
            "target_layer": "block4.0 (Conv2d 128 -> 256)",
            "heatmap_url": "/api/explainability/imaging/artifact/normal_gradcam_heatmap.png",
            "overlay_url": "/api/explainability/imaging/artifact/normal_gradcam_overlay.png",
            "heatmap_base64": normal_heatmap_b64,
            "overlay_base64": normal_overlay_b64,
            "description": "Uniform low-intensity baseline gradient. Bilateral clear parenchymal zones with absence of focal high-gradient clusters.",
            "radiological_finding": "Normal thoracic expansion, clear costophrenic angles, no acute alveolar consolidation."
        },
        {
            "id": "case_pneumonia",
            "title": "Acute Bacterial/Viral Consolidation",
            "prediction": "PNEUMONIA",
            "confidence": 0.987,
            "target_layer": "block4.0 (Conv2d 128 -> 256)",
            "heatmap_url": "/api/explainability/imaging/artifact/pneumonia_gradcam_heatmap.png",
            "overlay_url": "/api/explainability/imaging/artifact/pneumonia_gradcam_overlay.png",
            "heatmap_base64": pneumonia_heatmap_b64,
            "overlay_base64": pneumonia_overlay_b64,
            "description": "Pronounced localized focal activation concentrated over right mid-to-lower pulmonary zone, aligning directly with dense alveolar infiltration.",
            "radiological_finding": "Prominent parenchymal opacity and bronchial air bronchograms visualized in lower lobe."
        }
    ]

    sample_artifacts = [
        {
            "filename": "pneumonia_gradcam_overlay.png",
            "type": "overlay",
            "prediction": "PNEUMONIA",
            "confidence": 0.987,
            "heatmap_base64": pneumonia_heatmap_b64,
            "overlay_base64": pneumonia_overlay_b64,
            "original_base64": pneumonia_overlay_b64,  # Fallback
            "relative_path": "results/imaging/gradcam/pneumonia_gradcam_overlay.png",
            "target_layer": "block4.0"
        },
        {
            "filename": "normal_gradcam_overlay.png",
            "type": "overlay",
            "prediction": "NORMAL",
            "confidence": 0.942,
            "heatmap_base64": normal_heatmap_b64,
            "overlay_base64": normal_overlay_b64,
            "original_base64": normal_overlay_b64,  # Fallback
            "relative_path": "results/imaging/gradcam/normal_gradcam_overlay.png",
            "target_layer": "block4.0"
        }
    ]

    return {
        "method": "Grad-CAM (Gradient-weighted Class Activation Mapping)",
        "target_layer": "block4.0 (Conv2d: 128 -> 256)",
        "label": "Visual Model Evidence",
        "cases": cases,
        "sample_artifacts": sample_artifacts,
        "comparison_artifact": {
            "title": "Normal vs. Pneumonia Comparative Activation Panel",
            "url": "/api/explainability/imaging/artifact/gradcam_normal_vs_pneumonia.png",
            "base64": comparison_b64,
            "description": "Direct side-by-side comparative visualization demonstrating class-discriminative feature localization across CNN layers."
        },
        "disclaimer": settings.VISUAL_EVIDENCE_DISCLAIMER
    }


@router.get(
    "/nlp/examples",
    summary="Get sample NLP explainability examples with entity context",
    description="Returns precomputed clinical NLP explainability examples showing entity extraction, confidence, and context detection."
)
def get_nlp_explainability_examples(limit: int = 20):
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
