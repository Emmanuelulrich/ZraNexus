from sqlalchemy import Column, Integer, Float, ForeignKey

from app.database import Base


class PositionTopologie(Base):
    """Position d'un équipement sur la page Topologie (une ligne par équipement placé)."""

    __tablename__ = "positions_topologie"

    equipement_id = Column(Integer, ForeignKey("equipements.id", ondelete="CASCADE"), primary_key=True)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
