import os
import requests
from celery_app import celery as celery_app

STT_API_URL = "http://localhost:8000/transcribe"


def convert_to_wsl(path_str: str) -> str:
    """Convert Windows NodeJS path to WSL path."""
    if path_str.startswith("uploads\\") or path_str.startswith("uploads/"):
        filename = path_str.replace("\\", "/").split("/")[-1]
        return f"/mnt/c/Users/adity/Documents/GitHub/voice_journal/backend-node/uploads/{filename}"

    if ":" in path_str and "\\" in path_str:
        drive = path_str[0].lower()
        cleaned = path_str.replace("\\", "/").replace(":", "")
        return f"/mnt/{drive}{cleaned}"

    return path_str


@celery_app.task(bind=True, name="worker.process_audio")
def process_audio(self, job_id, file_path):

    print(f"[CELERY] Processing job {job_id}: {file_path}")

    wsl_path = convert_to_wsl(file_path)
    print(f"[CELERY] WSL Path: {wsl_path}")

    if not os.path.isfile(wsl_path):
        return {"status": "error", "job_id": job_id, "message": "File not found"}

    try:
        # Read full file bytes
        with open(wsl_path, "rb") as f:
            file_bytes = f.read()

        # Properly format multipart/form-data request
        # The key for files must match the parameter name in FastAPI
        files = {
            "audio": (
                os.path.basename(wsl_path),
                file_bytes,
                "audio/mpeg"
            )
        }

        # Form data goes in 'data' parameter
        data = {
            "job_id": job_id
        }

        print(f"[CELERY] Sending request to {STT_API_URL}")
        
        resp = requests.post(
            STT_API_URL,
            files=files,
            data=data,
            timeout=120,
        )

        print(f"[CELERY] Response status: {resp.status_code}")
        
        # Check response before raising
        if resp.status_code != 200:
            print(f"[CELERY] Error response: {resp.text}")
            
        resp.raise_for_status()
        result = resp.json()
        print(f"[CELERY] Success: {result}")
        return result

    except requests.exceptions.RequestException as e:
        error_msg = f"FastAPI request failed: {e}"
        print(f"[CELERY] {error_msg}")
        return {"status": "error", "job_id": job_id, "message": error_msg}

    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        print(f"[CELERY] {error_msg}")
        return {"status": "error", "job_id": job_id, "message": error_msg}