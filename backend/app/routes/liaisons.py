from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.equipement import Equipement
from app.models.liaison_inter_site import LiaisonInterSite
from app.schemas.liaison_inter_site import (
    LiaisonInterSiteCreate,
    LiaisonInterSiteUpdate,
    LiaisonInterSiteOut,
)
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/liaisons", tags=["liaisons"])


def _nettoyer(donnees: dict) -> dict:
    """Chaînes vides -> None, espaces retirés."""
    propre = {}
    for cle, valeur in donnees.items():
        if isinstance(valeur, str):
            valeur = valeur.strip() or None
        propre[cle] = valeur
    return propre


@router.get("/", response_model=list[LiaisonInterSiteOut])
def list_liaisons(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(LiaisonInterSite).all()


@router.post("/", response_model=LiaisonInterSiteOut)
def create_liaison(liaison_in: LiaisonInterSiteCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    donnees = _nettoyer(liaison_in.model_dump())

    if donnees["equipement_source_id"] == donnees["equipement_destination_id"]:
        raise HTTPException(status_code=400, detail="Une liaison doit relier deux équipements différents")

    ids = {donnees["equipement_source_id"], donnees["equipement_destination_id"]}
    if db.query(Equipement).filter(Equipement.id.in_(ids)).count() != 2:
        raise HTTPException(status_code=404, detail="Équipement introuvable")

    new_liaison = LiaisonInterSite(**donnees)
    db.add(new_liaison)
    db.commit()
    db.refresh(new_liaison)
    return new_liaison


@router.get("/{liaison_id}", response_model=LiaisonInterSiteOut)
def get_liaison(liaison_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    liaison = db.query(LiaisonInterSite).filter(LiaisonInterSite.id == liaison_id).first()
    if not liaison:
        raise HTTPException(status_code=404, detail="Liaison introuvable")
    return liaison


@router.put("/{liaison_id}", response_model=LiaisonInterSiteOut)
def update_liaison(liaison_id: int, liaison_in: LiaisonInterSiteUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    liaison = db.query(LiaisonInterSite).filter(LiaisonInterSite.id == liaison_id).first()
    if not liaison:
        raise HTTPException(status_code=404, detail="Liaison introuvable")

    for cle, valeur in _nettoyer(liaison_in.model_dump(exclude_unset=True)).items():
        setattr(liaison, cle, valeur)

    db.commit()
    db.refresh(liaison)
    return liaison


@router.delete("/{liaison_id}")
def delete_liaison(liaison_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    liaison = db.query(LiaisonInterSite).filter(LiaisonInterSite.id == liaison_id).first()
    if not liaison:
        raise HTTPException(status_code=404, detail="Liaison introuvable")

    db.delete(liaison)
    db.commit()
    return {"detail": "Liaison supprimée"}
