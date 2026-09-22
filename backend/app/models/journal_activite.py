from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base


class JournalActivite(Base):
    __tablename__ = "journal_activite"

    id = Column(Integer, primary_key=True, index=True)
    utilisateur_identifiant = Column(String(100), nullable=True)
    methode = Column(String(10), nullable=False)
    chemin = Column(String(255), nullable=False)
    adresse_ip = Column(String(50), nullable=True)
    code_statut = Column(Integer, nullable=True)
    date_creation = Column(DateTime, default=datetime.utcnow, nullable=False)