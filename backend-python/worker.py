import os
import requests
from celery_app import celery as celery_app

STT_API_URL = "http://127.0.0.1:8000/transcribe"

def convert_to_wsl(path_str: str) -> str:
    """Convert Windows NodeJS path to WSL path."""
    if path_str.startswith("uploads\\") or path_str.startswith("uploads/"):
        filename = path_str.replace("\\", "/").split("/")[-1]
        return f"/mnt/c/Users/adity/Documents/GitHub/voice_journal/backend-node/uploads/{filename}"

    # C:\Users\adity\...
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
        with open(wsl_path, "rb") as f:
            files = {
                "audio": (
                    os.path.basename(wsl_path),
                    f,
                    "audio/mpeg"
                )
            }
            data = {"job_id": job_id}

            resp = requests.post(STT_API_URL, files=files, data=data, timeout=120)
            resp.raise_for_status()

            return resp.json()

    except requests.exceptions.RequestException as e:
        return {"status": "error", "job_id": job_id, "message": f"FastAPI request failed: {e}"}

    except Exception as e:
        return {"status": "error", "job_id": job_id, "message": str(e)}
