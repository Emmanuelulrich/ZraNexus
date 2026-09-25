from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.serveur_zabbix import ServeurZabbix
from app.models.site import Site
from app.models.equipement import Equipement, StatutEquipement
from app.models.type_equipement import TypeEquipement
from app.schemas.serveur_zabbix import ServeurZabbixCreate, ServeurZabbixUpdate, ServeurZabbixOut
from app.routes.permissions import require_admin
from app.services.reseau import pinger_ip, normaliser_mac

router = APIRouter(prefix="/api/serveurs-zabbix", tags=["serveurs-zabbix"])

LIBELLE_TYPE_SERVEUR_ZABBIX = "Serveur Zabbix"


def _mac_valide(mac):
    try:
        return normaliser_mac(mac)
    except ValueError:
        raise HTTPException(status_code=400, detail="Adresse MAC invalide (format attendu : AA:BB:CC:DD:EE:FF)")


def _id_type_serveur_zabbix(db: Session) -> int:
    type_existant = db.query(TypeEquipement).filter(TypeEquipement.libelle == LIBELLE_TYPE_SERVEUR_ZABBIX).first()
    if type_existant:
        return type_existant.id
    nouveau_type = TypeEquipement(libelle=LIBELLE_TYPE_SERVEUR_ZABBIX, icone="", est_type_inconnu=False)
    db.add(nouveau_type)
    db.flush()
    return nouveau_type.id


def _synchroniser_equipement(db: Session, serveur: ServeurZabbix):
    """Crée (ou met à jour) l'équipement qui représente le serveur sur la carte,
    avec un ping immédiat pour connaître son statut."""
    if serveur.site_id is None:
        return

    statut = StatutEquipement.disponible if pinger_ip(serveur.adresse_ip) else StatutEquipement.indisponible

    equipement = None
    if serveur.equipement_id:
        equipement = db.query(Equipement).filter(Equipement.id == serveur.equipement_id).first()

    if equipement is None:
        equipement = Equipement(
            site_id=serveur.site_id,
            type_id=_id_type_serveur_zabbix(db),
            nom=serveur.nom,
            adresse_ip=serveur.adresse_ip,
            adresse_mac=serveur.adresse_mac,
            statut=statut,
            type_detecte_auto=False,
        )
        db.add(equipement)
        db.flush()
        serveur.equipement_id = equipement.id
    else:
        equipement.site_id = serveur.site_id
        equipement.nom = serveur.nom
        equipement.adresse_ip = serveur.adresse_ip
        equipement.adresse_mac = serveur.adresse_mac
        equipement.statut = statut


@router.get("/", response_model=list[ServeurZabbixOut])
def lister_serveurs(db: Session = Depends(get_db), admin=Depends(require_admin)):
    return db.query(ServeurZabbix).all()


@router.post("/", response_model=ServeurZabbixOut)
def creer_serveur(serveur_in: ServeurZabbixCreate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    site = db.query(Site).filter(Site.id == serveur_in.site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site introuvable")

    adresse_ip = serveur_in.adresse_ip.strip()
    if db.query(ServeurZabbix).filter(ServeurZabbix.adresse_ip == adresse_ip).first():
        raise HTTPException(status_code=400, detail="Un serveur Zabbix avec cette adresse IP existe déjà")

    nouveau = ServeurZabbix(
        nom=serveur_in.nom,
        adresse_ip=adresse_ip,
        adresse_mac=_mac_valide(serveur_in.adresse_mac),
        site_id=serveur_in.site_id,
        description=serveur_in.description,
    )
    db.add(nouveau)
    db.flush()
    _synchroniser_equipement(db, nouveau)
    db.commit()
    db.refresh(nouveau)
    return nouveau


@router.put("/{serveur_id}", response_model=ServeurZabbixOut)
def modifier_serveur(serveur_id: int, serveur_in: ServeurZabbixUpdate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    serveur = db.query(ServeurZabbix).filter(ServeurZabbix.id == serveur_id).first()
    if not serveur:
        raise HTTPException(status_code=404, detail="Serveur introuvable")

    donnees = serveur_in.dict(exclude_unset=True)

    if "site_id" in donnees and donnees["site_id"] is not None:
        if not db.query(Site).filter(Site.id == donnees["site_id"]).first():
            raise HTTPException(status_code=404, detail="Site introuvable")
    if "adresse_mac" in donnees:
        donnees["adresse_mac"] = _mac_valide(donnees["adresse_mac"])

    for champ, valeur in donnees.items():
        setattr(serveur, champ, valeur)

    _synchroniser_equipement(db, serveur)
    db.commit()
    db.refresh(serveur)
    return serveur


@router.delete("/{serveur_id}")
def supprimer_serveur(serveur_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    serveur = db.query(ServeurZabbix).filter(ServeurZabbix.id == serveur_id).first()
    if not serveur:
        raise HTTPException(status_code=404, detail="Serveur introuvable")

    equipement_id = serveur.equipement_id
    db.delete(serveur)
    db.commit()

    # L'équipement qui représentait le serveur sur la carte disparaît aussi (si aucune alerte ne s'y rattache)
    if equipement_id:
        try:
            equipement = db.query(Equipement).filter(Equipement.id == equipement_id).first()
            if equipement:
                db.delete(equipement)
                db.commit()
        except Exception:
            db.rollback()

    return {"message": "Serveur supprimé"}
