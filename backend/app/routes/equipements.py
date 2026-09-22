from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.equipement import Equipement
from app.models.historique_statut import HistoriqueStatut
from app.models.permission import Permission
from app.models.site import Site
from app.models.type_equipement import TypeEquipement
from app.schemas.equipement import EquipementCreate, EquipementUpdate, EquipementOut, ScanRequest
from app.schemas.historique_statut import HistoriqueStatutOut
from app.auth.security import get_current_user
from app.services.reseau import pinger_ip, recuperer_mac, scanner_plage, detecter_categorie, ping_detaille
from app.services.notifications import evaluer_et_notifier, obtenir_config
from app.models.equipement import StatutEquipement

router = APIRouter(prefix="/api/equipements", tags=["equipements"])


def sites_ids_autorises(db: Session, current_user) -> list[int]:
    permissions = db.query(Permission).filter(Permission.utilisateur_id == current_user.id).all()
    return [p.site_id for p in permissions]


LIBELLES_PAR_CATEGORIE = {
    "routeur": "Routeur",
    "switch": "Switch",
    "serveur": "Serveur",
    "pc": "PC",
    "parefeu": "Pare-feu",
}

SEUIL_CONFIANCE = 0.5


def trouver_ou_creer_type(db: Session, categorie: str) -> int:
    libelle = LIBELLES_PAR_CATEGORIE[categorie]
    type_existant = db.query(TypeEquipement).filter(TypeEquipement.libelle == libelle).first()
    if type_existant:
        return type_existant.id
    nouveau_type = TypeEquipement(libelle=libelle, icone="", est_type_inconnu=False)
    db.add(nouveau_type)
    db.commit()
    db.refresh(nouveau_type)
    return nouveau_type.id


