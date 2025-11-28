from celery import Celery

celery = Celery(
    "voice_journal",
    broker="redis://localhost:6379/0",    # Redis DB 0 => job queue
    backend="redis://localhost:6379/1"    # Redis DB 1 => Celery task results
)
