import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";
import api from "../services/api";
import html2canvas from "html2canvas";
const SEUIL_ZOOM_EQUIPEMENT = 15;
const API_URL = import.meta.env.VITE_API_URL;

function SelecteurPosition({ onSelect }) {
  useMapEvents({
    click() {
      onSelect();
    },
  });
  return null;
}

function TraqueurZoom({ onZoomChange }) {
  useMapEvents({
    zoomend: (e) => {
      onZoomChange(e.target.getZoom());
    },
  });
  return null;
}

function graviteInfo(alertes) {
  const ordre = { catastrophe: 5, disaster: 5, elevee: 4, "élevée": 4, high: 4, moyenne: 3, average: 3, avertissement: 2, warning: 2, information: 1 };
  const couleurs = { catastrophe: "#8e0000", disaster: "#8e0000", elevee: "#e74c3c", "élevée": "#e74c3c", high: "#e74c3c", moyenne: "#f39c12", average: "#f39c12", avertissement: "#f1c40f", warning: "#f1c40f", information: "#3498db" };

  let meilleureCle = null;
  let meilleurScore = 0;

  alertes.forEach((a) => {
    const cle = (a.gravite || "").toLowerCase().trim();
    const score = ordre[cle] ?? 1;
    if (score > meilleurScore) {
      meilleurScore = score;
      meilleureCle = cle;
    }
  });

  return {
    couleur: couleurs[meilleureCle] || "#e74c3c",
    score: meilleurScore || 1,
  };
}

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
  if (t.includes("camera")) return "camera_ip";
  if (t.includes("dvr")) return "dvr";
  if (t.includes("controleur wifi") || t.includes("controleur wi-fi") || (t.includes("controleur") && t.includes("wifi"))) return "controleur_wifi";
  if (t.includes("routeur wifi") || t.includes("routeur wi-fi") || (t.includes("routeur") && t.includes("wifi"))) return "routeur_wifi";
  if (t.includes("point d'acces") || t.includes("point acces") || t.includes("access point")) return "point_acces";
  if (t.includes("repeteur") || t.includes("repeater") || t.includes("extender")) return "repeteur";
  if (t.includes("antenne")) return "antenne";
  if (t.includes("camera") || t.includes("cctv") || t.includes("videosurveillance")) return "camera";
  if (t.includes("telephone ip") || t.includes("telephone") || t.includes("ip phone") || t.includes("voip")) return "telephone_ip";
  if (t.includes("controleur d'acces") || t.includes("controleur acces") || t.includes("access control")) return "controleur_acces";
  if (t.includes("lecteur de badge") || t.includes("lecteur badge") || t.includes("badge reader")) return "lecteur_badge";
  if (t.includes("passerelle") || t.includes("gateway")) return "passerelle";
  if (t.includes("modem")) return "modem";
  if (t.includes("cloud") || t.includes("nuage")) return "cloud";
  if (t.includes("imprimante") || t.includes("printer")) return "imprimante";
  if (t.includes("routeur") || t.includes("router")) return "routeur";
  if (t.includes("switch") || t.includes("commutateur")) return "switch";
  if (t.includes("serveur") || t.includes("server")) return "serveur";
  if (t.includes("pc") || t.includes("ordinateur") || t.includes("poste")) return "pc";
  if (t.includes("pare-feu") || t.includes("parefeu") || t.includes("firewall")) return "parefeu";
  return "defaut";
}
// Icônes PNG (dossier frontend/public/icons/) associées à chaque catégorie détectée par categorieType()
const ICONES_PAR_CATEGORIE = {
    nvr: "/icons/nvr.png",
  dvr: "/icons/dvr.png",
  controleur_wifi: "/icons/controleur_wifi.png",
  camera_ip: "/icons/camera_ip.png",
  routeur: "/icons/routeur.png",
  routeur_wifi: "/icons/routeur_wifi.png",
  point_acces: "/icons/point_acces.png",
  repeteur: "/icons/repeteur.png",
  antenne: "/icons/antenne.png",
  camera: "/icons/camera_ip.png",
  telephone_ip: "/icons/telephone_ip.png",
  controleur_acces: "/icons/controleur_acces.png",
  lecteur_badge: "/icons/lecteur_badge.png",
  passerelle: "/icons/passerelle.png",
  modem: "/icons/modem.png",
  cloud: "/icons/cloud.png",
  imprimante: "/icons/imprimante.png",
  switch: "/icons/switch.png",
  serveur: "/icons/serveur.png",
  pc: "/icons/pc.png",
  parefeu: "/icons/parefeu.png",
  defaut: "/icons/type_inconnu.png",
};

