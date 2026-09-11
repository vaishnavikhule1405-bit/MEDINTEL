"""
MedIntel AI - Clinical Sanity Test Suite
=========================================
Loads the saved model artifacts and runs representative symptom combinations
through the model, printing top-5 predictions with pass/fail status.

Usage:
    python scripts/clinical_sanity_test.py
"""

import os, sys, json, pickle, warnings
warnings.filterwarnings("ignore")
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np

MODELS_DIR = PROJECT_ROOT / "models"

print("=" * 70)
print("MedIntel AI - Clinical Sanity Test Suite")
print("=" * 70)

# Load artifacts
with open(MODELS_DIR / "clinical_xgboost.pkl", "rb") as f:
    model = pickle.load(f)
with open(MODELS_DIR / "clinical_features.pkl", "rb") as f:
    features = pickle.load(f)
with open(MODELS_DIR / "clinical_class_mapping.json") as f:
    class_mapping = json.load(f)

feat_idx = {f: i for i, f in enumerate(features)}
print(f"Model loaded | Features: {len(features)} | Classes: {len(class_mapping)}")

# Sanity test cases
CASES = [
    {
        "name": "Test 1 - Respiratory / Flu-like",
        "desc": "Fever, cough, productive cough, SOB, chills, sore throat, fatigue",
        "symptoms": [
            "symptom_fever", "symptom_cough", "symptom_productive_cough",
            "symptom_shortness_of_breath", "symptom_chills",
            "symptom_sore_throat", "symptom_fatigue",
        ],
        "expected": ["Flu", "Common_Cold", "COVID19", "Pneumonia"],
    },
    {
        "name": "Test 2 - Diabetes-like",
        "desc": "Excessive thirst, frequent urination, increased hunger, fatigue",
        "symptoms": [
            "symptom_polyuria", "symptom_polydipsia", "symptom_polyphagia",
            "symptom_fatigue",
        ],
        "expected": ["Type2_Diabetes"],
    },
    {
        "name": "Test 3 - Migraine-like",
        "desc": "Headache, nausea, sensitivity to light and sound",
        "symptoms": [
            "symptom_headache", "symptom_nausea", "symptom_photophobia",
            "symptom_phonophobia", "symptom_vomiting",
        ],
        "expected": ["Migraine", "Epilepsy"],
    },
    {
        "name": "Test 4 - Gastroenteritis-like",
        "desc": "Abdominal pain, diarrhoea, vomiting, fever",
        "symptoms": [
            "symptom_abdominal_pain", "symptom_diarrhea", "symptom_vomiting",
            "symptom_fever", "symptom_nausea",
        ],
        "expected": ["Gastritis", "Irritable_Bowel_Syndrome",
                     "Inflammatory_Bowel_Disease", "Peptic_Ulcer_Disease"],
    },
    {
        "name": "Test 5 - Pneumonia (strong)",
        "desc": "Fever, productive cough, pleuritic chest pain, SOB, chills, haemoptysis",
        "symptoms": [
            "symptom_fever", "symptom_cough", "symptom_productive_cough",
            "symptom_pleuritic_chest_pain", "symptom_shortness_of_breath",
            "symptom_chills", "symptom_fatigue", "symptom_hemoptysis",
        ],
        "expected": ["Pneumonia", "Tuberculosis", "COVID19"],
    },
]

passed = 0
for case in CASES:
    v = np.zeros((1, len(features)), dtype=np.float32)
    matched, unmatched = [], []
    for s in case["symptoms"]:
        if s in feat_idx:
            v[0, feat_idx[s]] = 1.0
            matched.append(s)
        else:
            unmatched.append(s)

    probas = model.predict_proba(v)[0]
    top5 = np.argsort(probas)[::-1][:5]
    top_disease = class_mapping.get(str(int(top5[0])), "UNKNOWN")
    ok = any(e in top_disease for e in case["expected"])
    if ok:
        passed += 1

    print(f"\n{'-'*60}")
    print(f"  {case['name']}")
    print(f"  {case['desc']}")
    if unmatched:
        print(f"  [WARN] Not in feature list: {unmatched}")
    print(f"  Matched {len(matched)}/{len(case['symptoms'])} symptoms | Active features: {int(v.sum())}")
    print(f"  Top-5 Predictions:")
    for rank, idx in enumerate(top5):
        d = class_mapping.get(str(idx), f"UNKNOWN_{idx}")
        flag = "  <-- EXPECTED" if any(e in d for e in case["expected"]) else ""
        print(f"    {rank+1}. [{idx:>2}] {d:<42} {probas[idx]*100:6.2f}%{flag}")
    print(f"  Result: {'PASS' if ok else 'FAIL'}  (top prediction: {top_disease})")

print(f"\n{'='*60}")
print(f"  TOTAL: {passed}/{len(CASES)} sanity tests passed")
print(f"{'='*60}")
print("\nNote: This dataset is synthetically generated with noisy symptom-disease")
print("associations. Results reflect learned dataset patterns, not clinical ground truth.")
