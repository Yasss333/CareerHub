# ============================================================
# VOICE EMOTION INFERENCE
# Wav2Vec2 Speech Emotion Recognition
# ============================================================

import os
import torch
import torch.nn as nn
import numpy as np
from pathlib import Path
from transformers import AutoModelForAudioClassification, AutoFeatureExtractor

MODEL_NAME = "ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition"

TARGET_CLASSES = [
    "anger",
    "disgust",
    "fear",
    "happiness",
    "sadness",
    "surprise",
    "neutral",
]

VOICE_ALIAS_MAP = {
    "angry": "anger",
    "calm": "neutral",
    "fearful": "fear",
    "happy": "happiness",
    "sad": "sadness",
    "surprised": "surprise",
}


class VoiceInference:
    SR = 16000
    DURATION = 3.0

    def __init__(self, model_path: str = None, *args):
        print("\n[VoiceInference] Initializing Speech Emotion Recognition...")
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"  Device: {self.device}")
        self.classes = TARGET_CLASSES.copy()

        print(f"  Loading Hugging Face model: {MODEL_NAME}")
        try:
            self.feature_extractor = AutoFeatureExtractor.from_pretrained(MODEL_NAME)
            self.model = AutoModelForAudioClassification.from_pretrained(MODEL_NAME)
            self.model.to(self.device)
            self.model.eval()
            print("  Wav2Vec2 voice emotion model is ready.")
        except Exception as e:
            print(f"  Could not load Wav2Vec2 model: {e}")
            raise RuntimeError(f"Voice emotion model failed to initialize: {e}")

    @torch.no_grad()
    def predict(self, audio: np.ndarray) -> dict:
        """
        audio: 1D float32 numpy array at 16000 Hz
        """
        if audio is None or len(audio) == 0:
            return {c: (1.0 / len(self.classes)) for c in self.classes}

        try:
            # Ensure 1D mono float32
            if audio.ndim > 1:
                audio = np.mean(audio, axis=-1)
            audio = audio.astype(np.float32)

            inputs = self.feature_extractor(
                audio,
                sampling_rate=self.SR,
                return_tensors="pt",
                padding=True
            )
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            logits = self.model(**inputs).logits
            probs = torch.softmax(logits, dim=-1).squeeze(0).cpu().numpy()

            id2label = getattr(self.model.config, "id2label", {})
            raw_scores = {}
            for idx, prob in enumerate(probs):
                raw_label = str(id2label.get(idx, f"emotion_{idx}")).lower()
                canonical = VOICE_ALIAS_MAP.get(raw_label, raw_label)
                raw_scores[canonical] = raw_scores.get(canonical, 0.0) + float(prob)

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
            print(f"[VoiceInference] Error during inference: {e}")
            return {c: (1.0 / len(self.classes)) for c in self.classes}
