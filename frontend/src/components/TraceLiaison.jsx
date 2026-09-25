import { couleurLiaison, epaisseurLiaison, formeLiaison } from "../utils/liaisonTypes";
import { pointsEclair, arcsOndes, cheminSvg, cheminSvgArcs } from "../utils/symbolesLiaison";

// Dessin SVG d'une liaison entre deux points (p1, p2 en pixels) selon son type :
// trait plein (Ethernet, coaxial), fibre (trait épais + cœur blanc), série (Z), sans fil (ondes).
// À placer dans un <svg> ou un <g>. `echelle` réduit le dessin (légende).
export function TraceLiaison({ p1, p2, type, horsService = false, echelle = 1 }) {
  const couleur = couleurLiaison(type, horsService);
  const epaisseur = epaisseurLiaison(type);
  const forme = formeLiaison(type);
  const commun = { fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };

  if (forme === "ondes") {
    const arcs = arcsOndes(p1, p2, { espacement: 13 * echelle, rayon: 6 * echelle, marge: 12 * echelle });
    return <path d={cheminSvgArcs(arcs)} stroke={couleur} strokeWidth={2 * Math.max(echelle, 0.75)} {...commun} />;
  }
  if (forme === "eclair") {
    return <path d={cheminSvg(pointsEclair(p1, p2, 48 * echelle, 13 * echelle))} stroke={couleur} strokeWidth={epaisseur} {...commun} />;
  }
  if (forme === "fibre") {
    const d = cheminSvg([p1, p2]);
    return (
      <>
        <path d={d} stroke={couleur} strokeWidth={epaisseur} {...commun} />
        <path d={d} stroke="white" strokeWidth={1.5} strokeOpacity={0.9} {...commun} />
      </>
    );
  }
  if (forme === "trait") {
    return <path d={cheminSvg([p1, p2])} stroke={couleur} strokeWidth={epaisseur} {...commun} />;
  }
  // type inconnu (ancienne liaison en texte libre)
  return <path d={cheminSvg([p1, p2])} stroke={couleur} strokeWidth={2} strokeDasharray="6 6" fill="none" />;
}

// Petit aperçu pour la légende
export default function ApercuLiaison({ type, horsService = false, largeur = 50, hauteur = 18 }) {
  return (
    <svg width={largeur} height={hauteur} style={{ flexShrink: 0 }}>
      <TraceLiaison p1={[2, hauteur / 2]} p2={[largeur - 2, hauteur / 2]} type={type} horsService={horsService} echelle={0.7} />
    </svg>
  );
}
