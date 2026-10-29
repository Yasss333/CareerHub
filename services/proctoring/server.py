from pathlib import Path
from dotenv import load_dotenv
import io
import asyncio
import threading
import time
import shutil
import subprocess
import hmac
import os
import cv2
import numpy as np
import librosa
from pydantic import BaseModel
from fastapi import FastAPI, File, UploadFile, Form, Header, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool
from transcription import transcribe

from fusion_engine_new import FusionEngine
from face_verifier import FaceVerifier
from text_inference import TextEmotionPredictor
from facial_inference import FacialInference
from voice_inference import VoiceInference

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
load_dotenv(BASE_DIR / ".env")

app = FastAPI(
    title="CareerHub AI Interview ML Service",
    description="Multimodal Emotion Analysis and Face Proctoring Microservice",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

facial_model = None
voice_model = None
face_verifier = None
text_predictor = None
fusion_engine = FusionEngine()


def require_service_auth(x_interview_service_token: str = Header(default="")):
    expected = os.getenv("INTERVIEW_ML_TOKEN", "")
    if not expected:
        raise HTTPException(status_code=503, detail="ML service authentication is not configured")
    if expected and not hmac.compare_digest(x_interview_service_token, expected):
        raise HTTPException(status_code=401, detail="Unauthorized service request")


@app.on_event("startup")
def load_models():
    global facial_model, voice_model, face_verifier, text_predictor

    print("\n[ML Service] Initializing AI models...")

    try:
        face_verifier = FaceVerifier(threshold=0.70)
        print("[ML Service] Face verifier loaded.")
    except Exception as error:
        face_verifier = None
        print(f"[ML Service] Face verification unavailable: {error}")

    try:
        facial_model = FacialInference()
        print("[ML Service] Facial emotion model loaded.")
    except Exception as error:
        facial_model = None
        print(f"[ML Service] Facial emotion model unavailable: {error}")

    try:
        voice_model = VoiceInference()
        print("[ML Service] Voice emotion model loaded.")
    except Exception as error:
        voice_model = None
        print(f"[ML Service] Voice emotion model unavailable: {error}")

    try:
        text_predictor = TextEmotionPredictor()
        print("[ML Service] Text emotion model loaded.")
    except Exception as error:
        text_predictor = None
        print(f"[ML Service] Text emotion model unavailable: {error}")

    print(
        f"[ML Service] System ready: face={facial_model is not None}, "
        f"voice={voice_model is not None}, text={text_predictor is not None}, "
        f"verifier={face_verifier is not None}\n"
    )


@app.on_event('startup')
async def start_session_expiry():
    async def expire_idle_sessions():
        while True:
            await asyncio.sleep(30)
            if face_verifier is not None:
                face_verifier.clear_expired_sessions()
    app.state.expiry_task = asyncio.create_task(expire_idle_sessions())


@app.on_event('shutdown')
async def stop_session_expiry():
    task = getattr(app.state, 'expiry_task', None)
    if task:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "CareerHub AI Interview ML Service",
        "version": "1.0.0",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "facial_model_loaded": facial_model is not None,
        "voice_model_loaded": voice_model is not None,
        "text_model_loaded": text_predictor is not None,
        "face_verification_loaded": face_verifier is not None,
    }


@app.post("/predict/face", dependencies=[Depends(require_service_auth)])
async def predict_face(file: UploadFile = File(...)):
    if facial_model is None:
        return {"success": False, "error": "Facial model is not loaded"}

    try:
        image_bytes = await file.read(10 * 1024 * 1024 + 1)
        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Image exceeds the 10 MB limit")

        if not image_bytes:
            return {"success": False, "error": "Empty image received"}

        image_array = np.frombuffer(image_bytes, dtype=np.uint8)
        image_bgr = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        if image_bgr is None:
            return {"success": False, "error": "Could not decode image"}

        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        predictions = facial_model.predict(image_rgb)
        dominant_emotion = max(predictions, key=predictions.get)
        confidence = float(predictions[dominant_emotion])

        return {
            "success": True,
            "emotion": dominant_emotion,
            "confidence": confidence,
            "predictions": predictions,
        }
    except Exception as e:
        print(f"[ML Service] Face prediction error: {e}")
        return {"success": False, "error": str(e)}


@app.post("/proctor/register", dependencies=[Depends(require_service_auth)])
async def register_proctor_face(file: UploadFile = File(...), session_id: str = Form(...)):
    if face_verifier is None:
        return {"success": False, "status": "ERROR", "message": "Face verifier is unavailable"}

    contents = await file.read(10 * 1024 * 1024 + 1)
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image exceeds the 10 MB limit")

    temp_path = BASE_DIR / f"proctor_register_{time.time_ns()}.jpg"
    try:
        temp_path.write_bytes(contents)
        result = face_verifier.register(str(temp_path), session_id)
        result.pop("embedding", None)
        return result
    except Exception as e:
        print(f"[Proctor] Registration error: {e}")
        return {"status": "ERROR", "message": str(e)}
    finally:
        if temp_path.exists():
            temp_path.unlink()


