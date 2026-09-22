import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.site import Site
from app.models.permission import Permission
from app.schemas.site import SiteCreate, SiteUpdate, SiteOut
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/sites", tags=["sites"])
UPLOAD_DIR = os.path.join("uploads", "plans")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def sites_ids_autorises(db: Session, current_user) -> list[int]:
    permissions = db.query(Permission).filter(Permission.utilisateur_id == current_user.id).all()
    return [p.site_id for p in permissions]


@router.get("/", response_model=list[SiteOut])
def list_sites(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role == "admin":
        return db.query(Site).all()
    ids_autorises = sites_ids_autorises(db, current_user)
    return db.query(Site).filter(Site.id.in_(ids_autorises)).all()


@router.post("/", response_model=SiteOut)
def create_site(site_in: SiteCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    new_site = Site(**site_in.dict())
    db.add(new_site)
    db.commit()
    db.refresh(new_site)
    return new_site


@router.get("/stats")
def get_sites_stats(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    from sqlalchemy import func

    resultats = (
        db.query(Site.pays, Site.ville, func.count(Site.id).label("total"))
        .group_by(Site.pays, Site.ville)
        .all()
    )

    return [
        {"pays": pays, "ville": ville, "total": total}
        for pays, ville, total in resultats
    ]


@router.get("/{site_id}", response_model=SiteOut)
def get_site(site_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site introuvable")

    if current_user.role != "admin" and site.id not in sites_ids_autorises(db, current_user):
        raise HTTPException(status_code=403, detail="Accès non autorisé à ce site")

    return site


@router.put("/{site_id}", response_model=SiteOut)
def update_site(site_id: int, site_in: SiteUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site introuvable")

    for field, value in site_in.dict(exclude_unset=True).items():
        setattr(site, field, value)

    db.commit()
    db.refresh(site)
    return site


@router.delete("/{site_id}")
def delete_site(site_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site introuvable")

    db.delete(site)
    db.commit()
    return {"detail": "Site supprimé"}


@router.post("/{site_id}/plan")
def upload_plan_site(
    site_id: int,
    fichier: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site introuvable")

    if current_user.role != "admin" and site.id not in sites_ids_autorises(db, current_user):
        raise HTTPException(status_code=403, detail="Accès non autorisé à ce site")

    extension = os.path.splitext(fichier.filename)[1]
    nom_fichier = f"site_{site_id}_{uuid.uuid4().hex}{extension}"
    chemin_disque = os.path.join(UPLOAD_DIR, nom_fichier)

    with open(chemin_disque, "wb") as f:
        shutil.copyfileobj(fichier.file, f)

    site.plan_origine = f"/uploads/plans/{nom_fichier}"
    db.commit()
    db.refresh(site)

    return {"plan_origine": site.plan_origine}