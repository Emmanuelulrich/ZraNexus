from pydantic import BaseModel
from typing import Optional


class ServeurZabbixCreate(BaseModel):
    nom: str
    adresse_ip: str
    adresse_mac: Optional[str] = None
    site_id: int
    description: Optional[str] = None


class ServeurZabbixUpdate(BaseModel):
    nom: Optional[str] = None
    adresse_mac: Optional[str] = None
    site_id: Optional[int] = None
    description: Optional[str] = None


class ServeurZabbixOut(BaseModel):
    id: int
    nom: str
    adresse_ip: str
    adresse_mac: Optional[str] = None
    site_id: Optional[int] = None
    equipement_id: Optional[int] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True
