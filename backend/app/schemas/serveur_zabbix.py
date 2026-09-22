from pydantic import BaseModel
from typing import Optional


class ServeurZabbixCreate(BaseModel):
    nom: str
    adresse_ip: str
    description: Optional[str] = None


class ServeurZabbixOut(BaseModel):
    id: int
    nom: str
    adresse_ip: str
    description: Optional[str] = None

    class Config:
        from_attributes = True