from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
import os
import uuid
import shutil
import traceback
from dotenv import load_dotenv
load_dotenv()

# Get API key from: https://console.groq.com/keys
# Completely FREE - Whisper Large v3
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
TMP_DIR = "/tmp"

# Initialize Groq client
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

app = FastAPI(title="Voice Journal STT Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/transcribe")
async def transcribe(
    job_id: str = Form(...),
    audio: UploadFile = File(...),
):
    """
    FastAPI gateway that proxies to external Groq Whisper API.
    Receives audio from Celery worker and forwards to Groq.
    """
    if not client:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY not set. Get FREE API key at https://console.groq.com/keys"
        )

    temp_filename = f"{uuid.uuid4()}-{audio.filename}"
    temp_path = f"{TMP_DIR}/{temp_filename}"

    try:
        # Save uploaded file
        with open(temp_path, "wb") as tmp:
            shutil.copyfileobj(audio.file, tmp)

        file_size = os.path.getsize(temp_path)
        print(f"[FASTAPI] Job {job_id}: Proxying {file_size} bytes to external Groq Whisper API")

        # Call external Whisper Large v3 via Groq
        with open(temp_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                file=(temp_filename, audio_file.read()),
                model="whisper-large-v3",
                response_format="json",
                language="en",  # Optional: omit for auto-detect
                temperature=0.0
            )

        # Clean up temp file
        os.remove(temp_path)

        # Extract transcript
        transcript = transcription.text.strip()

        print(f"[FASTAPI] ✓ Job {job_id} completed via external Groq API: '{transcript[:80]}'...")

        return {
            "status": "success",
            "job_id": job_id,
            "transcript": transcript,
            "provider": "groq",
            "model": "whisper-large-v3"
        }

    except Exception as e:
        # Clean up on error
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass

        error_msg = str(e)
        print(f"[FASTAPI] ✗ Job {job_id} failed: {error_msg}")
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=f"External Whisper API failed: {error_msg}"
        )


@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "Voice Journal STT Gateway",
        "description": "Proxies audio transcription to external Groq Whisper API",
        "provider": "Groq",
        "model": "whisper-large-v3",
        "external": True,
        "free": True,
        "api_key_set": bool(client)
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy" if client else "api_key_missing",
        "groq_configured": bool(client)
    }