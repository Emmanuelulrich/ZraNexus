from sqlalchemy import Column, Integer, Boolean, String
from app.database import Base


class ConfigNotification(Base):
    __tablename__ = "config_notifications"

    id = Column(Integer, primary_key=True, index=True)
    active = Column(Boolean, default=True)
    destinataires = Column(String(500), nullable=False, default="")  # e-mails séparés par des virgules
    gravite_indisponibilite = Column(String(50), default="elevee")  # gravité attribuée à un passage en indisponible

    # Seuil minimum de gravité (score 1 à 5) requis pour déclencher un e-mail, selon la priorité de l'équipement concerné
    seuil_priorite_basse = Column(Integer, default=5)
    seuil_priorite_normale = Column(Integer, default=4)
    seuil_priorite_haute = Column(Integer, default=3)
    seuil_priorite_critique = Column(Integer, default=1)

    # Seuil utilisé quand l'alerte concerne un site (pas d'équipement précis)
    seuil_site = Column(Integer, default=4)