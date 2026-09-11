import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["OMP_NUM_THREADS"] = "1"

print("Importing xgboost first...", flush=True)
import xgboost
print(f"XGBoost: {xgboost.__version__}", flush=True)

print("Importing torch...", flush=True)
import torch
print(f"Torch: {torch.__version__}", flush=True)

print("Importing torchvision...", flush=True)
import torchvision
print(f"Torchvision: {torchvision.__version__}", flush=True)

print("Importing shap...", flush=True)
import shap
print(f"SHAP: {shap.__version__}", flush=True)

print("Importing PIL...", flush=True)
import PIL
print(f"Pillow: {PIL.__version__}", flush=True)

print("ALL PACKAGES LOADED SUCCESSFULLY!", flush=True)
