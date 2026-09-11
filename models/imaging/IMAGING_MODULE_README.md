# MedIntel AI — Imaging Module

## Task
Binary chest X-ray classification:
- NORMAL
- PNEUMONIA

## Primary Model
Custom CNN trained from scratch.

## Benchmark
DenseNet121 using transfer learning.

## Selected Model
Custom CNN.

## Test Performance
- Accuracy: 84.46%
- Macro Precision: 88.91%
- Macro Recall: 79.62%
- Macro F1: 81.62%
- Pneumonia Precision: 80.58%
- Pneumonia F1: 88.84%
- Pneumonia Sensitivity: 98.97%
- Specificity: 60.26%
- ROC-AUC: 93.25%

## Explainability
Grad-CAM using the final convolutional layer:
block4.0

## Input
224 x 224 RGB image.

## Output
The model produces:
- predicted class
- NORMAL probability
- PNEUMONIA probability

Grad-CAM provides model-focused visual evidence.

## Important Limitation
The model is intended as a research/clinical decision-support
component and not as an autonomous medical diagnosis system.
Grad-CAM visualizations are model explanations and are not
clinically validated lesion localization.