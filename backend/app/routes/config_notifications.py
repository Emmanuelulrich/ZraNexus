from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.config_notification import ConfigNotification
from app.schemas.config_notification import ConfigNotificationOut, ConfigNotificationUpdate
from app.auth.security import get_current_user
from app.services.notifications import obtenir_config

router = APIRouter(prefix="/api/config/notifications", tags=["config_notifications"])


def require_admin(current_user):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Réservé aux administrateurs")


@router.get("/", response_model=ConfigNotificationOut)
def get_config(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    require_admin(current_user)
    return obtenir_config(db)


@router.put("/", response_model=ConfigNotificationOut)
def update_config(config_in: ConfigNotificationUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    require_admin(current_user)
    config = obtenir_config(db)
    donnees = config_in.dict(exclude_unset=True)
    for field, value in donnees.items():
        setattr(config, field, value)
    db.commit()
    db.refresh(config)
    return config