import sys
from app.database import SessionLocal
from app.models.user import User
from app.auth.security import hash_password

def create_admin(identifiant: str, mot_de_passe: str):
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.identifiant == identifiant).first()
        if existing:
            print(f"Le compte '{identifiant}' existe déjà, aucune action effectuée.")
            return

        admin = User(
            identifiant=identifiant,
            mot_de_passe_hash=hash_password(mot_de_passe),
            role="admin",
        )
        db.add(admin)
        db.commit()
        print(f"Compte admin '{identifiant}' créé avec succès.")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python create_admin.py <identifiant> <mot_de_passe>")
        sys.exit(1)
    create_admin(sys.argv[1], sys.argv[2])