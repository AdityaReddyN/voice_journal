import os
import requests
from celery_app import celery as celery_app

# FastAPI gateway URL (can be environment variable for deployment)
STT_API_URL = os.getenv("STT_API_URL", "http://localhost:8000/transcribe")


def convert_to_wsl(path_str: str) -> str:
    """
    Convert Windows NodeJS path to WSL path for local development.
    For production deployment, this function can be simplified.
    """
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
    """
    Celery task that processes audio files.
    Reads the audio file and sends it to FastAPI gateway,
    which proxies to external Groq Whisper API.
    """
    
    print(f"[CELERY] Processing job {job_id}: {file_path}")

    # Convert path for local WSL development
    wsl_path = convert_to_wsl(file_path)
    print(f"[CELERY] Resolved path: {wsl_path}")

    # Check if file exists
    if not os.path.isfile(wsl_path):
        print(f"[CELERY] ✗ File not found: {wsl_path}")
        return {
            "status": "error",
            "job_id": job_id,
            "message": f"File not found: {wsl_path}"
        }

    try:
        # Read the audio file
        print(f"[CELERY] Reading file: {wsl_path}")
        with open(wsl_path, "rb") as f:
            file_bytes = f.read()
        
        file_size = len(file_bytes)
        print(f"[CELERY] File size: {file_size} bytes")

        # Prepare multipart/form-data request
        files = {
            "audio": (
                os.path.basename(wsl_path),
                file_bytes,
                "audio/mpeg"
            )
        }

        data = {
            "job_id": job_id
        }

        print(f"[CELERY] Sending to FastAPI gateway at {STT_API_URL}")
        
        # Send to FastAPI gateway (which proxies to Groq)
        resp = requests.post(
            STT_API_URL,
            files=files,
            data=data,
            timeout=120,
        )

        print(f"[CELERY] Response status: {resp.status_code}")
        
        # Handle non-200 responses
        if resp.status_code != 200:
            error_text = resp.text[:500]
            print(f"[CELERY] ✗ Error response: {error_text}")
            return {
                "status": "error",
                "job_id": job_id,
                "message": f"STT API returned {resp.status_code}: {error_text}"
            }
        
        # Parse successful response
        result = resp.json()
        
        transcript = result.get("transcript", "")
        print(f"[CELERY] ✓ Transcription successful: '{transcript[:100]}'...")
        
        return result

    except FileNotFoundError as e:
        error_msg = f"File not found: {str(e)}"
        print(f"[CELERY] ✗ {error_msg}")
        return {
            "status": "error",
            "job_id": job_id,
            "message": error_msg
        }

    except requests.exceptions.Timeout:
        error_msg = "Request to STT API timed out (>120s)"
        print(f"[CELERY] ✗ {error_msg}")
        return {
            "status": "error",
            "job_id": job_id,
            "message": error_msg
        }

    except requests.exceptions.RequestException as e:
        error_msg = f"STT API request failed: {str(e)}"
        print(f"[CELERY] ✗ {error_msg}")
        return {
            "status": "error",
            "job_id": job_id,
            "message": error_msg
        }

    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        print(f"[CELERY] ✗ {error_msg}")
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "job_id": job_id,
            "message": error_msg
        }