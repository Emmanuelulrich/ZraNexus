from pydantic import BaseModel, field_validator

from app.models.liaison_inter_site import TYPES_LIAISON


def _verifier_type(valeur):
    if valeur is not None and valeur not in TYPES_LIAISON:
        raise ValueError("Type de liaison inconnu : " + ", ".join(TYPES_LIAISON))
    return valeur


class LiaisonInterSiteCreate(BaseModel):
    equipement_source_id: int
    equipement_destination_id: int
    type_liaison: str | None = None
    description: str | None = None
    interface_source: str | None = None
    interface_destination: str | None = None
    debit: str | None = None
    sous_reseau: str | None = None

    _v_type = field_validator("type_liaison")(_verifier_type)


class LiaisonInterSiteUpdate(BaseModel):
    type_liaison: str | None = None
    description: str | None = None
    interface_source: str | None = None
    interface_destination: str | None = None
    debit: str | None = None
    sous_reseau: str | None = None

    _v_type = field_validator("type_liaison")(_verifier_type)


class LiaisonInterSiteOut(BaseModel):
    id: int
    equipement_source_id: int
    equipement_destination_id: int
    type_liaison: str | None = None
    categorie: str | None = None
    description: str | None = None
    interface_source: str | None = None
    interface_destination: str | None = None
    debit: str | None = None
    sous_reseau: str | None = None

    class Config:
        from_attributes = True
