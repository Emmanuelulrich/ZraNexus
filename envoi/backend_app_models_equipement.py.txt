from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Enum, JSON
from app.database import Base
import enum


class ModeConnexion(str, enum.Enum):
    filaire = "filaire"
    wifi = "wifi"


class StatutEquipement(str, enum.Enum):
    disponible = "disponible"
    indisponible = "indisponible"
class PrioriteEquipement(str, enum.Enum):
    basse = "basse"
    normale = "normale"
    haute = "haute"
    critique = "critique"    


class Equipement(Base):
    __tablename__ = "equipements"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    type_id = Column(Integer, ForeignKey("types_equipement.id"), nullable=True)
    nom = Column(String(100), nullable=False)
    adresse_ip = Column(String(45), nullable=True)
    adresse_mac = Column(String(17), nullable=True)
    mode_connexion = Column(Enum(ModeConnexion), nullable=True)
    type_detecte_auto = Column(Boolean, default=False)
    niveau_confiance_type = Column(Float, nullable=True)
    statut = Column(Enum(StatutEquipement), default=StatutEquipement.disponible)
    priorite = Column(Enum(PrioriteEquipement), default=PrioriteEquipement.normale)
    position_sur_plan = Column(JSON, nullable=True)
    portee_wifi_metres = Column(Float, nullable=True)
    portee_wifi_affichee_metres = Column(Float, nullable=True)