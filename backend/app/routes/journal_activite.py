from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.journal_activite import JournalActivite
from app.schemas.journal_activite import JournalActiviteOut
from app.routes.permissions import require_admin

router = APIRouter(prefix="/api/journal", tags=["journal_activite"])


@router.get("/", response_model=list[JournalActiviteOut])
def list_journal(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    return (
        db.query(JournalActivite)
        .order_by(JournalActivite.date_creation.desc())
        .limit(500)
        .all()
    )