import { useEffect, useState, useRef } from "react";
import api from "../services/api";

function normaliser(texte) {
  return (texte || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function categorieType(libelle) {
  const t = normaliser(libelle);
  if (t.includes("nvr")) return "nvr";
  if (t.includes("dvr")) return "dvr";
  if (t.includes("camera")) return "camera_ip";
  if (t.includes("controleur wifi") || t.includes("controleur wi-fi") || (t.includes("controleur") && t.includes("wifi"))) return "controleur_wifi";
  if (t.includes("routeur") || t.includes("router")) return "routeur";
  if (t.includes("switch") || t.includes("commutateur")) return "switch";
  if (t.includes("serveur") || t.includes("server")) return "serveur";
  if (t.includes("pc") || t.includes("ordinateur") || t.includes("poste")) return "pc";
  if (t.includes("pare-feu") || t.includes("parefeu") || t.includes("firewall")) return "parefeu";
  return "defaut";
}

const ICONES_PAR_CATEGORIE = {
  routeur: "/icons/routeur.png",
  switch: "/icons/switch.png",
  serveur: "/icons/serveur.png",
  pc: "/icons/pc.png",
  parefeu: "/icons/parefeu.png",
  nvr: "/icons/nvr.png",
  dvr: "/icons/dvr.png",
  controleur_wifi: "/icons/controleur_wifi.png",
  camera_ip: "/icons/camera_ip.png",
};

const TAILLE_MARQUEUR = 40;

function PlanSite() {
  const [sites, setSites] = useState([]);
  const [equipements, setEquipements] = useState([]);
  const [types, setTypes] = useState([]);
  const [liaisons, setLiaisons] = useState([]);
  const [siteSelectionneId, setSiteSelectionneId] = useState("");
  const [fichierPlan, setFichierPlan] = useState(null);
  const [equipementAPositionner, setEquipementAPositionner] = useState("");
  const [idEnDeplacement, setIdEnDeplacement] = useState(null);
  const [erreur, setErreur] = useState("");
  const [messageUpload, setMessageUpload] = useState("");
  const [largeurPlan, setLargeurPlan] = useState("");
  const [afficherCouvertureWifi, setAfficherCouvertureWifi] = useState(false);
  const [equipementPorteeAAjuster, setEquipementPorteeAAjuster] = useState("");
  const [valeurPorteeAffichee, setValeurPorteeAffichee] = useState("");

  const imageRef = useRef(null);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const apiUrl = import.meta.env.VITE_API_URL;

  const chargerDonnees = async () => {
    try {
      const [sitesRes, equipementsRes, typesRes, liaisonsRes] = await Promise.all([
        api.get("/api/sites", { headers }),
        api.get("/api/equipements", { headers }),
        api.get("/api/type-equipements", { headers }),
        api.get("/api/liaisons/", { headers }),
      ]);
      setSites(sitesRes.data);
      setEquipements(equipementsRes.data);
      setTypes(typesRes.data);
      setLiaisons(liaisonsRes.data);
    } catch (err) {
      setErreur("Impossible de charger les données.");
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  const libelleDuType = (typeId) => {
    const t = types.find((ty) => ty.id === typeId);
    return t ? t.libelle : "";
  };

  const siteSelectionne = sites.find((s) => s.id === parseInt(siteSelectionneId));
  const equipementsDuSite = equipements.filter(
    (eq) => eq.site_id === parseInt(siteSelectionneId)
  );

  const enregistrerPosition = async (equipementId, x, y) => {
    try {
      await api.put(
        `/api/equipements/${equipementId}`,
        { position_sur_plan: { x, y } },
        { headers }
      );
      chargerDonnees();
    } catch (err) {
      setErreur("Erreur lors du positionnement de l'équipement.");
    }
  };

    const enregistrerPorteeAffichee = async () => {
    const equipement = equipements.find((eq) => eq.id === parseInt(equipementPorteeAAjuster));
    if (!equipement) return;
    const maxAutorise = equipement.portee_wifi_metres || 0;
    const valeur = parseFloat(valeurPorteeAffichee);
    if (isNaN(valeur) || valeur < 0) {
      setErreur("Portée invalide.");
      return;
    }
    if (valeur > maxAutorise) {
      setErreur(`La portée affichée ne peut pas dépasser la portée maximale (${maxAutorise} m).`);
      return;
    }
    try {
      await api.put(
        `/api/equipements/${equipementPorteeAAjuster}`,
        { portee_wifi_affichee_metres: valeur },
        { headers }
      );
      setErreur("");
      chargerDonnees();
    } catch (err) {
      setErreur("Erreur lors de l'enregistrement de la portée affichée.");
    }
  };
   const enregistrerLargeurPlan = async (e) => {
    e.preventDefault();
    try {
      await api.put(
        `/api/sites/${siteSelectionneId}`,
        { largeur_plan_metres: parseFloat(largeurPlan) },
        { headers }
      );
      chargerDonnees();
    } catch (err) {
      setErreur("Erreur lors de l'enregistrement de la largeur du plan.");
    }
  };
  const handleUploadPlan = async (e) => {
    e.preventDefault();
    if (!fichierPlan) return;
    const formData = new FormData();
    formData.append("fichier", fichierPlan);
    try {
      await api.post(`/api/sites/${siteSelectionneId}/plan`, formData, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      setMessageUpload("Plan importé avec succès.");
      setFichierPlan(null);
      chargerDonnees();
    } catch (err) {
      setErreur("Erreur lors de l'import du plan.");
    }
  };

  const handleClicSurPlan = (e) => {
    if (!equipementAPositionner) return;
    const rect = e.target.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    enregistrerPosition(equipementAPositionner, x, y);
  };

  const handleDragStart = (e, equipementId) => {
    setIdEnDeplacement(equipementId);
    e.dataTransfer.setData("text/plain", equipementId);
  };

  const handleDropSurPlan = (e) => {
    e.preventDefault();
    if (!idEnDeplacement || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    enregistrerPosition(idEnDeplacement, x, y);
    setIdEnDeplacement(null);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Plan de site</h2>
      {erreur && <p style={{ color: "red" }}>{erreur}</p>}

      <select
        value={siteSelectionneId}
        onChange={(e) => {
          setSiteSelectionneId(e.target.value);
          setMessageUpload("");
          setEquipementAPositionner("");
          const site = sites.find((s) => s.id === parseInt(e.target.value));
          setLargeurPlan(site?.largeur_plan_metres || "");
        }}
        style={{ padding: "6px", marginBottom: "20px" }}
      >
        <option value="">-- Choisir un site --</option>
        {sites.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nom}
          </option>
        ))}
      </select>

      {siteSelectionne && !siteSelectionne.plan_origine && (
        <form onSubmit={handleUploadPlan}>
          <p>Aucun plan importé pour ce site.</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFichierPlan(e.target.files[0])}
          />
          <button type="submit" style={{ marginLeft: "10px" }}>
            Importer le plan
          </button>
        </form>
      )}

      {messageUpload && <p style={{ color: "green" }}>{messageUpload}</p>}

      {siteSelectionne && siteSelectionne.plan_origine && (
        <form onSubmit={enregistrerLargeurPlan} style={{ marginBottom: "16px" }}>
          <label>Largeur réelle du plan (en mètres) : </label>
          <input
            type="number"
            value={largeurPlan}
            onChange={(e) => setLargeurPlan(e.target.value)}
            style={{ padding: "6px", width: "100px", marginRight: "8px" }}
          />
          <button type="submit">Enregistrer la largeur</button>
          <p style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
            Nécessaire pour afficher correctement la portée des équipements Wi-Fi sur le plan.
          </p>
        </form>
      )}

      {siteSelectionne && siteSelectionne.plan_origine && (
        <>
          <div style={{ margin: "10px 0" }}>
            <label>Positionner l'équipement : </label>
            <select
              value={equipementAPositionner}
              onChange={(e) => setEquipementAPositionner(e.target.value)}
              style={{ padding: "6px" }}
            >
              <option value="">-- Sélectionner un équipement --</option>
              {equipementsDuSite.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.nom}
                </option>
              ))}
            </select>
            {equipementAPositionner && (
              <span style={{ marginLeft: "10px", color: "#555" }}>
                Clique sur le plan pour placer cet équipement.
              </span>
            )}
            <p style={{ fontSize: "12px", color: "#888", marginTop: "6px" }}>
              Astuce : tu peux aussi glisser-déposer directement un équipement déjà placé pour le déplacer.
            </p>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", fontSize: "13px" }}>
              <input
                type="checkbox"
                checked={afficherCouvertureWifi}
                onChange={(e) => setAfficherCouvertureWifi(e.target.checked)}
              />
              Afficher la couverture Wi-Fi
            </label>
                        {afficherCouvertureWifi && (
              <div style={{ marginTop: "8px" }}>
                <label>Ajuster la portée affichée : </label>
                <select
                  value={equipementPorteeAAjuster}
                  onChange={(e) => {
                    setEquipementPorteeAAjuster(e.target.value);
                    const eq = equipements.find((x) => x.id === parseInt(e.target.value));
                    setValeurPorteeAffichee(eq?.portee_wifi_affichee_metres ?? eq?.portee_wifi_metres ?? "");
                  }}
                  style={{ padding: "6px" }}
                >
                  <option value="">-- Équipement --</option>
                  {equipementsDuSite
                    .filter((eq) => eq.position_sur_plan && eq.portee_wifi_metres > 0)
                    .map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.nom} (max {eq.portee_wifi_metres} m)
                      </option>
                    ))}
                </select>
                {equipementPorteeAAjuster && (
                  <>
                    <input
                      type="number"
                      min="0"
                      max={equipements.find((eq) => eq.id === parseInt(equipementPorteeAAjuster))?.portee_wifi_metres}
                      value={valeurPorteeAffichee}
                      onChange={(e) => setValeurPorteeAffichee(e.target.value)}
                      style={{ width: "80px", marginLeft: "8px", padding: "6px" }}
                    />
                    <button onClick={enregistrerPorteeAffichee} style={{ marginLeft: "8px" }}>
                      Enregistrer
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div
            style={{ position: "relative", display: "inline-block" }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropSurPlan}
          >
            <img
              ref={imageRef}
              src={`${apiUrl}${siteSelectionne.plan_origine}`}
              alt="Plan du site"
              onClick={handleClicSurPlan}
              style={{ maxWidth: "100%", cursor: equipementAPositionner ? "crosshair" : "default" }}
            />
                        <svg
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {liaisons
                .filter((liaison) => {
                  const eqSource = equipementsDuSite.find((eq) => eq.id === liaison.equipement_source_id && eq.position_sur_plan);
                  const eqDestination = equipementsDuSite.find((eq) => eq.id === liaison.equipement_destination_id && eq.position_sur_plan);
                  return eqSource && eqDestination;
                })
                .map((liaison) => {
                  const eqSource = equipementsDuSite.find((eq) => eq.id === liaison.equipement_source_id);
                  const eqDestination = equipementsDuSite.find((eq) => eq.id === liaison.equipement_destination_id);
                  return (
                    <line
                      key={liaison.id}
                      x1={eqSource.position_sur_plan.x * 100}
                      y1={eqSource.position_sur_plan.y * 100}
                      x2={eqDestination.position_sur_plan.x * 100}
                      y2={eqDestination.position_sur_plan.y * 100}
                      stroke="#000000"
                      strokeWidth="0.5"
                      strokeDasharray="2 2"
                    />
                  );
                })}
                                            {afficherCouvertureWifi && siteSelectionne.largeur_plan_metres > 0 &&
                equipementsDuSite
                  .filter((eq) => eq.position_sur_plan && eq.portee_wifi_metres > 0)
                                   .map((eq) => {
                    const porteeUtilisee = Math.min(
                      eq.portee_wifi_affichee_metres ?? eq.portee_wifi_metres,
                      eq.portee_wifi_metres
                    );
                    const rayonEnPourcentage = (porteeUtilisee / siteSelectionne.largeur_plan_metres) * 100;
                    return (
                      <circle
                        key={`portee-${eq.id}`}
                        cx={eq.position_sur_plan.x * 100}
                        cy={eq.position_sur_plan.y * 100}
                        r={rayonEnPourcentage}
                        fill="rgba(52, 152, 219, 0.15)"
                        stroke="rgba(52, 152, 219, 0.6)"
                        strokeWidth="0.3"
                      />
                    );
                  })}
            </svg>
            {equipementsDuSite
              .filter((eq) => eq.position_sur_plan)
              .map((eq) => {
                const typeObjet = types.find((ty) => ty.id === eq.type_id);
                const categorie = categorieType(libelleDuType(eq.type_id));
                const urlIcone = typeObjet?.icone
                  ? `${apiUrl}${typeObjet.icone}`
                  : ICONES_PAR_CATEGORIE[categorie];
                const couleurFond = eq.statut === "disponible" ? "#2ecc71" : "#e74c3c";
                return (
                  <div
                    key={eq.id}
                    title={eq.nom}
                    draggable
                    onDragStart={(e) => handleDragStart(e, eq.id)}
                    style={{
                      position: "absolute",
                      left: `${eq.position_sur_plan.x * 100}%`,
                      top: `${eq.position_sur_plan.y * 100}%`,
                      transform: "translate(-50%, -50%)",
                      width: `${TAILLE_MARQUEUR}px`,
                      height: `${TAILLE_MARQUEUR}px`,
                      borderRadius: "50%",
                      background: couleurFond,
                      border: "3px solid white",
                      boxShadow: "0 0 5px rgba(0,0,0,0.6)",
                      cursor: "grab",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {urlIcone ? (
                      <img
                        src={urlIcone}
                        alt={categorie}
                        style={{ width: "26px", height: "26px", objectFit: "contain", pointerEvents: "none" }}
                      />
                    ) : (
                      <span style={{ color: "white", fontWeight: "bold", fontSize: "14px" }}>?</span>
                    )}
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}

export default PlanSite;