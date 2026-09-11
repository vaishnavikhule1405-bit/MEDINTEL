"""
MedIntel AI - Clinical XGBoost Retraining Script
=================================================
Fixes the irrelevant-prediction problem caused by:
  1. Extreme class imbalance (21,295x ratio) - fixed via sample_weight
  2. Missing label encoder regeneration
  3. No hyperparameter tuning

Steps:
  - Load clinical_dataset.csv
  - Filter to the 37 known disease classes
  - Train/val/test split (70/15/15)
  - Compute per-sample class weights (balanced)
  - Train XGBoost with improved hyperparameters + early stopping
  - Evaluate: accuracy, macro F1, weighted F1, per-class report
  - Save new artifacts (backup old model first)
  - Print sanity test results on new model

Usage:
    python scripts/retrain_clinical_model.py
"""

import os
import sys
import json
import pickle
import shutil
import warnings
import logging
from pathlib import Path
from datetime import datetime

warnings.filterwarnings("ignore")
logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(message)s")
log = logging.getLogger("retrain")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.utils.class_weight import compute_sample_weight
from sklearn.metrics import (
    classification_report,
    accuracy_score,
    f1_score,
    confusion_matrix,
)
import xgboost as xgb

# ── Paths ─────────────────────────────────────────────────────────────────────
DATASET_PATH  = PROJECT_ROOT / "datasets" / "clinical_dataset.csv"
MODELS_DIR    = PROJECT_ROOT / "models"
MODEL_OUT     = MODELS_DIR / "clinical_xgboost.pkl"
LE_OUT        = MODELS_DIR / "clinical_label_encoder.pkl"
FEATURES_OUT  = MODELS_DIR / "clinical_features.pkl"
MAPPING_OUT   = MODELS_DIR / "clinical_class_mapping.json"
BACKUP_DIR    = MODELS_DIR / "clinical" / "backups"

RANDOM_STATE  = 42
MIN_CLASS_SAMPLES = 10   # Drop disease classes with fewer than this many samples

# Known 37-class whitelist (alphabetical — must match training LabelEncoder order)
KNOWN_CLASSES = [
    "Amyotrophic_Lateral_Sclerosis", "Asthma", "COPD", "COVID19",
    "Chronic_Kidney_Disease", "Cirrhosis", "Common_Cold",
    "Coronary_Artery_Disease", "Cystic_Fibrosis", "Dengue", "Depression",
    "Ehlers_Danlos_Syndrome", "Epilepsy", "Flu", "Gastritis",
    "Gaucher_Disease", "Generalized_Anxiety_Disorder", "Hypertension",
    "Hyperthyroidism", "Hypothyroidism", "Inflammatory_Bowel_Disease",
    "Irritable_Bowel_Syndrome", "Marfan_Syndrome", "Migraine",
    "Multiple_Sclerosis", "Niemann_Pick_Disease", "Obesity",
    "Osteoarthritis", "Osteopetrosis", "Peptic_Ulcer_Disease", "Pneumonia",
    "Polycystic_Ovary_Syndrome", "Spinal_Muscular_Atrophy", "Stroke",
    "Systemic_Lupus_Erythematosus", "Tuberculosis", "Type2_Diabetes",
]


def backup_existing_artifacts():
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    for src in [MODEL_OUT, LE_OUT, FEATURES_OUT, MAPPING_OUT]:
        if src.exists():
            dst = BACKUP_DIR / f"{src.stem}_{ts}{src.suffix}"
            shutil.copy2(src, dst)
            log.info(f"Backed up {src.name} -> {dst.name}")


def load_and_prepare_data():
    log.info(f"Loading dataset: {DATASET_PATH}")
    df = pd.read_csv(DATASET_PATH)
    log.info(f"Raw dataset shape: {df.shape}")

    # Detect target column
    target_col = next(
        (c for c in ["disease", "Disease", "label", "Label", "target", "diagnosis"]
         if c in df.columns),
        None
    )
    if target_col is None:
        raise ValueError(f"Cannot find target column. Columns: {list(df.columns[:10])}")
    log.info(f"Target column: '{target_col}'")

    # Filter to known 37 classes
    before = len(df)
    df = df[df[target_col].isin(KNOWN_CLASSES)].copy()
    log.info(f"Filtered to {len(KNOWN_CLASSES)} known classes: {before} -> {len(df)} rows")

    # Drop classes that still have < MIN_CLASS_SAMPLES after filtering
    counts = df[target_col].value_counts()
    tiny = counts[counts < MIN_CLASS_SAMPLES].index.tolist()
    if tiny:
        log.warning(f"Dropping {len(tiny)} classes with < {MIN_CLASS_SAMPLES} samples: {tiny}")
        df = df[~df[target_col].isin(tiny)].copy()

    log.info(f"Final dataset: {len(df)} rows, {df[target_col].nunique()} classes")

    # Identify feature columns
    feature_cols = [c for c in df.columns if c != target_col
                    and c.startswith(("symptom_", "rare_symptom_"))]
    log.info(f"Feature columns detected: {len(feature_cols)}")

    # Load the saved feature list to preserve training order
    if FEATURES_OUT.exists():
        with open(FEATURES_OUT, "rb") as f:
            saved_features = pickle.load(f)
        # Keep only saved features that exist in the dataset
        feature_cols = [f for f in saved_features if f in df.columns]
        log.info(f"Using saved feature order: {len(feature_cols)} features")
    else:
        feature_cols = sorted(feature_cols)
        log.info(f"No saved feature list — using sorted column order")

    return df, feature_cols, target_col


