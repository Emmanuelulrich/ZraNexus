import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv
from sqlalchemy.orm import Session

from app.models.config_notification import ConfigNotification

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)

ORDRE_GRAVITE = {
    "catastrophe": 5, "disaster": 5,
    "elevee": 4, "élevée": 4, "high": 4,
    "moyenne": 3, "average": 3,
    "avertissement": 2, "warning": 2,
    "information": 1,
}


def score_gravite(gravite: str) -> int:
    return ORDRE_GRAVITE.get((gravite or "").lower().strip(), 1)


def obtenir_config(db: Session) -> ConfigNotification:
    config = db.query(ConfigNotification).first()
    if not config:
        config = ConfigNotification()
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


def envoyer_email(destinataires: list[str], sujet: str, corps: str):
    if not SMTP_HOST or not destinataires:
        return
    message = MIMEText(corps)
    message["Subject"] = sujet
    message["From"] = SMTP_FROM
    message["To"] = ", ".join(destinataires)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as serveur:
        serveur.starttls()
        serveur.login(SMTP_USER, SMTP_PASSWORD)
        serveur.sendmail(SMTP_FROM, destinataires, message.as_string())


def evaluer_et_notifier(db: Session, gravite: str, message: str, equipement=None, site=None):
    config = obtenir_config(db)
    if not config.active or not config.destinataires:
        return

    score = score_gravite(gravite)

    if equipement is not None:
        seuils_par_priorite = {
            "basse": config.seuil_priorite_basse,
            "normale": config.seuil_priorite_normale,
            "haute": config.seuil_priorite_haute,
            "critique": config.seuil_priorite_critique,
        }
        priorite = getattr(equipement.priorite, "value", equipement.priorite) or "normale"
        seuil = seuils_par_priorite.get(priorite, config.seuil_priorite_normale)
        cible = f"équipement {equipement.nom} (priorité {priorite})"
    else:
        seuil = config.seuil_site
        cible = f"site {site.nom}" if site else "un élément non identifié"

    if score < seuil:
        return

    destinataires = [d.strip() for d in config.destinataires.split(",") if d.strip()]
    sujet = f"[ZraNexus] Alerte {gravite} — {cible}"
    corps = f"Gravité : {gravite}\nConcerne : {cible}\n\n{message}"
    envoyer_email(destinataires, sujet, corps)