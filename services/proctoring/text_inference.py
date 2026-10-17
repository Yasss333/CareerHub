# ============================================================
# TEXT EMOTION INFERENCE
# DistilRoBERTa model for speech transcript and text analysis
# Model: j-hartmann/emotion-english-distilroberta-base (Hugging Face)
# ============================================================

import os
import torch
from pathlib import Path
from transformers import AutoTokenizer, AutoModelForSequenceClassification

HF_MODEL_NAME = "j-hartmann/emotion-english-distilroberta-base"

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
    "joy": "happiness",
    "happy": "happiness",
    "sad": "sadness",
    "angry": "anger",
}


class TextEmotionPredictor:
    def __init__(self, model_dir: str = None):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"\n[TextEmotion] Loading text emotion model on: {self.device}")

        source = HF_MODEL_NAME
        # Check if local model_dir has actual model weight files
        if model_dir and Path(model_dir).exists():
            weights_found = list(Path(model_dir).glob("*.safetensors")) + list(Path(model_dir).glob("*.bin"))
            # Don't consider training_args.bin as model weights
            weights_found = [p for p in weights_found if "training_args" not in p.name]
            if weights_found:
                source = model_dir
                print(f"  Using local weights found in: {model_dir}")
            else:
                print(f"  No local model weights in {model_dir}. Using Hugging Face model: {HF_MODEL_NAME}")
        else:
            print(f"  Loading directly from Hugging Face: {HF_MODEL_NAME}")

        self.tokenizer = AutoTokenizer.from_pretrained(source)
        self.model = AutoModelForSequenceClassification.from_pretrained(source).to(self.device)
        self.model.eval()
        self.classes = TARGET_CLASSES
        print("  Text emotion model loaded successfully!")

    def predict(self, text: str):
        if not text or not text.strip():
            return {
                "success": False,
                "error": "No text provided"
            }

        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=128
        )
        inputs = {key: value.to(self.device) for key, value in inputs.items()}

        with torch.no_grad():
            outputs = self.model(**inputs)
            probabilities = torch.softmax(outputs.logits, dim=-1).squeeze(0).cpu().numpy()

        id2label = getattr(self.model.config, "id2label", {})
        raw_predictions = {}
        for idx, prob in enumerate(probabilities):
            raw_label = str(id2label.get(idx, f"emotion_{idx}")).lower()
            canonical = ALIAS_MAP.get(raw_label, raw_label)
            raw_predictions[canonical] = float(prob)

        # Normalize across the 7 target classes
        output_predictions = {}
        total = 0.0
        for emotion in self.classes:
            val = raw_predictions.get(emotion, 0.0)
            output_predictions[emotion] = val
            total += val

        if total > 0:
            output_predictions = {k: round(v / total, 4) for k, v in output_predictions.items()}

        top_emotion = max(output_predictions, key=output_predictions.get)
        confidence = float(output_predictions[top_emotion])

        return {
            "success": True,
            "emotion": top_emotion,
            "confidence": confidence,
            "predictions": output_predictions,
        }
