from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from huggingface_hub import InferenceClient
import os
import uuid
import shutil
import traceback
from dotenv import load_dotenv
load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
TMP_DIR = "/tmp"

# Initialize Hugging Face Inference Client with provider specified
client = InferenceClient(
    provider="hf-inference",
    api_key=HF_TOKEN
)

app = FastAPI(title="Voice Journal STT")

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
    if not HF_TOKEN:
        raise HTTPException(status_code=500, detail="HF_TOKEN not set")

    # Save uploaded audio to temp file
    temp_filename = f"{uuid.uuid4()}-{audio.filename}"
    temp_path = f"{TMP_DIR}/{temp_filename}"

    try:
        # Save the uploaded file
        with open(temp_path, "wb") as tmp:
            shutil.copyfileobj(audio.file, tmp)

        print(f"[FASTAPI] Processing: {temp_path} ({os.path.getsize(temp_path)} bytes)")

        # Use InferenceClient for ASR with hf-inference provider
        result = client.automatic_speech_recognition(
            temp_path,
            model="openai/whisper-small"
        )

        print(f"[FASTAPI] Raw result: {result}")

        # Clean up temp file
        os.remove(temp_path)

        # Extract transcript
        if isinstance(result, dict):
            transcript = result.get("text", "")
        elif isinstance(result, str):
            transcript = result
        else:
            transcript = str(result)

        print(f"[FASTAPI] ✓ Success (job {job_id}): '{transcript[:80]}'...")

        return {
            "status": "success",
            "job_id": job_id,
            "transcript": transcript.strip()
        }

    except Exception as e:
        # Clean up on error
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass
        
        error_msg = str(e)
        print(f"[FASTAPI] ✗ Error: {error_msg}")
        traceback.print_exc()
        
        # Handle specific errors
        if "503" in error_msg or "loading" in error_msg.lower():
            raise HTTPException(
                status_code=503,
                detail="Model is loading, please retry in 20 seconds"
            )
        
        if "401" in error_msg or "unauthorized" in error_msg.lower():
            raise HTTPException(
                status_code=401,
                detail="Invalid Hugging Face token. Please check your HF_TOKEN."
            )
        
        raise HTTPException(
            status_code=500,
            detail=f"Transcription failed: {error_msg}"
        )


@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "Voice Journal STT",
        "model": "openai/whisper-small",
        "provider": "hf-inference",
        "hf_token_set": bool(HF_TOKEN)
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}