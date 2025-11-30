import os
import requests
from celery_app import celery as celery_app

# FastAPI STT gateway (can be overridden in env)
STT_API_URL = os.getenv("STT_API_URL", "http://localhost:8000/transcribe")


def convert_to_wsl(path_str: str) -> str:
    """Convert a Windows path from Node to WSL format (local dev only)."""
    path = path_str.replace("\\", "/")

    if path.startswith("uploads/"):
        filename = path.split("/")[-1]
        return f"/mnt/c/Users/adity/Documents/GitHub/voice_journal/backend-node/uploads/{filename}"

    if ":" in path:
        drive = path[0].lower()
        cleaned = path.replace(":", "")
        return f"/mnt/{drive}{cleaned}"

    return path


@celery_app.task(name="worker.process_audio")
def process_audio(job_id, file_path):
    """Background STT task: reads audio file and sends to FastAPI gateway."""

    print(f"[CELERY] Job {job_id} → {file_path}")

    wsl_path = convert_to_wsl(file_path)
    print(f"[CELERY] Resolved path → {wsl_path}")

    if not os.path.isfile(wsl_path):
        return {"status": "error", "job_id": job_id, "message": "File not found"}

    try:
        with open(wsl_path, "rb") as f:
            file_bytes = f.read()

        files = {
            "audio": (os.path.basename(wsl_path), file_bytes, "audio/mpeg")
        }

        data = {"job_id": job_id}

        resp = requests.post(STT_API_URL, files=files, data=data, timeout=120)

        if resp.status_code != 200:
            return {
                "status": "error",
                "job_id": job_id,
                "message": f"STT API {resp.status_code}: {resp.text[:300]}"
            }

        return resp.json()

    except Exception as e:
        return {
            "status": "error",
            "job_id": job_id,
            "message": f"STT request failed: {str(e)}"
        }
