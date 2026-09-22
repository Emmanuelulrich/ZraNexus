from sqlalchemy import Column, Integer, String

from app.database import Base


class ServeurZabbix(Base):
    __tablename__ = "serveurs_zabbix"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, nullable=False)
    adresse_ip = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=True)