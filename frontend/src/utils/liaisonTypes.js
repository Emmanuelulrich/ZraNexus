// Types de liaison réseau : libellé, catégorie, forme et style de trait.
// Doit rester cohérent avec TYPES_LIAISON dans backend/app/models/liaison_inter_site.py
//
// forme :
//   "trait"  trait plein                       (Ethernet, coaxial)
//   "fibre"  trait épais avec cœur blanc       (fibre optique)
//   "eclair" trait avec un Z (éclair) au milieu (câble série)
//   "ondes"  ondes ((( ))) le long de la liaison (sans fil)

export const TYPES_LIAISON = {
  ethernet:          { label: "Ethernet (cuivre)",       court: "ETH",     categorie: "filaire",  forme: "trait",  couleur: "#2c3e50", epaisseur: 3 },
  fibre_monomode:    { label: "Fibre optique monomode",  court: "FO mono", categorie: "filaire",  forme: "fibre",  couleur: "#e67e22", epaisseur: 5 },
  fibre_multimode:   { label: "Fibre optique multimode", court: "FO multi", categorie: "filaire", forme: "fibre",  couleur: "#f5b041", epaisseur: 5 },
  serie:             { label: "Câble série",             court: "SÉRIE",   categorie: "filaire",  forme: "eclair", couleur: "#8e44ad", epaisseur: 3 },
  coaxial:           { label: "Câble coaxial",           court: "COAX",    categorie: "filaire",  forme: "trait",  couleur: "#795548", epaisseur: 4 },
  wifi:              { label: "Wi-Fi",                   court: "Wi-Fi",   categorie: "sans_fil", forme: "ondes",  couleur: "#3498db", epaisseur: 2 },
  faisceau_hertzien: { label: "Faisceau hertzien",       court: "FH",      categorie: "sans_fil", forme: "ondes",  couleur: "#16a085", epaisseur: 2 },
  lte:               { label: "4G / LTE",                court: "4G/LTE",  categorie: "sans_fil", forme: "ondes",  couleur: "#27ae60", epaisseur: 2 },
  satellite:         { label: "Satellite",               court: "SAT",     categorie: "sans_fil", forme: "ondes",  couleur: "#7f8c8d", epaisseur: 2 },
};

export const COULEUR_LIAISON_HS = "#e74c3c";
export const COULEUR_LIAISON_INCONNUE = "#000000";

export const LIBELLE_CATEGORIE = { filaire: "Filaire", sans_fil: "Sans fil" };

export function libelleLiaison(type) {
  if (!type) return "Non précisé";
  return TYPES_LIAISON[type]?.label || type; // anciennes liaisons : texte libre conservé tel quel
}

// Texte court affiché dans la pastille posée sur la liaison
export function courtLiaison(type) {
  if (!type) return "?";
  if (TYPES_LIAISON[type]) return TYPES_LIAISON[type].court;
  return type.length > 10 ? type.slice(0, 9) + "…" : type;
}

export function categorieLiaison(type) {
  return TYPES_LIAISON[type]?.categorie || null;
}

export function formeLiaison(type) {
  return TYPES_LIAISON[type]?.forme || "inconnu";
}

// Rouge si un des deux équipements est indisponible, sinon couleur du type
export function couleurLiaison(type, horsService = false) {
  if (horsService) return COULEUR_LIAISON_HS;
  return TYPES_LIAISON[type]?.couleur || COULEUR_LIAISON_INCONNUE;
}

export function epaisseurLiaison(type) {
  return TYPES_LIAISON[type]?.epaisseur || 2;
}
