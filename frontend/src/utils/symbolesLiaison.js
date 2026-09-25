// Géométrie des symboles de liaison, en coordonnées écran (pixels).
// Utilisée par la carte (Leaflet), la page Topologie (SVG) et la légende.

function repere(p1, p2) {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const longueur = Math.hypot(dx, dy) || 1;
  const d = [dx / longueur, dy / longueur];
  const n = [-d[1], d[0]];
  return { d, n, longueur };
}

// Trait avec un Z (éclair) au milieu : p1 → début du Z → Z → fin du Z → p2
export function pointsEclair(p1, p2, taille = 48, amplitude = 13) {
  const { d, n, longueur } = repere(p1, p2);
  const m = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
  const L = Math.min(taille, longueur * 0.7);
  const A = Math.min(amplitude, L / 2);
  const pt = (u, v) => [m[0] + d[0] * u + n[0] * v, m[1] + d[1] * u + n[1] * v];
  return [p1, pt(-L / 2, 0), pt(-L / 6, -A), pt(L / 6, A), pt(L / 2, 0), p2];
}

// Ondes ((( ))) régulièrement espacées le long de la liaison : liste de petits arcs ")" (chaque arc = liste de points)
export function arcsOndes(p1, p2, { espacement = 13, rayon = 6, marge = 12, segments = 6, max = 80 } = {}) {
  const { d, n, longueur } = repere(p1, p2);
  const utile = longueur - 2 * marge;
  const nombre = utile <= 0 ? 1 : Math.min(max, Math.floor(utile / espacement) + 1);
  const debut = utile <= 0 ? longueur / 2 : marge + (utile - (nombre - 1) * espacement) / 2;
  const arcs = [];
  for (let k = 0; k < nombre; k++) {
    const u = debut + k * espacement;
    const c = [p1[0] + d[0] * u, p1[1] + d[1] * u];
    const arc = [];
    for (let i = 0; i <= segments; i++) {
      const theta = ((-65 + (130 * i) / segments) * Math.PI) / 180;
      const a = rayon * (Math.cos(theta) - 0.6);
      const b = rayon * 1.25 * Math.sin(theta);
      arc.push([c[0] + d[0] * a + n[0] * b, c[1] + d[1] * a + n[1] * b]);
    }
    arcs.push(arc);
  }
  return arcs;
}

// Chaîne SVG "M x y L x y ..." pour une liste de points
export function cheminSvg(points) {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
}

export function cheminSvgArcs(arcs) {
  return arcs.map(cheminSvg).join(" ");
}
