# queue_listener.py
import json
import time
from redis import Redis
from worker import process_audio   # IMPORTANT -> Celery task

redis = Redis(host="localhost", port=6379, db=0)

print("Queue listener running...")

while True:
    job = redis.rpop("voicejnl_queue")
    if job:
        job = json.loads(job)
        print(f"Received job: {job}")

        # SEND TO CELERY
        process_audio.delay(job["jobID"], job["filePath"])

        print(f"Sent {job['jobID']} to Celery!")

    time.sleep(1)
