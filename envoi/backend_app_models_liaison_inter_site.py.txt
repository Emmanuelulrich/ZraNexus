from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class LiaisonInterSite(Base):
    __tablename__ = "liaisons_inter_site"

    id = Column(Integer, primary_key=True, index=True)
    equipement_source_id = Column(Integer, ForeignKey("equipements.id"), nullable=False)
    equipement_destination_id = Column(Integer, ForeignKey("equipements.id"), nullable=False)
    type_liaison = Column(String, nullable=True)
    description = Column(String, nullable=True)

    equipement_source = relationship("Equipement", foreign_keys=[equipement_source_id])
    equipement_destination = relationship("Equipement", foreign_keys=[equipement_destination_id])