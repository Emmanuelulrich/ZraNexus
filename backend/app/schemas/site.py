from pydantic import BaseModel
from typing import Optional


class SiteCreate(BaseModel):
    nom: str
    pays: str
    ville: str
    quartier: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    largeur_plan_metres: Optional[float] = None


class SiteUpdate(BaseModel):
    nom: Optional[str] = None
    pays: Optional[str] = None
    ville: Optional[str] = None
    quartier: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    largeur_plan_metres: Optional[float] = None


class SiteOut(BaseModel):
    id: int
    nom: str
    pays: str
    ville: str
    quartier: Optional[str] = None
    plan_origine: Optional[str] = None
    plan_modelise: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    largeur_plan_metres: Optional[float] = None  
    

    class Config:
        from_attributes = True