function creerIconeEquipement(statut, alertesEq, typeLibelle, iconePersonnalisee) {
  const aUneAlerte = alertesEq.length > 0;
  const couleurFond = statut === "disponible" ? "#2ecc71" : "#e74c3c";
  const info = aUneAlerte ? graviteInfo(alertesEq) : null;
  const couleurOnde = info ? info.couleur : couleurFond;
  const epaisseurHalo = info ? 2 + info.score * 2 : 2;
  const bordure = aUneAlerte ? `3px solid ${couleurOnde}` : "2px solid white";
  const anneauPulsation = aUneAlerte
    ? `<div class="anneau-pulsation" style="border-color:${couleurOnde}; border-width:${epaisseurHalo}px; width:22px; height:22px; margin-top:-11px; margin-left:-11px;"></div>`
    : "";

  let urlIcone;
  if (iconePersonnalisee) {
    urlIcone = `${API_URL}${iconePersonnalisee}`;
  } else {
    const categorie = categorieType(typeLibelle);
    urlIcone = ICONES_PAR_CATEGORIE[categorie] || ICONES_PAR_CATEGORIE.defaut;
  }
  const contenuPictogramme = `<img src="${urlIcone}" style="width:16px; height:16px; object-fit:contain; border-radius:3px;" />`;

  return L.divIcon({
    className: "",
    html: `<div style="position:relative; width:22px; height:22px;">
      ${anneauPulsation}
      <div style="
        position:relative;
        background:${couleurFond};
        width:22px;
        height:22px;
        border-radius:50%;
        border:${bordure};
        box-shadow:0 0 3px rgba(0,0,0,0.5);
        display:flex;
        align-items:center;
        justify-content:center;
      ">
        ${contenuPictogramme}
      </div>
    </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function creerIconeSite(alertesSite) {
  if (alertesSite.length === 0) return new L.Icon.Default();
  const info = graviteInfo(alertesSite);
  const epaisseurHalo = 2 + info.score * 2;
  return L.divIcon({
    className: "",
    html: `<div style="position:relative; width:22px; height:22px;">
      <div class="anneau-pulsation" style="border-color:${info.couleur}; border-width:${epaisseurHalo}px; width:22px; height:22px; margin-top:-11px; margin-left:-11px;"></div>
      <div style="
        position:relative;
        background:${info.couleur};
        width:22px;
        height:22px;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        border:2px solid white;
        box-shadow:0 0 4px rgba(0,0,0,0.6);
      "></div>
    </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
  });
}

function decalerPosition(lat, lng, index, total) {
  const rayon = 0.003;
  const angle = (2 * Math.PI * index) / Math.max(total, 1);
  return [lat + rayon * Math.sin(angle), lng + rayon * Math.cos(angle)];
}

function calculerPositionsEquipements(sites, equipements) {
  const positions = {};
  sites
    .filter((s) => s.latitude && s.longitude)
    .forEach((site) => {
      const equipementsDuSite = equipements.filter((eq) => eq.site_id === site.id);
      equipementsDuSite.forEach((eq, index) => {
        positions[eq.id] = decalerPosition(site.latitude, site.longitude, index, equipementsDuSite.length);
      });
    });
  return positions;
}

async function geocoderAdresse(quartier, ville, pays) {
  const requete = [quartier, ville, pays].filter(Boolean).join(", ");
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(requete)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data || data.length === 0) {
    throw new Error("Adresse introuvable");
  }
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

