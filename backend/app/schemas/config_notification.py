from pydantic import BaseModel
from typing import Optional


class ConfigNotificationBase(BaseModel):
    active: bool = True
    destinataires: str = ""
    gravite_indisponibilite: str = "elevee"
    seuil_priorite_basse: int = 5
    seuil_priorite_normale: int = 4
    seuil_priorite_haute: int = 3
    seuil_priorite_critique: int = 1
    seuil_site: int = 4


class ConfigNotificationUpdate(BaseModel):
    active: Optional[bool] = None
    destinataires: Optional[str] = None
    gravite_indisponibilite: Optional[str] = None
    seuil_priorite_basse: Optional[int] = None
    seuil_priorite_normale: Optional[int] = None
    seuil_priorite_haute: Optional[int] = None
    seuil_priorite_critique: Optional[int] = None
    seuil_site: Optional[int] = None


class ConfigNotificationOut(ConfigNotificationBase):
    id: int

    class Config:
        from_attributes = True