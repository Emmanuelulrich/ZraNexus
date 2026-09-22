from sqlalchemy import Column, Integer, String, Enum
import enum
from app.database import Base


class RoleEnum(str, enum.Enum):
    admin = "admin"
    delegue = "delegue"


class User(Base):
    __tablename__ = "utilisateurs"

    id = Column(Integer, primary_key=True, index=True)
    identifiant = Column(String(50), unique=True, index=True, nullable=False)
    mot_de_passe_hash = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.delegue)