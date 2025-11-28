import os
import json
import redis
import requests
from celery_app import celery

redis_cache = redis.Redis(host="localhost", port=6379, db=2)

@celery.task
def process_stt(job_data_string):
    job = json.loads(job_data_string)

    jobID = job["jobID"]
    filePath = job["filePath"]

    # Send file to FastAPI STT
    with open(filePath, "rb") as audio:
        resp = requests.post(
            "http://localhost:8000/stt",
            files={"audio": audio}
        )

    text = resp.json().get("text", "")

    # Cache transcript
    redis_cache.set(jobID, text, ex=3600)

    # Delete audio file
    try:
        os.remove(filePath)
    except:
        pass

    return {"jobID": jobID, "transcript": text}
