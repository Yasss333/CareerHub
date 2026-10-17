# ============================================================
# FACIAL INFERENCE
# ViT-Base-Patch16-224 facial emotion model
# Model: trpakov/vit-face-expression (Hugging Face)
# Input  : cropped face image (numpy RGB)
# Output : dict {emotion: confidence}
# ============================================================

import os
import torch
import torch.nn as nn
import numpy as np
import cv2
from pathlib import Path
from transformers import AutoModelForImageClassification

MODEL_NAME = "trpakov/vit-face-expression"

TARGET_CLASSES = [
    "anger",
    "disgust",
    "fear",
    "happiness",
    "sadness",
    "surprise",
    "neutral",
]

ALIAS_MAP = {
    "angry": "anger",
    "happy": "happiness",
    "sad": "sadness"
}


class FacialInference:
    MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    IMAGE_SIZE = 224

    def __init__(self, model_path: str = None, classes_path: str = None):
        print("\n[FacialInference] Initializing ViT Facial Emotion Model...")
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"  Device: {self.device}")
        self.classes = TARGET_CLASSES

        print(f"  Loading Hugging Face model: {MODEL_NAME}")
        try:
            self.model = AutoModelForImageClassification.from_pretrained(
                MODEL_NAME,
                num_labels=7,
                ignore_mismatched_sizes=True
            )
        except Exception as e:
            print(f"  Failed to load {MODEL_NAME} from Hugging Face: {e}")
            raise RuntimeError(f"Could not load facial model: {e}")

        # If a custom checkpoint exists and matches, attempt loading
        if model_path and Path(model_path).exists():
            try:
                state_dict = torch.load(model_path, map_location=self.device, weights_only=True)
                self.model.load_state_dict(state_dict)
                print(f"  Loaded custom weights from {model_path}")
            except Exception as err:
                print(f"  Note: Custom weights in {model_path} did not match ViT architecture ({err}). Using official Hugging Face pretrained weights.")

        self.model.to(self.device)
        self.model.eval()

        # Warmup pass
        try:
            dummy = torch.zeros(1, 3, self.IMAGE_SIZE, self.IMAGE_SIZE, device=self.device)
            with torch.no_grad():
                _ = self.model(dummy)
            print("  ViT facial emotion model is ready.")
        except Exception as e:
            print(f"  Warmup error: {e}")

    def preprocess(self, face_rgb: np.ndarray) -> torch.Tensor:
        if face_rgb is None or face_rgb.size == 0:
            raise ValueError("face_rgb is empty or None")

        img = cv2.resize(face_rgb, (self.IMAGE_SIZE, self.IMAGE_SIZE))
        img = img.astype(np.float32) / 255.0
        img = (img - self.MEAN) / self.STD
        img = img.transpose(2, 0, 1)  # HWC -> CHW
        tensor = torch.tensor(img, dtype=torch.float32).unsqueeze(0)
        return tensor.to(self.device)

    @torch.no_grad()
    def predict(self, face_rgb: np.ndarray) -> dict:
        if face_rgb is None or face_rgb.size == 0:
            return {c: 0.0 for c in self.classes}

        try:
            tensor = self.preprocess(face_rgb)
            logits = self.model(tensor).logits
            probs_original = torch.softmax(logits, dim=1)

            # Test-time augmentation (horizontal flip)
            flipped_tensor = torch.flip(tensor, dims=[3])
            logits_flip = self.model(flipped_tensor).logits
            probs_flip = torch.softmax(logits_flip, dim=1)

            probs = ((probs_original + probs_flip) / 2.0).squeeze(0).cpu().numpy()

            # Map from Hugging Face model id2label to standard interview classes
            id2label = getattr(self.model.config, "id2label", {})
            raw_scores = {}
            for idx, prob in enumerate(probs):
                raw_label = str(id2label.get(idx, f"emotion_{idx}")).lower()
                canonical = ALIAS_MAP.get(raw_label, raw_label)
                raw_scores[canonical] = float(prob)

            output = {}
            total = 0.0
            for emotion in self.classes:
                val = raw_scores.get(emotion, 0.0)
                output[emotion] = val
                total += val

            if total > 0:
                output = {k: round(v / total, 4) for k, v in output.items()}

            return output

        except Exception as e:
            print(f"[FacialInference] Error during inference: {e}")
            return {c: (1.0 / len(self.classes)) for c in self.classes}
