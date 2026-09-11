import os
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["OMP_NUM_THREADS"] = "1"

from backend.app.services.model_manager import model_manager

print("Initializing ModelManager and loading all models...", flush=True)
model_manager.load_all_models()

status = model_manager.get_status()
print("\n--- Model Manager Status ---", flush=True)
print("All loaded:", status["all_loaded"])
for mod_name, mod_info in status["modules"].items():
    print(f"Module [{mod_name}]: Loaded = {mod_info.get('loaded')}")

print("\nClinical model details:")
print(f"Features: {len(model_manager.clinical_features)}")
print(f"Classes: {len(model_manager.clinical_class_mapping)}")

print("\nImaging model details:")
print(f"Model: {model_manager.imaging_model.__class__.__name__}")
print(f"Device: {model_manager.device}")

print("\nNLP module details:")
print(f"Precomputed records: {len(model_manager.nlp_standardized_records)}")
if model_manager.nlp_embeddings is not None:
    print(f"Embedding shape: {model_manager.nlp_embeddings.shape}")

print("\nMultimodal Fusion details:")
print(f"Synthetic cases count: {len(model_manager.synthetic_cases)}")
print("MODEL MANAGER TEST PASSED!")
