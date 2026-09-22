import os
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.database import get_db
from app.models.alerte_zabbix import AlerteZabbix
from app.models.serveur_zabbix import ServeurZabbix
from app.models.equipement import Equipement
from app.models.site import Site
from app.schemas.alerte_zabbix import AlerteZabbixCreate, AlerteZabbixOut
from app.auth.security import get_current_user
from app.services.notifications import evaluer_et_notifier

load_dotenv()
ZABBIX_WEBHOOK_SECRET = os.getenv("ZABBIX_WEBHOOK_SECRET")

router = APIRouter(prefix="/api/alertes", tags=["alertes"])


@router.post("/zabbix", response_model=AlerteZabbixOut)
def recevoir_alerte_zabbix(
    alerte_in: AlerteZabbixCreate,
    request: Request,
    db: Session = Depends(get_db),
    x_webhook_secret: str = Header(None),
):
    if x_webhook_secret != ZABBIX_WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Clé secrète invalide")

    ip_appelante = request.client.host
    serveur = db.query(ServeurZabbix).filter(ServeurZabbix.adresse_ip == ip_appelante).first()
    if not serveur:
        raise HTTPException(status_code=403, detail=f"Serveur Zabbix non reconnu (IP {ip_appelante})")

    nouvelle_alerte = AlerteZabbix(**alerte_in.dict(), serveur_zabbix_id=serveur.id)
    db.add(nouvelle_alerte)
    db.commit()
    db.refresh(nouvelle_alerte)

    equipement_concerne = None
    site_concerne = None
    if nouvelle_alerte.equipement_id:
        equipement_concerne = db.query(Equipement).filter(Equipement.id == nouvelle_alerte.equipement_id).first()
    elif nouvelle_alerte.site_id:
        site_concerne = db.query(Site).filter(Site.id == nouvelle_alerte.site_id).first()

    evaluer_et_notifier(
        db,
        gravite=nouvelle_alerte.gravite,
        message=nouvelle_alerte.message,
        equipement=equipement_concerne,
        site=site_concerne,
    )

    return nouvelle_alerte


@router.get("/", response_model=list[AlerteZabbixOut])
def lister_alertes(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    alertes = db.query(AlerteZabbix).order_by(AlerteZabbix.date_creation.desc()).all()

    serveurs = {s.id: s.nom for s in db.query(ServeurZabbix).all()}

    resultats = []
    for a in alertes:
        item = AlerteZabbixOut.model_validate(a)
        item.serveur_zabbix_nom = serveurs.get(a.serveur_zabbix_id)
        resultats.append(item)

    return resultats


@router.put("/{alerte_id}/resoudre", response_model=AlerteZabbixOut)
def resoudre_alerte(alerte_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    from datetime import datetime

    alerte = db.query(AlerteZabbix).filter(AlerteZabbix.id == alerte_id).first()
    if not alerte:
        raise HTTPException(status_code=404, detail="Alerte introuvable")

    alerte.resolue = True
    alerte.date_resolution = datetime.utcnow()
    db.commit()
    db.refresh(alerte)
    return alerte