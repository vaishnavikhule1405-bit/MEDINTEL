import io
import base64
import logging
from typing import Dict, Any, Tuple
import numpy as np
from PIL import Image
import matplotlib.cm as cm
import torch
import torch.nn.functional as F
from torchvision import transforms

from backend.app.config import settings
from backend.app.services.model_manager import model_manager
from backend.app.schemas.imaging import (
    VisualEvidence,
    ImagingModelMetrics,
    ImagingPredictionResponse,
    ImagingModelInfoResponse
)

logger = logging.getLogger("medintel.imaging_service")

# Benchmark metrics from trained Major Project artifacts
CUSTOM_CNN_METRICS = ImagingModelMetrics(
    model_name="Custom CNN (Selected Primary Model)",
    architecture="4-Block Convolutional Network + BatchNorm + MaxPool + AdaptiveAvgPool + Linear Classifier",
    task="Binary Chest X-Ray Classification (Normal vs Pneumonia)",
    accuracy="84.46%",
    macro_precision="88.91%",
    macro_recall="79.62%",
    macro_f1="81.62%",
    pneumonia_precision="80.58%",
    pneumonia_f1="88.84%",
    pneumonia_sensitivity="98.97%",
    specificity="60.26%",
    roc_auc="93.25%"
)

DENSENET121_METRICS = ImagingModelMetrics(
    model_name="DenseNet121 (Transfer Learning Benchmark)",
    architecture="Pretrained DenseNet121 Backbone + Dense Transition Layers + Global Pooling",
    task="Binary Chest X-Ray Classification (Normal vs Pneumonia)",
    accuracy="82.53%",
    macro_precision="84.15%",
    macro_recall="78.42%",
    macro_f1="79.92%",
    pneumonia_precision="78.89%",
    pneumonia_f1="87.16%",
    pneumonia_sensitivity="94.87%",
    specificity="61.97%",
    roc_auc="92.65%"
)


