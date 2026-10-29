"""Reference Whisper transcription, without transcript logging or persistent audio."""
import json
import os
from pathlib import Path
import shutil
import tempfile
import threading
import urllib.request
import uuid

_pipeline = None
_pipeline_lock = threading.Lock()


def _cloud_transcribe(audio: bytes, content_type: str) -> str:
    boundary = uuid.uuid4().hex
    fields = {'model': 'whisper-large-v3-turbo', 'response_format': 'json', 'language': 'en', 'temperature': '0'}
    parts = []
    for name, value in fields.items():
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
    parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="answer.webm"\r\nContent-Type: {content_type}\r\n\r\n'.encode())
    parts.extend([audio, f'\r\n--{boundary}--\r\n'.encode()])
    request = urllib.request.Request(
        'https://api.groq.com/openai/v1/audio/transcriptions', data=b''.join(parts),
        headers={'Authorization': f"Bearer {os.environ['GROQ_API_KEY']}", 'Content-Type': f'multipart/form-data; boundary={boundary}'},
        method='POST',
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        result = json.loads(response.read())
    if not isinstance(result.get('text'), str):
        raise RuntimeError('Transcription returned no text')
    return result['text']


def _local_transcribe(audio: bytes, content_type: str) -> str:
    global _pipeline
    if not shutil.which('ffmpeg'):
        raise RuntimeError('Local transcription requires ffmpeg')
    # Serial inference limits memory pressure; the model is loaded only if cloud transcription is unavailable.
    with _pipeline_lock:
        if _pipeline is None:
            from transformers import pipeline
            _pipeline = pipeline('automatic-speech-recognition', model=os.getenv('WHISPER_MODEL', 'openai/whisper-tiny.en'), device=-1)
        suffix = '.mp4' if content_type == 'audio/mp4' else '.webm'
        with tempfile.TemporaryDirectory(prefix='careerhub-transcription-') as directory:
            source = Path(directory) / f'answer{suffix}'
            source.write_bytes(audio)
            result = _pipeline(str(source))
        if not isinstance(result.get('text'), str):
            raise RuntimeError('Transcription returned no text')
        return result['text']


def transcribe(audio: bytes, content_type: str) -> dict:
    if not audio:
        return {'success': True, 'text': '', 'engine': 'none'}
    if len(audio) > 10 * 1024 * 1024:
        raise ValueError('Audio exceeds the 10 MB limit')
    if os.getenv('GROQ_API_KEY'):
        try:
            text = _cloud_transcribe(audio, content_type)
            return {'success': True, 'text': text.strip()[:12000], 'engine': 'groq-whisper-large-v3-turbo'}
        except Exception:
            pass
    text = _local_transcribe(audio, content_type)
    return {'success': True, 'text': text.strip()[:12000], 'engine': 'local-whisper'}