function NetworkMap() {
  const [sites, setSites] = useState([]);
  const [equipements, setEquipements] = useState([]);
  const [types, setTypes] = useState([]);
  const [liaisons, setLiaisons] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [erreur, setErreur] = useState("");
  const [zoomActuel, setZoomActuel] = useState(12);

  const [afficherFormulaireSite, setAfficherFormulaireSite] = useState(false);
  const [formSite, setFormSite] = useState({ nom: "", pays: "", ville: "", quartier: "" });

  const [afficherFormulaireEquipement, setAfficherFormulaireEquipement] = useState(false);
  const [siteSelectionne, setSiteSelectionne] = useState(null);
  const [nouveauType, setNouveauType] = useState("");
  const [formEquipement, setFormEquipement] = useState({
  nom: "",
  adresse_ip: "",
  type_id: "",
});

  const [afficherHistorique, setAfficherHistorique] = useState(false);
  const [historiqueEquipement, setHistoriqueEquipement] = useState([]);
  const [equipementSelectionne, setEquipementSelectionne] = useState(null);

  const [afficherModifSite, setAfficherModifSite] = useState(false);
  const [siteEnModification, setSiteEnModification] = useState(null);
  const [formModifSite, setFormModifSite] = useState({ nom: "", pays: "", ville: "", quartier: "" });

  const [afficherModifEquipement, setAfficherModifEquipement] = useState(false);
  const [equipementEnModification, setEquipementEnModification] = useState(null);
  const [formModifEquipement, setFormModifEquipement] = useState({ nom: "", adresse_ip: "", type_id: "", statut: "disponible", priorite: "normale" });

  const [afficherAlertes, setAfficherAlertes] = useState(false);
  const [afficherFiltres, setAfficherFiltres] = useState(false);
const [filtreType, setFiltreType] = useState("");
const [filtreSite, setFiltreSite] = useState("");
const [filtreStatut, setFiltreStatut] = useState("");
  const [resultatPing, setResultatPing] = useState({});
const [pingEnCours, setPingEnCours] = useState(null);
const [afficherFormulaireScan, setAfficherFormulaireScan] = useState(false);
const [formScan, setFormScan] = useState({ site_id: "", ip_debut: "", ip_fin: "" });
const [resultatScan, setResultatScan] = useState(null);
const [scanEnCours, setScanEnCours] = useState(false);
  const [afficherFormulaireLiaison, setAfficherFormulaireLiaison] = useState(false);
  const [formLiaison, setFormLiaison] = useState({
    equipement_source_id: "",
    equipement_destination_id: "",
    type_liaison: "",
    description: "",
  });
   const [afficherUniquementSites, setAfficherUniquementSites] = useState(false);
   const [afficherCouvertureWifi, setAfficherCouvertureWifi] = useState(false);
   const [pleinEcran, setPleinEcran] = useState(false);
   const mapWrapperRef = useRef(null);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const chargerDonnees = async () => {
    try {
      const [sitesRes, equipementsRes, typesRes, liaisonsRes, alertesRes] = await Promise.all([
        api.get("/api/sites", { headers }),
        api.get("/api/equipements", { headers }),
        api.get("/api/type-equipements", { headers }),
        api.get("/api/liaisons/", { headers }),
        api.get("/api/alertes", { headers }),
      ]);
      setSites(sitesRes.data);
      setEquipements(equipementsRes.data);
      setTypes(typesRes.data);
      setLiaisons(liaisonsRes.data);
      setAlertes(alertesRes.data);
    } catch (err) {
      setErreur("Impossible de charger les données.");
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, []);
  
  useEffect(() => {
    const handler = () => setPleinEcran(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const basculerPleinEcran = () => {
    if (!document.fullscreenElement) {
      mapWrapperRef.current.requestFullscreen().catch((err) => {
        console.error("Erreur plein écran :", err);
        setErreur("Impossible d'activer le plein écran : " + err.message);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const alertesActives = alertes.filter((a) => !a.resolue);

  const alertesDuSite = (siteId) => alertesActives.filter((a) => a.site_id === siteId);
  const alertesDeLEquipement = (equipementId) => alertesActives.filter((a) => a.equipement_id === equipementId);

  const positionsEquipements = calculerPositionsEquipements(sites, equipements);
  const equipementsFiltres = equipements.filter((eq) => {
  if (filtreType && eq.type_id !== parseInt(filtreType)) return false;
  if (filtreSite && eq.site_id !== parseInt(filtreSite)) return false;
  if (filtreStatut && eq.statut !== filtreStatut) return false;
  return true;
});

  const libelleDuType = (typeId) => {
    const t = types.find((ty) => ty.id === typeId);
    return t ? t.libelle : "";
  };
  
  const iconeDuType = (typeId) => {
    const t = types.find((ty) => ty.id === typeId);
    return t ? t.icone : null;
  };
const lancerPing = async (equipement) => {
  setPingEnCours(equipement.id);
  try {
    const res = await api.post(`/api/equipements/${equipement.id}/ping`, {}, { headers });
    setResultatPing({ ...resultatPing, [equipement.id]: res.data });
  } catch (err) {
    setErreur("Erreur lors du ping.");
  } finally {
    setPingEnCours(null);
  }
};
  const resoudreAlerte = async (alerteId) => {
    try {
      await api.put(`/api/alertes/${alerteId}/resoudre`, {}, { headers });
      chargerDonnees();
    } catch (err) {
      setErreur("Erreur lors de la résolution de l'alerte.");
    }
  };

  const handleMapClick = () => {
    setAfficherFormulaireSite(true);
  };

  const handleChangeSite = (e) => {
    setFormSite({ ...formSite, [e.target.name]: e.target.value });
  };

  const handleSubmitSite = async (e) => {
    e.preventDefault();
    try {
      const position = await geocoderAdresse(formSite.quartier, formSite.ville, formSite.pays);
      await api.post(
        "/api/sites",
        { ...formSite, latitude: position.lat, longitude: position.lng },
        { headers }
      );
      setAfficherFormulaireSite(false);
      setFormSite({ nom: "", pays: "", ville: "", quartier: "" });
      chargerDonnees();
    } catch (err) {
      setErreur("Adresse introuvable — vérifie le quartier/ville/pays saisis.");
    }
  };

  const ouvrirFormulaireEquipement = (site) => {
    setSiteSelectionne(site);
    setAfficherFormulaireEquipement(true);
  };

  const handleChangeEquipement = (e) => {
    setFormEquipement({ ...formEquipement, [e.target.name]: e.target.value });
  };

  const handleSubmitEquipement = async (e) => {
    e.preventDefault();
    try {
      let typeIdFinal = formEquipement.type_id;

      if (typeIdFinal === "__nouveau__") {
        const typeRes = await api.post(
          "/api/type-equipements",
          { libelle: nouveauType, icone: "", est_type_inconnu: false },
          { headers }
        );
        typeIdFinal = typeRes.data.id;
      }

      await api.post(
        "/api/equipements",
        {
          ...formEquipement,
          site_id: siteSelectionne.id,
          type_id: typeIdFinal ? parseInt(typeIdFinal) : null,
        },
        { headers }
      );

      setAfficherFormulaireEquipement(false);
      setFormEquipement({ nom: "", adresse_ip: "", type_id: "", statut: "disponible" });
      setNouveauType("");
      setSiteSelectionne(null);
      chargerDonnees();
    } catch (err) {
      setErreur("Erreur lors de la création de l'équipement.");
    }
  };

  const toggleStatutEquipement = async (equipement) => {
    try {
      const nouveauStatut = equipement.statut === "disponible" ? "indisponible" : "disponible";
      await api.put(
        `/api/equipements/${equipement.id}`,
        { statut: nouveauStatut },
        { headers }
      );
      chargerDonnees();
    } catch (err) {
      setErreur("Erreur lors de la mise à jour du statut.");
    }
  };

  const supprimerEquipement = async (equipement) => {
    if (!window.confirm(`Supprimer l'équipement "${equipement.nom}" ?`)) return;
    try {
      await api.delete(`/api/equipements/${equipement.id}`, { headers });
      chargerDonnees();
    } catch (err) {
      setErreur("Erreur lors de la suppression.");
    }
  };

  const voirHistorique = async (equipement) => {
    try {
      const res = await api.get(`/api/equipements/${equipement.id}/historique`, { headers });
      setHistoriqueEquipement(res.data);
      setEquipementSelectionne(equipement);
      setAfficherHistorique(true);
    } catch (err) {
      setErreur("Erreur lors du chargement de l'historique.");
    }
  };

  const ouvrirModifSite = (site) => {
    setSiteEnModification(site);
    setFormModifSite({ nom: site.nom, pays: site.pays, ville: site.ville, quartier: site.quartier || "" });
    setAfficherModifSite(true);
  };

  const handleChangeModifSite = (e) => {
    setFormModifSite({ ...formModifSite, [e.target.name]: e.target.value });
  };

  const handleSubmitModifSite = async (e) => {
    e.preventDefault();
    try {
      const position = await geocoderAdresse(formModifSite.quartier, formModifSite.ville, formModifSite.pays);
      await api.put(
        `/api/sites/${siteEnModification.id}`,
        { ...formModifSite, latitude: position.lat, longitude: position.lng },
        { headers }
      );
      setAfficherModifSite(false);
      setSiteEnModification(null);
      chargerDonnees();
    } catch (err) {
      setErreur("Adresse introuvable — vérifie le quartier/ville/pays saisis.");
    }
  };

  const ouvrirModifEquipement = (equipement) => {
    setEquipementEnModification(equipement);
    setFormModifEquipement({
      nom: equipement.nom,
      adresse_ip: equipement.adresse_ip || "",
      type_id: equipement.type_id || "",
      statut: equipement.statut,
      priorite: equipement.priorite || "normale",
      portee_wifi_metres: equipement.portee_wifi_metres || "",
    });
    setAfficherModifEquipement(true);
  };

  const handleChangeModifEquipement = (e) => {
    setFormModifEquipement({ ...formModifEquipement, [e.target.name]: e.target.value });
  };

  const handleSubmitModifEquipement = async (e) => {
    e.preventDefault();
    try {
      await api.put(
        `/api/equipements/${equipementEnModification.id}`,
        { ...formModifEquipement, type_id: formModifEquipement.type_id ? parseInt(formModifEquipement.type_id) : null },
        { headers }
      );
      setAfficherModifEquipement(false);
      setEquipementEnModification(null);
      chargerDonnees();
    } catch (err) {
      setErreur("Erreur lors de la modification de l'équipement.");
    }
  };

  const handleChangeLiaison = (e) => {
    setFormLiaison({ ...formLiaison, [e.target.name]: e.target.value });
  };
const handleChangeScan = (e) => {
  setFormScan({ ...formScan, [e.target.name]: e.target.value });
};

const handleSubmitScan = async (e) => {
  e.preventDefault();
  setScanEnCours(true);
  setResultatScan(null);
  try {
    const res = await api.post(
      "/api/equipements/scan",
      {
        site_id: parseInt(formScan.site_id),
        ip_debut: formScan.ip_debut,
        ip_fin: formScan.ip_fin || null,
      },
      { headers }
    );
    setResultatScan(res.data);
    chargerDonnees();
  } catch (err) {
    setErreur("Erreur lors du scan de la plage IP.");
  } finally {
    setScanEnCours(false);
  }
};
  const handleSubmitLiaison = async (e) => {
    e.preventDefault();
    try {
      await api.post(
        "/api/liaisons/",
        {
          equipement_source_id: parseInt(formLiaison.equipement_source_id),
          equipement_destination_id: parseInt(formLiaison.equipement_destination_id),
          type_liaison: formLiaison.type_liaison || null,
          description: formLiaison.description || null,
        },
        { headers }
      );
      setAfficherFormulaireLiaison(false);
      setFormLiaison({ equipement_source_id: "", equipement_destination_id: "", type_liaison: "", description: "" });
      chargerDonnees();
    } catch (err) {
      setErreur("Erreur lors de la création de la liaison.");
    }
  };

  const supprimerLiaison = async (liaison) => {
    if (!window.confirm("Supprimer cette liaison ?")) return;
    try {
      await api.delete(`/api/liaisons/${liaison.id}`, { headers });
      chargerDonnees();
    } catch (err) {
      setErreur("Erreur lors de la suppression de la liaison.");
    }
  };
  
  const exporterCartePNG = () => {
  if (!mapWrapperRef.current) return;
  html2canvas(mapWrapperRef.current, { useCORS: true }).then((canvas) => {
    const lien = document.createElement("a");
    lien.download = `carte-reseau-${new Date().toISOString().slice(0, 10)}.png`;
    lien.href = canvas.toDataURL("image/png");
    lien.click();
  });
};
  const centreDefaut = [4.0511, 9.7679];

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      <style>{`
        .anneau-pulsation {
          position: absolute;
          top: 50%;
          left: 50%;
          border-radius: 50%;
          border-style: solid;
          animation: pulsation-onde 1.5s ease-out infinite;
          pointer-events: none;
        }
        @keyframes pulsation-onde {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.8); opacity: 0; }
        }
          .carte-amelioree {
  filter: contrast(1.1) saturate(1.2) brightness(1.02);
}
      `}</style>
      {erreur && <p style={{ color: "red", position: "absolute", zIndex: 1000, top: 10, left: 200 }}>{erreur}</p>}

      <button
        onClick={() => setAfficherFormulaireLiaison(true)}
        style={{
          position: "absolute",
          top: 10,
          left: 20,
          zIndex: 1000,
          background: "#2c3e50",
          color: "white",
          border: "none",
          borderRadius: "20px",
          padding: "8px 16px",
          fontWeight: "bold",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        }}
      >
        🔗 Nouvelle liaison
      </button>
            <button
        onClick={() => setAfficherFormulaireScan(true)}
        style={{
          position: "absolute",
          top: 60,
          left: 20,
          zIndex: 1000,
          background: "#16a085",
          color: "white",
          border: "none",
          borderRadius: "20px",
          padding: "8px 16px",
          fontWeight: "bold",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        }}
      >
        📡 Scanner une plage IP
      </button>
      <button
      
  onClick={() => setAfficherFiltres(true)}
  style={{
    position: "absolute",
    top: 110,
    left: 20,
    zIndex: 1000,
    background: "#8e44ad",
    color: "white",
    border: "none",
    borderRadius: "20px",
    padding: "8px 16px",
    fontWeight: "bold",
    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
  }}
>
  🔍 Filtres
</button>
      
      <button
  onClick={exporterCartePNG}
  style={{
    position: "absolute",
    top: 160,
    left: 20,
    zIndex: 1000,
    background: "#2980b9",
    color: "white",
    border: "none",
    borderRadius: "20px",
    padding: "8px 16px",
    fontWeight: "bold",
    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
  }}
>
  📷 Exporter en PNG
</button>
      <button
        onClick={basculerPleinEcran}
        style={{
          position: "absolute",
          top: 210,
          left: 20,
          zIndex: 1000,
          background: "#34495e",
          color: "white",
          border: "none",
          borderRadius: "20px",
          padding: "8px 16px",
          fontWeight: "bold",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        }}
      >
        {pleinEcran ? "🡼 Quitter le plein écran" : "⛶ Plein écran"}
      </button>
      {alertesActives.length > 0 && (
        <button
          onClick={() => setAfficherAlertes(true)}
          style={{
            position: "absolute",
            top: 10,
            right: 20,
            zIndex: 1000,
            background: "#e74c3c",
            color: "white",
            border: "none",
            borderRadius: "20px",
            padding: "8px 16px",
            fontWeight: "bold",
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          }}
        >
          🔔 {alertesActives.length} alerte{alertesActives.length > 1 ? "s" : ""} active{alertesActives.length > 1 ? "s" : ""}
        </button>
      )}

      {afficherAlertes && (
        <div style={panneauStyle}>
          <h3>Alertes actives</h3>
          {alertesActives.length === 0 && <p style={{ fontSize: "13px" }}>Aucune alerte active.</p>}
          <ul style={{ paddingLeft: "0", listStyle: "none", fontSize: "13px", maxHeight: "300px", overflowY: "auto" }}>
            {alertesActives.map((a) => {
              const site = sites.find((s) => s.id === a.site_id);
              const equipement = equipements.find((e) => e.id === a.equipement_id);
              return (
                <li key={a.id} style={{ marginBottom: "10px", borderLeft: "3px solid #e74c3c", paddingLeft: "8px" }}>
                  <strong>{a.gravite}</strong> — {a.message}
                  <br />
                  <span style={{ color: "#777" }}>
                    {equipement ? `Équipement : ${equipement.nom}` : site ? `Site : ${site.nom}` : ""}
                  </span>
                  <br />
                  <span style={{ fontSize: "12px", color: "#888" }}>
                    Serveur : {a.serveur_zabbix_nom || "Inconnu"}
                  </span>
                  <br />
                  <span style={{ color: "#777" }}>{new Date(a.date_creation).toLocaleString()}</span>
                  <br />
                  <button onClick={() => resoudreAlerte(a.id)} style={{ marginTop: "4px" }}>
                    Marquer comme résolue
                  </button>
                </li>
              );
            })}
          </ul>
          <button onClick={() => setAfficherAlertes(false)} style={boutonStyle}>Fermer</button>
        </div>
      )}
      {afficherFiltres && (
  <div style={panneauStyle}>
    <h3>Filtres</h3>
    <select value={filtreType} onChange={(e) => setFiltreType(e.target.value)} style={inputStyle}>
      <option value="">-- Tous les types --</option>
      {types.map((t) => (
        <option key={t.id} value={t.id}>{t.libelle}</option>
      ))}
    </select>
    <select value={filtreSite} onChange={(e) => setFiltreSite(e.target.value)} style={inputStyle}>
      <option value="">-- Tous les sites --</option>
      {sites.map((s) => (
        <option key={s.id} value={s.id}>{s.nom}</option>
      ))}
    </select>
    <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)} style={inputStyle}>
      <option value="">-- Tous les statuts --</option>
      <option value="disponible">Disponible</option>
      <option value="indisponible">Indisponible</option>
    </select>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "13px" }}>
      <input
        type="checkbox"
        checked={afficherUniquementSites}
        onChange={(e) => setAfficherUniquementSites(e.target.checked)}
      />
      Afficher uniquement les sites (masquer les équipements)
    </label>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "13px" }}>
      <input
        type="checkbox"
        checked={afficherCouvertureWifi}
        onChange={(e) => setAfficherCouvertureWifi(e.target.checked)}
      />
      Afficher la couverture Wi-Fi
    </label>
    <p style={{ fontSize: "12px", color: "#888" }}>
      {equipementsFiltres.length} équipement(s) affiché(s) sur {equipements.length}
    </p>
    <button
      onClick={() => { setFiltreType(""); setFiltreSite(""); setFiltreStatut(""); }}
      style={boutonStyle}
    >
      Réinitialiser
    </button>
    <button onClick={() => setAfficherFiltres(false)} style={boutonStyle}>Fermer</button>
  </div>
)}
      {afficherFormulaireScan && (
        <div style={panneauStyle}>
          <h3>Scanner une plage IP</h3>
          <p style={{ fontSize: "12px", color: "#555" }}>
            Si "IP fin" est vide, le scan couvre tout le /24 (1 à 254) à partir du préfixe de "IP début".
          </p>
          <form onSubmit={handleSubmitScan}>
            <select name="site_id" value={formScan.site_id} onChange={handleChangeScan} required style={inputStyle}>
              <option value="">-- Site --</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.nom}</option>
              ))}
            </select>
            <input name="ip_debut" placeholder="IP début (ex: 192.168.8.1)" value={formScan.ip_debut} onChange={handleChangeScan} required style={inputStyle} />
            <input name="ip_fin" placeholder="IP fin (optionnel)" value={formScan.ip_fin} onChange={handleChangeScan} style={inputStyle} />
            <button type="submit" style={boutonStyle} disabled={scanEnCours}>
              {scanEnCours ? "Scan en cours..." : "Lancer le scan"}
            </button>
            <button type="button" onClick={() => { setAfficherFormulaireScan(false); setResultatScan(null); }} style={boutonStyle}>
              Fermer
            </button>
          </form>
          {resultatScan && (
            <div style={{ marginTop: "10px", fontSize: "13px" }}>
              <p><strong>{resultatScan.adresses_trouvees.length}</strong> adresse(s) répondent au ping.</p>
              <p><strong>{resultatScan.equipements_crees.length}</strong> nouvel(aux) équipement(s) créé(s).</p>
              <p style={{ color: "#888" }}>{resultatScan.adresses_echec.length} adresse(s) sans réponse.</p>
            </div>
          )}
        </div>
      )}
      {afficherFormulaireLiaison && (
        <div style={panneauStyle}>
          <h3>Nouvelle liaison</h3>
          <p style={{ fontSize: "12px", color: "#555" }}>
            Choisis les deux équipements précis reliés par cette liaison.
          </p>
          <form onSubmit={handleSubmitLiaison}>
            <select name="equipement_source_id" value={formLiaison.equipement_source_id} onChange={handleChangeLiaison} required style={inputStyle}>
              <option value="">-- Équipement source --</option>
              {equipements.map((eq) => {
                const site = sites.find((s) => s.id === eq.site_id);
                return (
                  <option key={eq.id} value={eq.id}>
                    {eq.nom} ({site?.nom})
                  </option>
                );
              })}
            </select>
            <select name="equipement_destination_id" value={formLiaison.equipement_destination_id} onChange={handleChangeLiaison} required style={inputStyle}>
              <option value="">-- Équipement destination --</option>
              {equipements.map((eq) => {
                const site = sites.find((s) => s.id === eq.site_id);
                return (
                  <option key={eq.id} value={eq.id}>
                    {eq.nom} ({site?.nom})
                  </option>
                );
              })}
            </select>
            <input name="type_liaison" placeholder="Type de liaison (ex: fibre)" value={formLiaison.type_liaison} onChange={handleChangeLiaison} style={inputStyle} />
            <input name="description" placeholder="Description (optionnel)" value={formLiaison.description} onChange={handleChangeLiaison} style={inputStyle} />
            <button type="submit" style={boutonStyle}>Créer la liaison</button>
            <button type="button" onClick={() => setAfficherFormulaireLiaison(false)} style={boutonStyle}>Annuler</button>
          </form>
        </div>
      )}

      {afficherFormulaireSite && (
        <div style={panneauStyle}>
          <h3>Nouveau site</h3>
          <p style={{ fontSize: "12px", color: "#555" }}>
            La position est calculée automatiquement à partir du quartier/ville/pays.
          </p>
          <form onSubmit={handleSubmitSite}>
            <input name="nom" placeholder="Nom du site" value={formSite.nom} onChange={handleChangeSite} required style={inputStyle} />
            <input name="pays" placeholder="Pays" value={formSite.pays} onChange={handleChangeSite} required style={inputStyle} />
            <input name="ville" placeholder="Ville" value={formSite.ville} onChange={handleChangeSite} required style={inputStyle} />
            <input name="quartier" placeholder="Quartier (optionnel)" value={formSite.quartier} onChange={handleChangeSite} style={inputStyle} />
            <button type="submit" style={boutonStyle}>Créer le site</button>
            <button type="button" onClick={() => setAfficherFormulaireSite(false)} style={boutonStyle}>Annuler</button>
          </form>
        </div>
      )}

      {afficherFormulaireEquipement && (
        <div style={panneauStyle}>
          <h3>Nouvel équipement</h3>
          <p style={{ fontSize: "12px", color: "#555" }}>Site : {siteSelectionne?.nom}</p>
          <form onSubmit={handleSubmitEquipement}>
            <input name="nom" placeholder="Nom de l'équipement" value={formEquipement.nom} onChange={handleChangeEquipement} required style={inputStyle} />
            <input name="adresse_ip" placeholder="Adresse IP (optionnel)" value={formEquipement.adresse_ip} onChange={handleChangeEquipement} style={inputStyle} />
            <select name="type_id" value={formEquipement.type_id} onChange={handleChangeEquipement} style={inputStyle}>
              <option value="">-- Type d'équipement --</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>{t.libelle}</option>
              ))}
              <option value="__nouveau__">+ Nouveau type...</option>
            </select>
            {formEquipement.type_id === "__nouveau__" && (
              <input
                placeholder="Nom du nouveau type (ex: Switch)"
                value={nouveauType}
                onChange={(e) => setNouveauType(e.target.value)}
                style={inputStyle}
              />
            )}
            <select name="priorite" value={formEquipement.priorite || "normale"} onChange={handleChangeEquipement} style={inputStyle}>
              <option value="basse">Priorité basse</option>
              <option value="normale">Priorité normale</option>
              <option value="haute">Priorité haute</option>
              <option value="critique">Priorité critique</option>
            </select>
            <input name="portee_wifi_metres" type="number" placeholder="Portée Wi-Fi en mètres (optionnel)" value={formEquipement.portee_wifi_metres || ""} onChange={handleChangeEquipement} style={inputStyle} />
           <button type="submit" style={boutonStyle}>Créer l'équipement</button>
