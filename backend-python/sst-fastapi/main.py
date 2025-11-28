from fastapi import FastAPI, File, UploadFile
import requests
import os
from dotenv import load_dotenv

app = FastAPI()

HF_MODEL = "openai/whisper-small"
HF_API = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
HF_TOKEN = os.getenv("HF_TOKEN")

@app.post("/stt")
async def stt(audio: UploadFile = File(...)):
    audio_bytes = await audio.read()

    response = requests.post(
        HF_API,
        headers={"Authorization": f"Bearer {HF_TOKEN}"},
        data=audio_bytes
    )

    return response.json()
