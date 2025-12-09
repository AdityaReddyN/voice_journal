import requests
import redis
import os
from celery import Celery
# Change from DB 2 to DB 0 to match Node.js backend
#REDIS_URL = os.getenv("REDIS_URL", "redis://192.168.1.5:6379/0")
REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0")
FASTAPI_URL = os.getenv("FASTAPI_URL", "http://127.0.0.1:8000/transcribe")

r = redis.Redis.from_url(REDIS_URL)

celery = Celery(
    "worker",
    broker=os.getenv("BROKER_URL", "redis://127.0.0.1:6379/0"),
    backend=os.getenv("RESULT_BACKEND", "redis://127.0.0.1:6379/1")
)

def update_status(task_id, **kwargs):
    for k, v in kwargs.items():
        r.hset(task_id, k, v)


@celery.task(bind=True)
def process_audio(self, job_id, file_path):
    update_status(job_id, status="received", progress=5)
    
    print(f"Processing file: {file_path}")
    
    # Check if file exists
    if not os.path.exists(file_path):
        error_msg = f"File not found: {file_path}"
        print(f"{error_msg}")
        update_status(job_id, status="failed", error=error_msg)
        raise FileNotFoundError(error_msg)

    # Prepare file for FastAPI STT request
    update_status(job_id, status="sending_to_stt", progress=25)

    # Extract just the filename for the upload
    filename = os.path.basename(file_path)
    print(f"Sending {filename} to FastAPI...")

    try:
        with open(file_path, "rb") as f:
            files = {"audio": (filename, f, "audio/mpeg")}
            data = {"job_id": job_id}
            
            res = requests.post(FASTAPI_URL, data=data, files=files, timeout=90)
            res.raise_for_status()

    except Exception as e:
        print(f"Error: {str(e)}")
        update_status(job_id, status="failed", error=str(e))
        raise e

    stt_result = res.json()
    transcript = stt_result.get("transcript")
    
    print(f"✅ Transcription complete: {transcript[:50]}...")

    update_status(job_id, status="saving", progress=90)

    # Save final transcript to redis
    update_status(
        job_id,
        status="completed",
        progress=100,
        transcript=transcript,
        provider=stt_result["provider"]
    )

    return transcript