from celery import Celery
from celery.schedules import crontab
import os
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6380/0")

celery_app = Celery(
    "zranexus",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.tasks.ping_equipements", "app.tasks.purge_journal"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Africa/Douala",
    enable_utc=True,
)

celery_app.conf.beat_schedule = {
    "ping-equipements-toutes-les-2-minutes": {
        "task": "app.tasks.ping_equipements.ping_tous_les_equipements",
        "schedule": 120.0,
    },
    "purger-journal-quotidien": {
        "task": "app.tasks.purge_journal.purger_journal_activite",
        "schedule": crontab(hour=3, minute=0),
    },
}