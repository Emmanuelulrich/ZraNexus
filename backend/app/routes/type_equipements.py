import os
import shutil
import uuid

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.type_equipement import TypeEquipement
from app.schemas.type_equipement import (
    TypeEquipementCreate,
    TypeEquipementUpdate,
    TypeEquipementOut,
)
from app.auth.security import get_current_user
from app.routes.permissions import require_admin

router = APIRouter(prefix="/api/type-equipements", tags=["type_equipements"])

DOSSIER_ICONES = "uploads/icones_types"
os.makedirs(DOSSIER_ICONES, exist_ok=True)


@router.get("/", response_model=list[TypeEquipementOut])
def list_type_equipements(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return db.query(TypeEquipement).all()


@router.post("/", response_model=TypeEquipementOut, status_code=status.HTTP_201_CREATED)
def create_type_equipement(
    payload: TypeEquipementCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    type_equipement = TypeEquipement(**payload.model_dump())
    db.add(type_equipement)
    db.commit()
    db.refresh(type_equipement)
    return type_equipement


@router.get("/{type_equipement_id}", response_model=TypeEquipementOut)
def get_type_equipement(
    type_equipement_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    type_equipement = db.query(TypeEquipement).filter(
        TypeEquipement.id == type_equipement_id
    ).first()
    if not type_equipement:
        raise HTTPException(status_code=404, detail="TypeEquipement introuvable")
    return type_equipement


@router.put("/{type_equipement_id}", response_model=TypeEquipementOut)
def update_type_equipement(
    type_equipement_id: int,
    payload: TypeEquipementUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    type_equipement = db.query(TypeEquipement).filter(
        TypeEquipement.id == type_equipement_id
    ).first()
    if not type_equipement:
        raise HTTPException(status_code=404, detail="TypeEquipement introuvable")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(type_equipement, field, value)

    db.commit()
    db.refresh(type_equipement)
    return type_equipement


@router.delete("/{type_equipement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_type_equipement(
    type_equipement_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    type_equipement = db.query(TypeEquipement).filter(
        TypeEquipement.id == type_equipement_id
    ).first()
    if not type_equipement:
        raise HTTPException(status_code=404, detail="TypeEquipement introuvable")

    db.delete(type_equipement)
    db.commit()
    return None


@router.post("/{type_equipement_id}/icone", response_model=TypeEquipementOut)
def upload_icone_type_equipement(
    type_equipement_id: int,
    fichier: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    type_equipement = db.query(TypeEquipement).filter(
        TypeEquipement.id == type_equipement_id
    ).first()
    if not type_equipement:
        raise HTTPException(status_code=404, detail="TypeEquipement introuvable")

    extension = os.path.splitext(fichier.filename)[1]
    nom_fichier = f"{uuid.uuid4().hex}{extension}"
    chemin_disque = os.path.join(DOSSIER_ICONES, nom_fichier)

    with open(chemin_disque, "wb") as buffer:
        shutil.copyfileobj(fichier.file, buffer)

    type_equipement.icone = f"/{DOSSIER_ICONES}/{nom_fichier}"
    db.commit()
    db.refresh(type_equipement)
    return type_equipement