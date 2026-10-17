---
title: CareerHub AI Interview ML Service
emoji: 🎙️
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# CareerHub AI Interview ML Service

FastAPI multimodal emotion analysis, behavioral metrics, and face proctoring microservice for the CareerHub platform.

## Features
- **Facial Emotion Recognition**: Real-time facial emotion recognition using Vision Transformer (`trpakov/vit-face-expression`).
- **Text Emotion Recognition**: Speech transcript emotion and tone analysis using DistilRoBERTa (`j-hartmann/emotion-english-distilroberta-base`).
- **Voice Emotion Recognition**: Acoustic speech emotion analysis using Wav2Vec2 (`ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition`).
- **Face Verification & Proctoring**: Identity verification and anti-cheating detection using FaceNet (`facenet-pytorch`).
- **Multimodal Fusion**: Weighted multimodal emotion fusion with stress, confidence, and engagement scoring.

## Deployment on Hugging Face Spaces (Free 16GB RAM)
1. Create a new Space on [Hugging Face Spaces](https://huggingface.co/new-space).
2. Select **Docker** as the SDK.
3. Push or upload the contents of this folder (`services/proctoring/`) to your Space repository.
4. Go to **Settings > Variables and secrets** in your Space:
   - Add Secret: `INTERVIEW_ML_TOKEN` (must match `INTERVIEW_ML_TOKEN` in your Express backend).
5. In your CareerHub API backend (`apps/api/.env` or Render settings):
   - Set `INTERVIEW_ML_URL="https://<your-username>-<your-space-name>.hf.space"`
   - Set `INTERVIEW_ML_TOKEN="<your-secret-token>"`

## Local Development (Docker)
```bash
docker build -t careerhub-proctoring .
docker run -p 8000:7860 -e INTERVIEW_ML_TOKEN="your-token" careerhub-proctoring
```