def train_model(df, feature_cols, target_col):
    X = df[feature_cols].values.astype(np.float32)
    y_raw = df[target_col].values

    # Encode labels
    le = LabelEncoder()
    y = le.fit_transform(y_raw)
    num_classes = len(le.classes_)
    log.info(f"Classes after encoding: {num_classes}")
    log.info(f"Classes: {list(le.classes_)}")

    # Train / val / test split
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.30, random_state=RANDOM_STATE, stratify=y
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.50, random_state=RANDOM_STATE, stratify=y_temp
    )
    log.info(f"Split: train={len(X_train)}, val={len(X_val)}, test={len(X_test)}")

    # --- KEY FIX: class-balanced sample weights ---
    sample_weights_train = compute_sample_weight("balanced", y_train)
    log.info("Computed balanced sample weights for training set")

    # Log class distribution before & effect of weights
    unique, counts = np.unique(y_train, return_counts=True)
    log.info(f"Training class distribution (min={counts.min()}, max={counts.max()}, ratio={counts.max()/counts.min():.1f}x)")

    # XGBoost with improved hyperparameters
    model = xgb.XGBClassifier(
        objective="multi:softprob",
        num_class=num_classes,
        n_estimators=500,
        max_depth=6,
        learning_rate=0.05,
        min_child_weight=5,
        subsample=0.8,
        colsample_bytree=0.8,
        gamma=0.1,
        reg_alpha=0.1,
        reg_lambda=1.0,
        use_label_encoder=False,
        eval_metric="mlogloss",
        early_stopping_rounds=30,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        verbosity=0,
    )

    log.info("Training XGBoost classifier with balanced sample weights...")
    model.fit(
        X_train, y_train,
        sample_weight=sample_weights_train,
        eval_set=[(X_val, y_val)],
        verbose=50,
    )
    log.info(f"Best iteration: {model.best_iteration}")

    return model, le, X_test, y_test, feature_cols


def evaluate_model(model, le, X_test, y_test):
    y_pred = model.predict(X_test)
    y_true_names = le.inverse_transform(y_test)
    y_pred_names = le.inverse_transform(y_pred)

    acc = accuracy_score(y_test, y_pred)
    macro_f1 = f1_score(y_test, y_pred, average="macro", zero_division=0)
    weighted_f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
    macro_p = f1_score(y_test, y_pred, average="macro", zero_division=0)
    macro_r = f1_score(y_test, y_pred, average="macro", zero_division=0)

    print("\n" + "=" * 70)
    print("NEW MODEL EVALUATION RESULTS")
    print("=" * 70)
    print(f"  Accuracy        : {acc*100:.2f}%")
    print(f"  Macro F1        : {macro_f1*100:.2f}%")
    print(f"  Weighted F1     : {weighted_f1*100:.2f}%")
    print("\nPer-class report:")
    print(classification_report(y_true_names, y_pred_names, zero_division=0))

    # Confusion pairs
    labels = sorted(set(y_true_names) | set(y_pred_names))
    cm = confusion_matrix(y_true_names, y_pred_names, labels=labels)
    pairs = []
    for i, tl in enumerate(labels):
        for j, pl in enumerate(labels):
            if i != j and cm[i, j] > 0:
                pairs.append((cm[i, j], tl, pl))
    pairs.sort(reverse=True)
    print("Top-10 confusion pairs:")
    for cnt, tl, pl in pairs[:10]:
        print(f"  True={tl:<42} Pred={pl:<42} N={cnt}")

    return {
        "accuracy": f"{acc*100:.2f}%",
        "macro_f1": f"{macro_f1*100:.2f}%",
        "weighted_f1": f"{weighted_f1*100:.2f}%",
    }


def save_artifacts(model, le, feature_cols):
    # Save model
    with open(MODEL_OUT, "wb") as f:
        pickle.dump(model, f, protocol=4)
    log.info(f"Saved model -> {MODEL_OUT}")

    # Save label encoder
    with open(LE_OUT, "wb") as f:
        pickle.dump(le, f, protocol=4)
    log.info(f"Saved label encoder -> {LE_OUT}")

    # Save features (only if count changed, otherwise preserve)
    with open(FEATURES_OUT, "wb") as f:
        pickle.dump(feature_cols, f, protocol=4)
    log.info(f"Saved {len(feature_cols)} features -> {FEATURES_OUT}")

    # Rebuild class mapping from LabelEncoder
    class_mapping = {str(i): cls for i, cls in enumerate(le.classes_)}
    with open(MAPPING_OUT, "w", encoding="utf-8") as f:
        json.dump(class_mapping, f, indent=2, ensure_ascii=False)
    log.info(f"Saved class mapping ({len(class_mapping)} classes) -> {MAPPING_OUT}")

    log.info("All artifacts saved successfully.")
    return class_mapping


