from sqlalchemy import Column, Integer, String, ForeignKey

from app.database import Base


class ServeurZabbix(Base):
    __tablename__ = "serveurs_zabbix"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, nullable=False)
    adresse_ip = Column(String, nullable=False, unique=True)
    adresse_mac = Column(String(17), nullable=True)
    # Site où se trouve le serveur, et équipement qui le représente sur la carte
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=True)
    equipement_id = Column(Integer, ForeignKey("equipements.id", ondelete="SET NULL"), nullable=True)
    description = Column(String, nullable=True)
