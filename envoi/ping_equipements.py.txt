from icmplib import ping as icmp_ping

from app.celery_app import celery_app
from app.database import SessionLocal
from app.models import site, type_equipement, equipement, historique_statut, liaison_inter_site, user, permission
from app.models.equipement import Equipement
from app.models.historique_statut import HistoriqueStatut


@celery_app.task(name="app.tasks.ping_equipements.ping_tous_les_equipements")
def ping_tous_les_equipements():
    db = SessionLocal()
    try:
        equipements = db.query(Equipement).filter(Equipement.adresse_ip.isnot(None)).all()

        for equipement_obj in equipements:
            try:
                resultat = icmp_ping(equipement_obj.adresse_ip, count=2, timeout=1, privileged=False)
                nouveau_statut = "disponible" if resultat.is_alive else "indisponible"
            except Exception:
                nouveau_statut = "indisponible"

            if nouveau_statut != equipement_obj.statut:
                historique = HistoriqueStatut(
                    equipement_id=equipement_obj.id,
                    ancien_statut=equipement_obj.statut,
                    nouveau_statut=nouveau_statut,
                )
                db.add(historique)
                equipement_obj.statut = nouveau_statut

        db.commit()
        return {"equipements_verifies": len(equipements)}
    finally:
        db.close()