from pydantic import BaseModel
from typing import Optional


class TypeEquipementBase(BaseModel):
    libelle: str
    icone: Optional[str] = None
    est_type_inconnu: Optional[bool] = False


class TypeEquipementCreate(TypeEquipementBase):
    pass


class TypeEquipementUpdate(BaseModel):
    libelle: Optional[str] = None
    icone: Optional[str] = None
    est_type_inconnu: Optional[bool] = None


class TypeEquipementOut(TypeEquipementBase):
    id: int

    class Config:
        from_attributes = True