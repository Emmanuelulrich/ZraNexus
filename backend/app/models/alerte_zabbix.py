from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class AlerteZabbix(Base):
    __tablename__ = "alertes_zabbix"

    id = Column(Integer, primary_key=True, index=True)
    equipement_id = Column(Integer, ForeignKey("equipements.id"), nullable=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=True)
    serveur_zabbix_id = Column(Integer, ForeignKey("serveurs_zabbix.id"), nullable=True)
    gravite = Column(String, nullable=False)
    message = Column(String, nullable=False)
    resolue = Column(Boolean, default=False)
    date_creation = Column(DateTime(timezone=True), server_default=func.now())
    date_resolution = Column(DateTime(timezone=True), nullable=True)

    equipement = relationship("Equipement")
    site = relationship("Site")
    serveur_zabbix = relationship("ServeurZabbix")