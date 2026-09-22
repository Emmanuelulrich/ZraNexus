from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base


class TypeEquipement(Base):
    __tablename__ = "types_equipement"

    id = Column(Integer, primary_key=True, index=True)
    libelle = Column(String(50), nullable=False)
    icone = Column(String(255), nullable=False)
    est_type_inconnu = Column(Boolean, default=False, nullable=False)