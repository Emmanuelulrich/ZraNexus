from pydantic import BaseModel


class LiaisonInterSiteCreate(BaseModel):
    equipement_source_id: int
    equipement_destination_id: int
    type_liaison: str | None = None
    description: str | None = None


class LiaisonInterSiteOut(BaseModel):
    id: int
    equipement_source_id: int
    equipement_destination_id: int
    type_liaison: str | None = None
    description: str | None = None

    class Config:
        from_attributes = True