// Icônes des équipements (mêmes règles que la carte) : icône personnalisée du type, sinon icône de sa catégorie.
const API_URL = import.meta.env.VITE_API_URL;

function normaliser(texte) {
  return (texte || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function categorieType(libelle) {
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
export const ICONES_PAR_CATEGORIE = {
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

export function urlIconeEquipement(typeLibelle, iconePersonnalisee) {
  if (iconePersonnalisee) return `${API_URL}${iconePersonnalisee}`;
  return ICONES_PAR_CATEGORIE[categorieType(typeLibelle)] || ICONES_PAR_CATEGORIE.defaut;
}
