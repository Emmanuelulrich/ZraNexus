from sqlalchemy import Column, Integer, String, Float
from app.database import Base


class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    pays = Column(String(100), nullable=False)
    ville = Column(String(100), nullable=False)
    quartier = Column(String(100), nullable=True)
    plan_origine = Column(String(255), nullable=True)
    plan_modelise = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    largeur_plan_metres = Column(Float, nullable=True)