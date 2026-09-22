from pydantic import BaseModel

class PermissionCreate(BaseModel):
    utilisateur_id: int
    site_id: int

class PermissionOut(BaseModel):
    id: int
    utilisateur_id: int
    site_id: int

    class Config:
        from_attributes = True