class ImagingService:
    def __init__(self):
        self.device = model_manager.device
        self.preprocess = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def _pil_to_base64(self, image: Image.Image) -> str:
        """Convert a PIL Image to a base64 PNG data URI string."""
        buf = io.BytesIO()
        image.save(buf, format="PNG")
        b64_str = base64.b64encode(buf.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{b64_str}"

    def compute_gradcam(
        self,
        model: torch.nn.Module,
        input_tensor: torch.Tensor,
        target_class: int
    ) -> np.ndarray:
        """
        Compute Grad-CAM heatmap on target convolutional layer 'block4[0]'.
        Uses hooks with cloned tensors to support backpropagation cleanly.
        """
        activations = []
        gradients = []

        def forward_hook(module, inp, out):
            activations.append(out.clone())

        def backward_hook(module, grad_in, grad_out):
            gradients.append(grad_out[0].clone())

        # Hook target layer block4[0]
        target_layer = model.block4[0]
        f_handle = target_layer.register_forward_hook(forward_hook)
        b_handle = target_layer.register_full_backward_hook(backward_hook)

        try:
            model.zero_grad()
            output = model(input_tensor)
            score = output[0, target_class]
            score.backward()

            act = activations[0]
            grad = gradients[0]

            # Global average pool gradients along spatial dimensions (H, W)
            weights = torch.mean(grad, dim=(2, 3), keepdim=True)
            cam = torch.sum(weights * act, dim=1, keepdim=True)

            # Apply ReLU with relative activation fallback
            relu_cam = F.relu(cam)
            if relu_cam.max() > 0:
                heatmap = relu_cam.squeeze().detach().cpu().numpy()
            else:
                heatmap = (cam - cam.min()).squeeze().detach().cpu().numpy()

            # Normalize to 0-1 range
            heatmap = (heatmap - heatmap.min()) / (heatmap.max() - heatmap.min() + 1e-8)
            return heatmap
        finally:
            f_handle.remove()
            b_handle.remove()

    def generate_visual_evidence(
        self,
        original_pil: Image.Image,
        heatmap_2d: np.ndarray
    ) -> Tuple[str, str, str]:
        """
        Resize heatmap, apply colormap, blend with original chest X-ray,
        and return base64 data URIs for original, heatmap, and overlay.
        """
        # Resize original image to 224x224 RGB
        orig_224 = original_pil.resize((224, 224)).convert("RGB")
        orig_np = np.array(orig_224, dtype=np.float32) / 255.0

        # Resize heatmap to 224x224
        heatmap_tensor = torch.from_numpy(heatmap_2d).unsqueeze(0).unsqueeze(0).float()
        resized_heatmap = F.interpolate(
            heatmap_tensor,
            size=(224, 224),
            mode="bilinear",
            align_corners=False
        ).squeeze().numpy()

        # Apply Jet colormap (compatible with matplotlib 3.8+)
        try:
            import matplotlib as mpl
            colormap = mpl.colormaps["jet"]
        except Exception:
            colormap = cm.jet
        colored_heatmap = colormap(resized_heatmap)[:, :, :3]  # Drop alpha

        # Blend original with heatmap (0.6 original + 0.4 heatmap)
        blended = 0.6 * orig_np + 0.4 * colored_heatmap
        blended = np.clip(blended * 255.0, 0, 255).astype(np.uint8)
        heatmap_uint8 = np.clip(colored_heatmap * 255.0, 0, 255).astype(np.uint8)

        overlay_img = Image.fromarray(blended)
        heatmap_img = Image.fromarray(heatmap_uint8)

        return (
            self._pil_to_base64(orig_224),
            self._pil_to_base64(heatmap_img),
            self._pil_to_base64(overlay_img)
        )

    def predict_and_explain(self, image_bytes: bytes) -> ImagingPredictionResponse:
        """
        Process uploaded chest X-ray:
        Runs inference through Custom CNN and generates dynamic Grad-CAM visual evidence.
        """
        model = model_manager.imaging_model
        if model is None:
            raise RuntimeError("Imaging model CustomCNN is not loaded in ModelManager.")

        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as e:
            raise ValueError(f"Invalid image format or corrupted file: {str(e)}")

        input_tensor = self.preprocess(image).unsqueeze(0).to(self.device)

        # Forward pass for prediction probabilities
        model.eval()
        with torch.no_grad():
            logits = model(input_tensor)
            probs = F.softmax(logits, dim=1)[0]
            normal_prob = float(probs[0].item())
            pneumonia_prob = float(probs[1].item())

        predicted_idx = 1 if pneumonia_prob >= 0.5 else 0
        predicted_class = "PNEUMONIA" if predicted_idx == 1 else "NORMAL"
        confidence = pneumonia_prob if predicted_idx == 1 else normal_prob

        # Dynamic Grad-CAM generation
        # Use input with gradient enabled for backward pass
        grad_input = self.preprocess(image).unsqueeze(0).to(self.device)
        heatmap_2d = self.compute_gradcam(model, grad_input, target_class=predicted_idx)

        # Render visualizations
        orig_b64, heat_b64, over_b64 = self.generate_visual_evidence(image, heatmap_2d)

        visual_evidence = VisualEvidence(
            evidence_label="Visual Model Evidence",
            target_layer="block4.0",
            heatmap_base64=heat_b64,
            overlay_base64=over_b64,
            original_base64=orig_b64,
            disclaimer=settings.VISUAL_EVIDENCE_DISCLAIMER
        )

        return ImagingPredictionResponse(
            predicted_class=predicted_class,
            normal_probability=normal_prob,
            pneumonia_probability=pneumonia_prob,
            model_confidence=confidence,
            visual_evidence=visual_evidence,
            model_metrics=CUSTOM_CNN_METRICS,
            disclaimer=settings.VISUAL_EVIDENCE_DISCLAIMER,
            safety_note=settings.MEDICAL_DISCLAIMER
        )

    def get_model_info(self) -> ImagingModelInfoResponse:
        """Return Custom CNN vs DenseNet121 architecture and metrics comparison."""
        return ImagingModelInfoResponse(
            selected_model=CUSTOM_CNN_METRICS,
            benchmark_model=DENSENET121_METRICS,
            comparison_summary=(
                "The Custom CNN achieved superior sensitivity (98.97% vs 94.87%) and higher overall "
                "ROC-AUC (93.25% vs 92.65%) compared to DenseNet121, making it the selected primary imaging model."
            ),
            target_gradcam_layer="block4.0 (Conv2d: 128 -> 256)",
            disclaimer=settings.VISUAL_EVIDENCE_DISCLAIMER
        )


imaging_service = ImagingService()
