from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base

# Types de liaison reconnus -> catégorie (filaire / sans_fil).
# Doit rester cohérent avec frontend/src/utils/liaisonTypes.js
TYPES_LIAISON = {
    "ethernet": "filaire",
    "fibre_monomode": "filaire",
    "fibre_multimode": "filaire",
    "serie": "filaire",
    "coaxial": "filaire",
    "wifi": "sans_fil",
    "faisceau_hertzien": "sans_fil",
    "lte": "sans_fil",
    "satellite": "sans_fil",
}


class LiaisonInterSite(Base):
    __tablename__ = "liaisons_inter_site"

    id = Column(Integer, primary_key=True, index=True)
    equipement_source_id = Column(Integer, ForeignKey("equipements.id"), nullable=False)
    equipement_destination_id = Column(Integer, ForeignKey("equipements.id"), nullable=False)
    type_liaison = Column(String, nullable=True)
    description = Column(String, nullable=True)
    interface_source = Column(String(50), nullable=True)
    interface_destination = Column(String(50), nullable=True)
    debit = Column(String(30), nullable=True)
    sous_reseau = Column(String(45), nullable=True)

    equipement_source = relationship("Equipement", foreign_keys=[equipement_source_id])
    equipement_destination = relationship("Equipement", foreign_keys=[equipement_destination_id])

    @property
    def categorie(self):
        return TYPES_LIAISON.get(self.type_liaison)
