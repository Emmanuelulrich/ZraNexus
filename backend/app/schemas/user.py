from typing import Optional, List
from pydantic import BaseModel
from app.models.user import RoleEnum


class UserCreate(BaseModel):
    identifiant: str
    mot_de_passe: str
    role: RoleEnum = RoleEnum.delegue


class UserLogin(BaseModel):
    identifiant: str
    mot_de_passe: str


class UserOut(BaseModel):
    id: int
    identifiant: str
    role: RoleEnum

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserUpdate(BaseModel):
    identifiant: Optional[str] = None
    mot_de_passe: Optional[str] = None
    role: Optional[RoleEnum] = None


class UserCreateAvecPermissions(UserCreate):
    site_ids: List[int] = []


class UserOutAvecSites(UserOut):
    site_ids: List[int] = []