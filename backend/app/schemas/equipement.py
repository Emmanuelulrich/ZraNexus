from pydantic import BaseModel
from typing import Optional
from app.models.equipement import ModeConnexion, StatutEquipement, PrioriteEquipement


class PositionSurPlan(BaseModel):
    x: float
    y: float


class EquipementBase(BaseModel):
    site_id: int
    type_id: Optional[int] = None
    nom: str
    adresse_ip: Optional[str] = None
    adresse_mac: Optional[str] = None
    mode_connexion: Optional[ModeConnexion] = None
    type_detecte_auto: Optional[bool] = False
    niveau_confiance_type: Optional[float] = None
    statut: Optional[StatutEquipement] = StatutEquipement.disponible
    priorite: Optional[PrioriteEquipement] = PrioriteEquipement.normale
    position_sur_plan: Optional[PositionSurPlan] = None
    portee_wifi_metres: Optional[float] = None
    portee_wifi_affichee_metres: Optional[float] = None


class EquipementCreate(EquipementBase):
    pass


class EquipementUpdate(BaseModel):
    site_id: Optional[int] = None
    type_id: Optional[int] = None
    nom: Optional[str] = None
    adresse_ip: Optional[str] = None
    adresse_mac: Optional[str] = None
    mode_connexion: Optional[ModeConnexion] = None
    type_detecte_auto: Optional[bool] = None
    niveau_confiance_type: Optional[float] = None
    statut: Optional[StatutEquipement] = None
    priorite: Optional[PrioriteEquipement] = None
    position_sur_plan: Optional[PositionSurPlan] = None
    portee_wifi_metres: Optional[float] = None
    portee_wifi_affichee_metres: Optional[float] = None


class EquipementOut(EquipementBase):
    id: int

    class Config:
        from_attributes = True


class ScanRequest(BaseModel):
    site_id: int
    ip_debut: str
    ip_fin: Optional[str] = None