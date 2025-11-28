from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import uuid
import os
import shutil
import logging

# ---------- CONFIG ----------
HF_API_URL = "https://api-inference.huggingface.co/models/openai/whisper-small"
HF_TOKEN = os.getenv("HF_TOKEN")
TMP_DIR = "/tmp"
# ----------------------------

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice_journal_stt")

app = FastAPI(title="Voice Journal STT")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...), job_id: str = Form(...)):

    if not HF_TOKEN:
        raise HTTPException(status_code=500, detail="HF_TOKEN is missing")

    # Save file temporarily
    temp_filename = f"{uuid.uuid4()}-{audio.filename}"
    temp_path = os.path.join(TMP_DIR, temp_filename)

    try:
        with open(temp_path, "wb") as tmp:
            shutil.copyfileobj(audio.file, tmp)

        headers = {
            "Authorization": f"Bearer {HF_TOKEN}",
            "Content-Type": "audio/mpeg"
        }

        with open(temp_path, "rb") as f:
            resp = requests.post(HF_API_URL, headers=headers, data=f, timeout=120)

        os.remove(temp_path)

        if resp.status_code == 503:
            raise HTTPException(status_code=503, detail="Whisper model warming up. Try again.")

        if resp.status_code not in (200, 201):
            raise HTTPException(status_code=500, detail=f"HF_Error: {resp.text}")

        body = resp.json()

        transcript = (
            body.get("text")
            or body.get("generated_text")
            or body.get("transcription")
            or ""
        )

        return {"status": "success", "job_id": job_id, "transcript": transcript}

    except HTTPException:
        raise
    except requests.exceptions.RequestException as e:
        logger.exception("HF request failed:")
        raise HTTPException(status_code=500, detail=f"Whisper request failed: {str(e)}")
    except Exception as e:
        logger.exception("Transcription failed:")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
