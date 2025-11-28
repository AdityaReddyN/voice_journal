from celery_app import celery

@celery.task
def process_audio(job_id, file_path):
    print(f"Processing {job_id} - {file_path}")
    # Later: call FastAPI, whisper, save transcript
    return {"status": "completed", "job_id": job_id}