def run_sanity_tests(model, feature_cols, class_mapping):
    feat_idx = {f: i for i, f in enumerate(feature_cols)}

    CASES = [
        {
            "name": "Test 1 - Respiratory/Flu",
            "symptoms": ["symptom_fever", "symptom_cough", "symptom_fatigue",
                         "symptom_shortness_of_breath", "symptom_chills",
                         "symptom_productive_cough", "symptom_sore_throat"],
            "expected": ["Flu", "Common_Cold", "COVID19", "Pneumonia"],
        },
        {
            "name": "Test 2 - Diabetes",
            "symptoms": ["symptom_polyuria", "symptom_polydipsia", "symptom_polyphagia",
                         "symptom_fatigue"],
            "expected": ["Type2_Diabetes"],
        },
        {
            "name": "Test 3 - Migraine",
            "symptoms": ["symptom_headache", "symptom_nausea", "symptom_photophobia",
                         "symptom_phonophobia", "symptom_vomiting"],
            "expected": ["Migraine"],
        },
        {
            "name": "Test 4 - Gastroenteritis",
            "symptoms": ["symptom_abdominal_pain", "symptom_diarrhea", "symptom_vomiting",
                         "symptom_fever", "symptom_nausea"],
            "expected": ["Gastritis", "Irritable_Bowel_Syndrome",
                         "Inflammatory_Bowel_Disease", "Peptic_Ulcer_Disease"],
        },
        {
            "name": "Test 5 - Pneumonia (strong)",
            "symptoms": ["symptom_fever", "symptom_cough", "symptom_productive_cough",
                         "symptom_pleuritic_chest_pain", "symptom_shortness_of_breath",
                         "symptom_chills", "symptom_fatigue", "symptom_hemoptysis"],
            "expected": ["Pneumonia", "Tuberculosis", "COVID19"],
        },
    ]

    print("\n" + "=" * 70)
    print("SANITY TEST RESULTS (NEW MODEL)")
    print("=" * 70)
    passed = 0
    for case in CASES:
        v = np.zeros((1, len(feature_cols)), dtype=np.float32)
        matched = []
        for s in case["symptoms"]:
            if s in feat_idx:
                v[0, feat_idx[s]] = 1.0
                matched.append(s)
        probas = model.predict_proba(v)[0]
        top5 = np.argsort(probas)[::-1][:5]
        top_disease = class_mapping.get(str(int(top5[0])), "UNKNOWN")
        ok = any(e in top_disease for e in case["expected"])
        if ok:
            passed += 1
        print(f"\n  {case['name']}")
        print(f"  Matched {len(matched)}/{len(case['symptoms'])} symptoms")
        for rank, idx in enumerate(top5):
            d = class_mapping.get(str(idx), f"UNK_{idx}")
            flag = " <- expected" if any(e in d for e in case["expected"]) else ""
            print(f"    {rank+1}. [{idx:>2}] {d:<42} {probas[idx]*100:6.2f}%{flag}")
        print(f"  Result: {'PASS' if ok else 'FAIL'}  (top={top_disease})")
    print(f"\n  Sanity tests: {passed}/{len(CASES)} passed")
    return passed, len(CASES)


def main():
    print("=" * 70)
    print("MedIntel AI - Clinical XGBoost Retraining")
    print("=" * 70)

    # 1. Backup
    backup_existing_artifacts()

    # 2. Load data
    df, feature_cols, target_col = load_and_prepare_data()

    # 3. Train
    model, le, X_test, y_test, feature_cols = train_model(df, feature_cols, target_col)

    # 4. Evaluate
    metrics = evaluate_model(model, le, X_test, y_test)

    # 5. Save
    class_mapping = save_artifacts(model, le, feature_cols)

    # 6. Sanity tests
    passed, total = run_sanity_tests(model, feature_cols, class_mapping)

    print("\n" + "=" * 70)
    print("RETRAINING SUMMARY")
    print("=" * 70)
    print(f"  Accuracy        : {metrics['accuracy']}")
    print(f"  Macro F1        : {metrics['macro_f1']}")
    print(f"  Weighted F1     : {metrics['weighted_f1']}")
    print(f"  Sanity tests    : {passed}/{total} passed")
    print(f"  Model saved to  : {MODEL_OUT}")
    print(f"  Label encoder   : {LE_OUT}")
    print("=" * 70)


if __name__ == "__main__":
    main()