<button type="button" onClick={() => setAfficherFormulaireEquipement(false)} style={boutonStyle}>Annuler</button>
</form>
</div>
)}


      {afficherHistorique && (
        <div style={panneauStyle}>
          <h3>Historique — {equipementSelectionne?.nom}</h3>
          {historiqueEquipement.length === 0 && <p style={{ fontSize: "13px" }}>Aucun changement enregistré.</p>}
          <ul style={{ paddingLeft: "16px", fontSize: "13px", maxHeight: "300px", overflowY: "auto" }}>
            {historiqueEquipement.map((h) => (
              <li key={h.id} style={{ marginBottom: "8px" }}>
                {h.ancien_statut} → {h.nouveau_statut}
                <br />
                <span style={{ color: "#777" }}>{new Date(h.date_changement).toLocaleString()}</span>
              </li>
            ))}
          </ul>
          <button onClick={() => setAfficherHistorique(false)} style={boutonStyle}>Fermer</button>
        </div>
      )}

      {afficherModifSite && (
        <div style={panneauStyle}>
          <h3>Modifier le site</h3>
          <p style={{ fontSize: "12px", color: "#555" }}>
            La position sera recalculée automatiquement selon le quartier/ville/pays.
          </p>
          <form onSubmit={handleSubmitModifSite}>
            <input name="nom" placeholder="Nom du site" value={formModifSite.nom} onChange={handleChangeModifSite} required style={inputStyle} />
            <input name="pays" placeholder="Pays" value={formModifSite.pays} onChange={handleChangeModifSite} required style={inputStyle} />
            <input name="ville" placeholder="Ville" value={formModifSite.ville} onChange={handleChangeModifSite} required style={inputStyle} />
            <input name="quartier" placeholder="Quartier (optionnel)" value={formModifSite.quartier} onChange={handleChangeModifSite} style={inputStyle} />
            <button type="submit" style={boutonStyle}>Enregistrer</button>
            <button type="button" onClick={() => setAfficherModifSite(false)} style={boutonStyle}>Annuler</button>
          </form>
        </div>
      )}

      {afficherModifEquipement && (
        <div style={panneauStyle}>
          <h3>Modifier l'équipement</h3>
          <form onSubmit={handleSubmitModifEquipement}>
            <input name="nom" placeholder="Nom de l'équipement" value={formModifEquipement.nom} onChange={handleChangeModifEquipement} required style={inputStyle} />
            <input name="adresse_ip" placeholder="Adresse IP (optionnel)" value={formModifEquipement.adresse_ip} onChange={handleChangeModifEquipement} style={inputStyle} />
            <select name="type_id" value={formModifEquipement.type_id} onChange={handleChangeModifEquipement} style={inputStyle}>
              <option value="">-- Type d'équipement --</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>{t.libelle}</option>
              ))}
            </select>
            <select name="statut" value={formModifEquipement.statut} onChange={handleChangeModifEquipement} style={inputStyle}>
              <option value="disponible">Disponible</option>
              <option value="indisponible">Indisponible</option>
            </select>
            <select name="priorite" value={formModifEquipement.priorite || "normale"} onChange={handleChangeModifEquipement} style={inputStyle}>
              <option value="basse">Priorité basse</option>
              <option value="normale">Priorité normale</option>
              <option value="haute">Priorité haute</option>
              <option value="critique">Priorité critique</option>
            </select>
                        <input name="portee_wifi_metres" type="number" placeholder="Portée Wi-Fi en mètres (optionnel)" value={formModifEquipement.portee_wifi_metres || ""} onChange={handleChangeModifEquipement} style={inputStyle} />
            <button type="submit" style={boutonStyle}>Enregistrer</button>
            <button type="button" onClick={() => setAfficherModifEquipement(false)} style={boutonStyle}>Annuler</button>
          </form>
        </div>
      )}

      <div ref={mapWrapperRef} style={{ height: "100%", width: "100%" }}>
      <MapContainer center={centreDefaut} zoom={12} style={{ height: "100%", width: "100%" }}>
        <TileLayer
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  className="carte-amelioree"
/>
        <SelecteurPosition onSelect={handleMapClick} />
        <TraqueurZoom onZoomChange={setZoomActuel} />

        {sites
          .filter((site) => site.latitude && site.longitude)
          .map((site) => {
            const alertesSite = alertesDuSite(site.id);
            return (
              <Marker
                key={`site-${site.id}`}
                position={[site.latitude, site.longitude]}
                icon={creerIconeSite(alertesSite)}
              >
                <Popup>
                  <strong>{site.nom}</strong>
                  <br />
                  {site.quartier ? `${site.quartier}, ` : ""}
                  {site.ville}, {site.pays}
                  {alertesSite.length > 0 && (
                    <>
                      <br />
                      <span style={{ color: "#e74c3c", fontWeight: "bold" }}>
                        ⚠ {alertesSite.length} alerte{alertesSite.length > 1 ? "s" : ""} active{alertesSite.length > 1 ? "s" : ""}
                      </span>
                    </>
                  )}
                  <br />
                  <button onClick={() => ouvrirFormulaireEquipement(site)} style={{ marginTop: "8px", marginRight: "6px" }}>
                    + Ajouter un équipement
                  </button>
                  <button onClick={() => ouvrirModifSite(site)} style={{ marginTop: "8px" }}>
                    Modifier
                  </button>
                </Popup>
              </Marker>
            );
          })}

        {!afficherUniquementSites && sites
          .filter((site) => site.latitude && site.longitude)
          .map((site) => {
          const equipementsDuSite = equipementsFiltres.filter((eq) => eq.site_id === site.id);
            return equipementsDuSite.map((eq) => {
              const position = positionsEquipements[eq.id];
              if (!position) return null;
              const alertesEq = alertesDeLEquipement(eq.id);
              return (
                <Marker
                  key={`eq-${eq.id}`}
                  position={position}
                  icon={creerIconeEquipement(eq.statut, alertesEq, libelleDuType(eq.type_id), iconeDuType(eq.type_id))}
                >
                  <Popup>
                    <strong>{eq.nom}</strong>
                    <br />
                    Site : {site.nom}
                    <br />
                    Statut : {eq.statut}
                    <br />
                    {eq.adresse_ip && (
                      <>
                        IP : {eq.adresse_ip}
                        <br />
                      </>
                    )}
                    {alertesEq.length > 0 && (
                      <div style={{ marginTop: "6px" }}>
                        {alertesEq.map((a) => (
                          <div key={a.id} style={{ borderLeft: "3px solid #e74c3c", paddingLeft: "6px", marginBottom: "6px" }}>
                            <strong style={{ color: "#e74c3c" }}>{a.gravite}</strong> — {a.message}
                            <br />
                            <span style={{ fontSize: "12px", color: "#888" }}>
                              Serveur : {a.serveur_zabbix_nom || "Inconnu"}
                            </span>
                            <br />
                            <button onClick={() => resoudreAlerte(a.id)} style={{ marginTop: "4px" }}>
                              Résoudre
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                   <button onClick={() => lancerPing(eq)} style={{ marginTop: "8px", marginRight: "6px" }} disabled={pingEnCours === eq.id}>
  {pingEnCours === eq.id ? "Ping..." : "📶 Ping"}
</button>
{resultatPing[eq.id] && (
  <div style={{ marginTop: "6px", fontSize: "12px", background: "#f5f5f5", padding: "6px", borderRadius: "4px" }}>
    {resultatPing[eq.id].est_disponible ? (
      <>
        ✅ {resultatPing[eq.id].paquets_recus}/{resultatPing[eq.id].paquets_envoyes} paquets reçus
        <br />
        Latence moyenne : {resultatPing[eq.id].temps_moyen_ms?.toFixed(1)} ms
      </>
    ) : (
      <>❌ Aucune réponse ({resultatPing[eq.id].perte_pourcentage}% de perte)</>
    )}
  </div>
)}
                    <button onClick={() => toggleStatutEquipement(eq)} style={{ marginTop: "8px", marginRight: "6px" }}>
                      Basculer statut
                    </button>
                    <button onClick={() => supprimerEquipement(eq)} style={{ marginTop: "8px", marginRight: "6px", color: "red" }}>
                      Supprimer
                    </button>
                    <button onClick={() => voirHistorique(eq)} style={{ marginTop: "8px", marginRight: "6px" }}>
                      Historique
                    </button>
                    <button onClick={() => ouvrirModifEquipement(eq)} style={{ marginTop: "8px" }}>
                      Modifier
                    </button>
                  </Popup>
                </Marker>
              );
            });
          })}

               {afficherCouvertureWifi && !afficherUniquementSites && equipementsFiltres
          .filter((eq) => eq.portee_wifi_metres > 0)
          .map((eq) => {
            const position = positionsEquipements[eq.id];
            if (!position) return null;
            return (
              <Circle
                key={`wifi-${eq.id}`}
                center={position}
                radius={eq.portee_wifi_metres}
                pathOptions={{ color: "#3498db", fillColor: "#3498db", fillOpacity: 0.15, weight: 1 }}
                interactive={false}
              />
            );
          })}
        {liaisons.map((liaison) => {
          const eqSource = equipements.find((e) => e.id === liaison.equipement_source_id);
          const eqDestination = equipements.find((e) => e.id === liaison.equipement_destination_id);
          if (!eqSource || !eqDestination) return null;

          const siteSource = sites.find((s) => s.id === eqSource.site_id);
          const siteDestination = sites.find((s) => s.id === eqDestination.site_id);
          if (!siteSource?.latitude || !siteDestination?.latitude) return null;

           const modeEquipement = !afficherUniquementSites && zoomActuel >= SEUIL_ZOOM_EQUIPEMENT;
          const memeSite = siteSource.id === siteDestination.id;

          if (modeEquipement) {
            const posSource = positionsEquipements[eqSource.id];
            const posDestination = positionsEquipements[eqDestination.id];
            if (!posSource || !posDestination) return null;
            return (
              <div key={`liaison-eq-wrap-${liaison.id}`}>
                <Polyline
                  positions={[posSource, posDestination]}
                  pathOptions={{ color: "#000000", weight: 20, opacity: 0.01 }}
                >
                  <Popup>
                    Liaison : {eqSource.nom} ↔ {eqDestination.nom}
                    <br />
                    Type : {liaison.type_liaison}
                    <br />
                    <button onClick={() => supprimerLiaison(liaison)} style={{ marginTop: "6px", color: "red" }}>
                      Supprimer la liaison
                    </button>
                  </Popup>
                </Polyline>
                <Polyline
                  positions={[posSource, posDestination]}
                  pathOptions={{ color: "#000000", weight: 2, dashArray: "6 6" }}
                  interactive={false}
                />
              </div>
            );
          }

          if (memeSite) return null;

                 return (
            <div key={`liaison-site-wrap-${liaison.id}`}>
              <Polyline
                positions={[
                  [siteSource.latitude, siteSource.longitude],
                  [siteDestination.latitude, siteDestination.longitude],
                ]}
                pathOptions={{ color: "#000000", weight: 20, opacity: 0.01 }}
              >
                <Popup>
                  Liaison : {siteSource.nom} ↔ {siteDestination.nom}
                  <br />
                  Type : {liaison.type_liaison}
                  <br />
                  <button onClick={() => supprimerLiaison(liaison)} style={{ marginTop: "6px", color: "red" }}>
                    Supprimer la liaison
                  </button>
                </Popup>
              </Polyline>
              <Polyline
                positions={[
                  [siteSource.latitude, siteSource.longitude],
                  [siteDestination.latitude, siteDestination.longitude],
                ]}
                pathOptions={{ color: "#000000", weight: 2, dashArray: "6 6" }}
                interactive={false}
              />
            </div>
          );
        })}
          </MapContainer>
      </div>
    </div>
  );
}

const panneauStyle = {
  position: "absolute",
  top: 20,
  right: 20,
  zIndex: 1000,
  background: "white",
  padding: "20px",
  borderRadius: "8px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
  width: "280px",
};

const inputStyle = { width: "100%", marginBottom: "8px", padding: "6px" };
const boutonStyle = { width: "100%", padding: "8px", marginBottom: "6px" };

export default NetworkMap;
