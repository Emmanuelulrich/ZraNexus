from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.permission import Permission
from app.schemas.user import UserOut, UserCreateAvecPermissions, UserUpdate, UserOutAvecSites
from app.auth.security import get_current_user, hash_password
from app.routes.permissions import require_admin

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user


def _site_ids_de(db: Session, user_id: int) -> list[int]:
    return [p.site_id for p in db.query(Permission).filter(Permission.utilisateur_id == user_id).all()]


@router.get("/", response_model=list[UserOutAvecSites])
def lister_utilisateurs(db: Session = Depends(get_db), admin=Depends(require_admin)):
    utilisateurs = db.query(User).all()
    return [
        UserOutAvecSites(id=u.id, identifiant=u.identifiant, role=u.role, site_ids=_site_ids_de(db, u.id))
        for u in utilisateurs
    ]


@router.post("/", response_model=UserOutAvecSites)
def creer_utilisateur(user_in: UserCreateAvecPermissions, db: Session = Depends(get_db), admin=Depends(require_admin)):
    existant = db.query(User).filter(User.identifiant == user_in.identifiant).first()
    if existant:
        raise HTTPException(status_code=400, detail="Cet identifiant est déjà utilisé")

    nouvel_utilisateur = User(
        identifiant=user_in.identifiant,
        mot_de_passe_hash=hash_password(user_in.mot_de_passe),
        role=user_in.role,
    )
    db.add(nouvel_utilisateur)
    db.commit()
    db.refresh(nouvel_utilisateur)

    for site_id in user_in.site_ids:
        db.add(Permission(utilisateur_id=nouvel_utilisateur.id, site_id=site_id))
    db.commit()

    return UserOutAvecSites(
        id=nouvel_utilisateur.id, identifiant=nouvel_utilisateur.identifiant,
        role=nouvel_utilisateur.role, site_ids=user_in.site_ids,
    )


@router.put("/{user_id}", response_model=UserOutAvecSites)
def modifier_utilisateur(user_id: int, user_in: UserUpdate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    utilisateur = db.query(User).filter(User.id == user_id).first()
    if not utilisateur:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    if user_in.identifiant is not None:
        doublon = db.query(User).filter(User.identifiant == user_in.identifiant, User.id != user_id).first()
        if doublon:
            raise HTTPException(status_code=400, detail="Cet identifiant est déjà utilisé")
        utilisateur.identifiant = user_in.identifiant

    if user_in.mot_de_passe is not None:
        utilisateur.mot_de_passe_hash = hash_password(user_in.mot_de_passe)

    if user_in.role is not None:
        utilisateur.role = user_in.role

    db.commit()
    db.refresh(utilisateur)

    return UserOutAvecSites(
        id=utilisateur.id, identifiant=utilisateur.identifiant, role=utilisateur.role,
        site_ids=_site_ids_de(db, utilisateur.id),
    )


@router.put("/{user_id}/permissions", response_model=list[int])
def modifier_permissions_utilisateur(user_id: int, site_ids: list[int], db: Session = Depends(get_db), admin=Depends(require_admin)):
    utilisateur = db.query(User).filter(User.id == user_id).first()
    if not utilisateur:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    db.query(Permission).filter(Permission.utilisateur_id == user_id).delete()
    for site_id in site_ids:
        db.add(Permission(utilisateur_id=user_id, site_id=site_id))
    db.commit()
    return site_ids


@router.delete("/{user_id}")
def supprimer_utilisateur(user_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    utilisateur = db.query(User).filter(User.id == user_id).first()
    if not utilisateur:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    if utilisateur.role == "admin":
        nb_admins = db.query(User).filter(User.role == "admin").count()
        if nb_admins <= 1:
            raise HTTPException(status_code=400, detail="Impossible de supprimer le dernier administrateur")
    db.query(Permission).filter(Permission.utilisateur_id == user_id).delete()
    db.delete(utilisateur)
    db.commit()
    return {"message": "Utilisateur supprimé"}