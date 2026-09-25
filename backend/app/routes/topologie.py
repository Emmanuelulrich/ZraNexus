from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.equipement import Equipement
from app.models.position_topologie import PositionTopologie
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/topologie", tags=["topologie"])


class PositionIn(BaseModel):
    equipement_id: int
    x: float
    y: float


class PositionOut(PositionIn):
    class Config:
        from_attributes = True


@router.get("/positions", response_model=list[PositionOut])
def lister_positions(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(PositionTopologie).all()


@router.put("/positions", response_model=list[PositionOut])
def enregistrer_positions(positions: list[PositionIn], db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Crée ou met à jour la position de plusieurs équipements en une requête."""
    if not positions:
        return []

    ids = {p.equipement_id for p in positions}
    existants = {e.id for e in db.query(Equipement.id).filter(Equipement.id.in_(ids)).all()}
    if existants != ids:
        raise HTTPException(status_code=404, detail="Équipement introuvable")

    lignes = {l.equipement_id: l for l in db.query(PositionTopologie).filter(PositionTopologie.equipement_id.in_(ids)).all()}
    for p in positions:
        ligne = lignes.get(p.equipement_id)
        if ligne:
            ligne.x, ligne.y = p.x, p.y
        else:
            db.add(PositionTopologie(equipement_id=p.equipement_id, x=p.x, y=p.y))
    db.commit()
    return db.query(PositionTopologie).filter(PositionTopologie.equipement_id.in_(ids)).all()


@router.delete("/positions/{equipement_id}")
def retirer_de_la_topologie(equipement_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Retire un équipement de la page Topologie (l'équipement et ses liaisons ne sont pas supprimés)."""
    ligne = db.query(PositionTopologie).filter(PositionTopologie.equipement_id == equipement_id).first()
    if ligne:
        db.delete(ligne)
        db.commit()
    return {"detail": "Équipement retiré de la topologie"}
