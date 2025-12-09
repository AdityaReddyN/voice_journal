from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
import os
import uuid
import shutil
from dotenv import load_dotenv
import traceback


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
    print(f"Received transcription request for job: {job_id}")
    print(f"Audio filename: {audio.filename}")
    
    if not client:
        print("Missing GROQ_API_KEY")
        raise HTTPException(500, "Missing GROQ_API_KEY")

    temp_path = f"{TMP_DIR}/{uuid.uuid4()}-{audio.filename}"
    print(f"Saving to temp path: {temp_path}")

    try:
        # Save uploaded file
        with open(temp_path, "wb") as f:
            shutil.copyfileobj(audio.file, f)
        
        print(f"File saved, size: {os.path.getsize(temp_path)} bytes")

        # Read and send to Groq
        print("Sending to Groq API...")
        with open(temp_path, "rb") as f:
            result = client.audio.transcriptions.create(
                file=(audio.filename, f.read()),
                model="whisper-large-v3-turbo",  # Use turbo for faster processing
                response_format="json",
                temperature=0.0
            )

        print(f"Transcription successful: {result.text[:50]}...")
        
        # Clean up
        os.remove(temp_path)
        print(f"Temp file removed")

        return {
            "status": "success",
            "job_id": job_id,
            "transcript": result.text.strip(),
            "provider": "groq"
        }

    except Exception as e:
        print(f"Error during transcription: {str(e)}")
        print(f"Full traceback: {traceback.format_exc()}")
        
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
        "model": "whisper-large-v3-turbo",
        "api_key_set": bool(client)
    }


@app.get("/health")
async def health():
    return {"healthy": bool(client)}