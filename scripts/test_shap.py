import os
import sys

print("Testing numba...", flush=True)
import numba
print(f"Numba: {numba.__version__}", flush=True)

print("Testing shap...", flush=True)
import shap
print(f"SHAP: {shap.__version__}", flush=True)
