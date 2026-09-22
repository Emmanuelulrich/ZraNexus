from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class JournalActiviteOut(BaseModel):
    id: int
    utilisateur_identifiant: Optional[str] = None
    methode: str
    chemin: str
    adresse_ip: Optional[str] = None
    code_statut: Optional[int] = None
    date_creation: datetime

    class Config:
        from_attributes = True