@router.get("/", response_model=list[EquipementOut])
def list_equipements(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role == "admin":
        return db.query(Equipement).all()
    ids_autorises = sites_ids_autorises(db, current_user)
    return db.query(Equipement).filter(Equipement.site_id.in_(ids_autorises)).all()


@router.post("/", response_model=EquipementOut)
def create_equipement(equipement_in: EquipementCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    donnees = equipement_in.dict()

    if donnees.get("adresse_ip"):
        est_disponible = pinger_ip(donnees["adresse_ip"])
        donnees["statut"] = StatutEquipement.disponible if est_disponible else StatutEquipement.indisponible

        if est_disponible and not donnees.get("adresse_mac"):
            mac = recuperer_mac(donnees["adresse_ip"])
            if mac:
                donnees["adresse_mac"] = mac

        if est_disponible and not donnees.get("type_id"):
            categorie, confiance = detecter_categorie(donnees["adresse_ip"])
            donnees["niveau_confiance_type"] = confiance
            if categorie and confiance >= SEUIL_CONFIANCE:
                donnees["type_id"] = trouver_ou_creer_type(db, categorie)
                donnees["type_detecte_auto"] = True

    new_equipement = Equipement(**donnees)
    db.add(new_equipement)
    db.commit()
    db.refresh(new_equipement)
    return new_equipement


@router.get("/stats")
def get_equipements_stats(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    base_filtre = None
    if current_user.role != "admin":
        ids_autorises = sites_ids_autorises(db, current_user)
        base_filtre = Equipement.site_id.in_(ids_autorises)

    def appliquer_filtre(q):
        return q.filter(base_filtre) if base_filtre is not None else q

    par_statut = appliquer_filtre(
        db.query(Equipement.statut, func.count(Equipement.id).label("total"))
        .group_by(Equipement.statut)
    ).all()

    par_type = appliquer_filtre(
        db.query(TypeEquipement.libelle, func.count(Equipement.id).label("total"))
        .outerjoin(TypeEquipement, Equipement.type_id == TypeEquipement.id)
        .group_by(TypeEquipement.libelle)
    ).all()

    par_site = appliquer_filtre(
        db.query(Site.nom, func.count(Equipement.id).label("total"))
        .join(Site, Equipement.site_id == Site.id)
        .group_by(Site.nom)
    ).all()

    return {
        "par_statut": [{"statut": s, "total": t} for s, t in par_statut],
        "par_type": [{"type": libelle or "Type inconnu", "total": t} for libelle, t in par_type],
        "par_site": [{"site": nom, "total": t} for nom, t in par_site],
    }


@router.get("/{equipement_id}", response_model=EquipementOut)
def get_equipement(equipement_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    equipement = db.query(Equipement).filter(Equipement.id == equipement_id).first()
    if not equipement:
        raise HTTPException(status_code=404, detail="Équipement introuvable")

    if current_user.role != "admin" and equipement.site_id not in sites_ids_autorises(db, current_user):
        raise HTTPException(status_code=403, detail="Accès non autorisé à cet équipement")

    return equipement


@router.put("/{equipement_id}", response_model=EquipementOut)
def update_equipement(equipement_id: int, equipement_in: EquipementUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    equipement = db.query(Equipement).filter(Equipement.id == equipement_id).first()
    if not equipement:
        raise HTTPException(status_code=404, detail="Équipement introuvable")

    donnees = equipement_in.dict(exclude_unset=True)
    ancien_statut = equipement.statut

    for field, value in donnees.items():
        setattr(equipement, field, value)

    passage_indisponible = (
        "statut" in donnees
        and donnees["statut"] != ancien_statut
        and donnees["statut"] == StatutEquipement.indisponible
    )

    if "statut" in donnees and donnees["statut"] != ancien_statut:
        historique = HistoriqueStatut(
            equipement_id=equipement.id,
            ancien_statut=ancien_statut,
            nouveau_statut=donnees["statut"],
        )
        db.add(historique)

    db.commit()
    db.refresh(equipement)

    if passage_indisponible:
        config = obtenir_config(db)
        evaluer_et_notifier(
            db,
            gravite=config.gravite_indisponibilite,
            message=f"L'équipement {equipement.nom} est passé indisponible.",
            equipement=equipement,
        )

    return equipement


@router.post("/scan")
def scanner_equipements(scan_in: ScanRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if scan_in.ip_fin:
        ip_debut, ip_fin = scan_in.ip_debut, scan_in.ip_fin
    else:
        prefixe = ".".join(scan_in.ip_debut.split(".")[:3])
        ip_debut, ip_fin = f"{prefixe}.1", f"{prefixe}.254"

    adresses_actives, adresses_echec = scanner_plage(ip_debut, ip_fin)

    equipements_existants = {
        eq.adresse_ip
        for eq in db.query(Equipement).filter(Equipement.site_id == scan_in.site_id).all()
    }

    equipements_crees = []
    for ip in adresses_actives:
        if ip in equipements_existants:
            continue
        mac = recuperer_mac(ip)
        nouvel_equipement = Equipement(
            site_id=scan_in.site_id,
            nom=f"Equipement {ip}",
            adresse_ip=ip,
            adresse_mac=mac,
            statut=StatutEquipement.disponible,
            type_detecte_auto=False,
        )
        db.add(nouvel_equipement)
        equipements_crees.append(ip)

    db.commit()

    return {
        "adresses_trouvees": adresses_actives,
        "equipements_crees": equipements_crees,
        "adresses_echec": adresses_echec,
    }


@router.get("/{equipement_id}/historique", response_model=list[HistoriqueStatutOut])
def get_historique_equipement(equipement_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    equipement = db.query(Equipement).filter(Equipement.id == equipement_id).first()
    if not equipement:
        raise HTTPException(status_code=404, detail="Équipement introuvable")

    return (
        db.query(HistoriqueStatut)
        .filter(HistoriqueStatut.equipement_id == equipement_id)
        .order_by(HistoriqueStatut.date_changement.desc())
        .all()
    )


@router.delete("/{equipement_id}")
def delete_equipement(equipement_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    equipement = db.query(Equipement).filter(Equipement.id == equipement_id).first()
    if not equipement:
        raise HTTPException(status_code=404, detail="Équipement introuvable")

    db.delete(equipement)
    db.commit()
    return {"detail": "Équipement supprimé"}


@router.post("/{equipement_id}/ping")
def ping_equipement(equipement_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    equipement = db.query(Equipement).filter(Equipement.id == equipement_id).first()
    if not equipement:
        raise HTTPException(status_code=404, detail="Équipement introuvable")
    if not equipement.adresse_ip:
        raise HTTPException(status_code=400, detail="Cet équipement n'a pas d'adresse IP")

    resultat = ping_detaille(equipement.adresse_ip)
    return resultat