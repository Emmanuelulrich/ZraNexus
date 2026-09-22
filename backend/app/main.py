from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from jose import jwt, JWTError

from app.database import Base, engine, SessionLocal
from app.models import user
from app.models import site, type_equipement, equipement, historique_statut, liaison_inter_site
from app.models import permission
from app.models import alerte_zabbix
from app.models import serveur_zabbix
from app.models import config_notification
from app.models import journal_activite
from app.routes import auth, users, sites, type_equipements, equipements, liaisons, permissions, alertes, serveurs_zabbix, config_notifications, journal_activite as journal_activite_routes
from app.auth.security import SECRET_KEY, ALGORITHM
from app.models.journal_activite import JournalActivite

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ZraNexus API")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
  allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://10.243.22.183:8080",
    "http://localhost:8082",
    "http://127.0.0.1:8082",
    "http://10.243.22.183:8082",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class JournalActiviteMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        if request.method == "OPTIONS":
            return response

        try:
            identifiant = None
            auth_header = request.headers.get("authorization")
            if auth_header and auth_header.lower().startswith("bearer "):
                token = auth_header.split(" ", 1)[1]
                try:
                    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                    identifiant = payload.get("sub")
                except JWTError:
                    identifiant = None

            db = SessionLocal()
            try:
                entree = JournalActivite(
                    utilisateur_identifiant=identifiant,
                    methode=request.method,
                    chemin=request.url.path,
                    adresse_ip=request.client.host if request.client else None,
                    code_statut=response.status_code,
                )
                db.add(entree)
                db.commit()
            finally:
                db.close()
        except Exception:
            pass

        return response


app.add_middleware(JournalActiviteMiddleware)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(sites.router)
app.include_router(type_equipements.router)
app.include_router(equipements.router)
app.include_router(liaisons.router)
app.include_router(permissions.router)
app.include_router(alertes.router)
app.include_router(serveurs_zabbix.router)
app.include_router(config_notifications.router)
app.include_router(journal_activite_routes.router)


@app.get("/")
def read_root():
    return {"message": "ZraNexus API en ligne"}


@app.get("/health")
def health_check():
    return {"status": "ok"}