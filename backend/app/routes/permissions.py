from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.permission import Permission
from app.schemas.permission import PermissionCreate, PermissionOut
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/permissions", tags=["permissions"])

def require_admin(current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Réservé à l'administrateur")
    return current_user

@router.get("/", response_model=list[PermissionOut])
def lister_permissions(db: Session = Depends(get_db), admin=Depends(require_admin)):
    return db.query(Permission).all()

@router.post("/", response_model=PermissionOut)
def creer_permission(permission: PermissionCreate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    nouvelle = Permission(**permission.dict())
    db.add(nouvelle)
    db.commit()
    db.refresh(nouvelle)
    return nouvelle

@router.delete("/{permission_id}")
def supprimer_permission(permission_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    if not permission:
        raise HTTPException(status_code=404, detail="Permission introuvable")
    db.delete(permission)
    db.commit()
    return {"message": "Permission supprimée"}