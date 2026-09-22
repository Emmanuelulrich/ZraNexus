from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.liaison_inter_site import LiaisonInterSite
from app.schemas.liaison_inter_site import LiaisonInterSiteCreate, LiaisonInterSiteOut
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/liaisons", tags=["liaisons"])


@router.get("/", response_model=list[LiaisonInterSiteOut])
def list_liaisons(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(LiaisonInterSite).all()


@router.post("/", response_model=LiaisonInterSiteOut)
def create_liaison(liaison_in: LiaisonInterSiteCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    new_liaison = LiaisonInterSite(**liaison_in.dict())
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


@router.delete("/{liaison_id}")
def delete_liaison(liaison_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    liaison = db.query(LiaisonInterSite).filter(LiaisonInterSite.id == liaison_id).first()
    if not liaison:
        raise HTTPException(status_code=404, detail="Liaison introuvable")

    db.delete(liaison)
    db.commit()
    return {"detail": "Liaison supprimée"}