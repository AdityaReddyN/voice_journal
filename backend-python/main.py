from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
import os
import uuid
import shutil
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
TMP_DIR = "/tmp"

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
    """Receives audio from Celery and forwards it to the Groq Whisper API."""

    if not client:
        raise HTTPException(500, "Missing GROQ_API_KEY")

    # Save temporary audio file
    temp_path = f"{TMP_DIR}/{uuid.uuid4()}-{audio.filename}"

    try:
        with open(temp_path, "wb") as f:
            shutil.copyfileobj(audio.file, f)

        # Send to Groq Whisper API
        with open(temp_path, "rb") as f:
            result = client.audio.transcriptions.create(
                file=(audio.filename, f.read()),
                model="whisper-large-v3",
                response_format="json",
                temperature=0.0
            )

        os.remove(temp_path)

        return {
            "status": "success",
            "job_id": job_id,
            "transcript": result.text.strip(),
            "provider": "groq"
        }

    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)

        raise HTTPException(
            500,
            f"Groq STT API failed: {str(e)}"
        )


@app.get("/")
async def root():
    return {
        "status": "ok",
        "provider": "Groq",
        "model": "whisper-large-v3",
        "api_key_set": bool(client)
    }


@app.get("/health")
async def health():
    return {"healthy": bool(client)}
