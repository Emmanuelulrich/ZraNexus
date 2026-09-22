from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.serveur_zabbix import ServeurZabbix
from app.schemas.serveur_zabbix import ServeurZabbixCreate, ServeurZabbixOut
from app.routes.permissions import require_admin

router = APIRouter(prefix="/api/serveurs-zabbix", tags=["serveurs-zabbix"])


@router.get("/", response_model=list[ServeurZabbixOut])
def lister_serveurs(db: Session = Depends(get_db), admin=Depends(require_admin)):
    return db.query(ServeurZabbix).all()


@router.post("/", response_model=ServeurZabbixOut)
def creer_serveur(serveur_in: ServeurZabbixCreate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    nouveau = ServeurZabbix(**serveur_in.dict())
    db.add(nouveau)
    db.commit()
    db.refresh(nouveau)
    return nouveau


@router.delete("/{serveur_id}")
def supprimer_serveur(serveur_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    serveur = db.query(ServeurZabbix).filter(ServeurZabbix.id == serveur_id).first()
    if not serveur:
        raise HTTPException(status_code=404, detail="Serveur introuvable")
    db.delete(serveur)
    db.commit()
    return {"message": "Serveur supprimé"}