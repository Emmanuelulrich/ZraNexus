from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AlerteZabbixCreate(BaseModel):
    equipement_id: Optional[int] = None
    site_id: Optional[int] = None
    gravite: str
    message: str


class AlerteZabbixOut(BaseModel):
    id: int
    equipement_id: Optional[int]
    site_id: Optional[int]
    gravite: str
    message: str
    resolue: bool
    date_creation: datetime
    date_resolution: Optional[datetime]
    serveur_zabbix_id: Optional[int]
    serveur_zabbix_nom: Optional[str] = None

    class Config:
        from_attributes = True