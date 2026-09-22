from datetime import datetime
from pydantic import BaseModel


class HistoriqueStatutOut(BaseModel):
    id: int
    equipement_id: int
    ancien_statut: str | None = None
    nouveau_statut: str
    date_changement: datetime

    class Config:
        from_attributes = True