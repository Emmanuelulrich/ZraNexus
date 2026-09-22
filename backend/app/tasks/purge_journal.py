from datetime import datetime, timedelta
from app.celery_app import celery_app
from app.database import SessionLocal
from app.models.journal_activite import JournalActivite

RETENTION_JOURS = 30


@celery_app.task
def purger_journal_activite():
    db = SessionLocal()
    try:
        date_limite = datetime.utcnow() - timedelta(days=RETENTION_JOURS)
        nb_supprimes = (
            db.query(JournalActivite)
            .filter(JournalActivite.date_creation < date_limite)
            .delete(synchronize_session=False)
        )
        db.commit()
        return {"entrees_supprimees": nb_supprimes}
    finally:
        db.close()