@app.post("/proctor/verify", dependencies=[Depends(require_service_auth)])
async def verify_proctor_face(file: UploadFile = File(...), session_id: str = Form(...)):
    if face_verifier is None:
        return {"status": "ERROR", "message": "Face verifier is not loaded"}

    contents = await file.read(10 * 1024 * 1024 + 1)
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image exceeds the 10 MB limit")

    temp_path = BASE_DIR / f"proctor_verify_{time.time_ns()}.jpg"
    try:
        temp_path.write_bytes(contents)
        result = face_verifier.verify(str(temp_path), session_id=session_id)
        return result
    except Exception as e:
        print(f"[Proctor] Verification error: {e}")
        return {"status": "ERROR", "message": str(e)}
    finally:
        if temp_path.exists():
            temp_path.unlink()


@app.delete("/proctor/session/{session_id}", dependencies=[Depends(require_service_auth)])
def clear_proctor_session(session_id: str):
    if face_verifier is not None:
        face_verifier.clear_session(session_id)
    return {"success": True}


@app.post("/predict/voice", dependencies=[Depends(require_service_auth)])
async def predict_voice(file: UploadFile = File(...)):
    if voice_model is None:
        return {"success": False, "error": "Voice model is unavailable"}

    audio_bytes = await file.read(10 * 1024 * 1024 + 1)
    if len(audio_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Audio exceeds the 10 MB limit")

    input_path = None
    output_path = None

    try:
        input_path = BASE_DIR / f"temp_input_{time.time_ns()}.webm"
        output_path = BASE_DIR / f"temp_output_{time.time_ns()}.wav"
        input_path.write_bytes(audio_bytes)

        if not shutil.which("ffmpeg"):
            return {
                "success": False,
                "error": "ffmpeg is not installed on this host. Audio transcoding requires ffmpeg.",
            }

        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(input_path),
                "-ar",
                str(voice_model.SR),
                "-ac",
                "1",
                "-sample_fmt",
                "s16",
                str(output_path),
            ],
            check=True,
            capture_output=True,
            text=True,
        )

        audio, _ = librosa.load(str(output_path), sr=voice_model.SR, mono=True)
        result = voice_model.predict(audio)
        if not result:
            raise ValueError("Voice model returned no predictions.")

        emotion = max(result, key=result.get)
        confidence = float(result[emotion])

        return {
            "success": True,
            "emotion": emotion,
            "confidence": confidence,
            "predictions": result,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        if input_path and input_path.exists():
            input_path.unlink()
        if output_path and output_path.exists():
            output_path.unlink()


@app.post("/predict/text", dependencies=[Depends(require_service_auth)])
async def predict_text(request: dict):
    try:
        if text_predictor is None:
            raise HTTPException(status_code=503, detail="Text emotion model is unavailable")

        text = request.get("text", "").strip()
        if not text:
            return {"success": False, "error": "No text provided"}

        result = text_predictor.predict(text)
        return result
    except Exception as e:
        print(f"[ML Service] Text prediction error: {e}")
        return {"success": False, "error": str(e)}


transcription_slots = threading.BoundedSemaphore(2)


@app.post('/transcribe', dependencies=[Depends(require_service_auth)])
async def transcribe_audio(file: UploadFile = File(...)):
    content_type = (file.content_type or '').split(';')[0]
    if content_type not in {'audio/webm', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/mpeg', 'audio/x-wav'}:
        raise HTTPException(status_code=415, detail='Unsupported audio format')
    audio = await file.read(10 * 1024 * 1024 + 1)
    if len(audio) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail='Audio exceeds the 10 MB limit')
    if not transcription_slots.acquire(blocking=False):
        raise HTTPException(status_code=503, detail='Transcription is busy; please retry')
    try:
        return await run_in_threadpool(transcribe, audio, content_type)
    except Exception:
        raise HTTPException(status_code=503, detail='Transcription is currently unavailable')
    finally:
        transcription_slots.release()


class FusionRequest(BaseModel):
    face: dict[str, float] | None = None
    voice: dict[str, float] | None = None
    text: dict[str, float] | None = None


@app.post("/fusion", dependencies=[Depends(require_service_auth)])
async def fuse_emotions(request: FusionRequest):
    try:
        result = fusion_engine.fuse(
            face=request.face,
            voice=request.voice,
            text=request.text,
        )
        return result
    except Exception as e:
        print(f"[ML Service] Fusion error: {e}")
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", os.getenv("APP_PORT", 7860 if os.getenv("SPACE_ID") else 8000)))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)
