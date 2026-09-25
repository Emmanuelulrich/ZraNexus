import { useEffect, useMemo } from "react";
import { Polyline, Popup, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { couleurLiaison, epaisseurLiaison, formeLiaison, courtLiaison } from "../utils/liaisonTypes";
import { pointsEclair, arcsOndes } from "../utils/symbolesLiaison";

// Symbole dessiné en pixels (Z du câble série, ondes du sans fil) : recalculé à chaque zoom
// pour garder une taille constante à l'écran.
function SymboleCarte({ a, b, type, couleur }) {
  const map = useMap();
  const forme = formeLiaison(type);

  useEffect(() => {
    if (forme !== "eclair" && forme !== "ondes") return undefined;
    let couche = null;

    const dessiner = () => {
      if (couche) couche.remove();
      const p1 = map.latLngToLayerPoint(a);
      const p2 = map.latLngToLayerPoint(b);
      const vers = (p) => map.layerPointToLatLng(L.point(p[0], p[1]));
      const A = [p1.x, p1.y];
      const B = [p2.x, p2.y];
      if (Math.hypot(B[0] - A[0], B[1] - A[1]) < 8) return;

      if (forme === "eclair") {
        couche = L.polyline(pointsEclair(A, B).map(vers), { color: couleur, weight: 3, interactive: false });
      } else {
        couche = L.polyline(arcsOndes(A, B).map((arc) => arc.map(vers)), { color: couleur, weight: 2, interactive: false });
      }
      couche.addTo(map);
    };

    dessiner();
    map.on("zoomend", dessiner);
    return () => {
      map.off("zoomend", dessiner);
      if (couche) couche.remove();
    };
  }, [map, a[0], a[1], b[0], b[1], forme, couleur]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

function iconePastille(texte, couleur) {
  return L.divIcon({
    className: "",
    iconSize: [0, 0],
    html: `<span style="position:absolute;left:0;top:0;transform:translate(-50%,-165%);white-space:nowrap;
      background:white;color:${couleur};border:1.5px solid ${couleur};border-radius:10px;padding:1px 7px;
      font:bold 11px sans-serif;box-shadow:0 1px 3px rgba(0,0,0,.3);pointer-events:none;">${texte}</span>`,
  });
}

// Une liaison sur la carte : trait (selon le type), pastille du type au milieu, fenêtre au clic.
export default function TraitLiaisonCarte({ a, b, type, horsService, children }) {
  const couleur = couleurLiaison(type, horsService);
  const epaisseur = epaisseurLiaison(type);
  const forme = formeLiaison(type);
  const milieu = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const texte = courtLiaison(type).replace(/[<>&"]/g, "");
  const icone = useMemo(() => iconePastille(texte, couleur), [texte, couleur]);
  const positions = [a, b];

  return (
    <>
      {/* zone cliquable large et invisible */}
      <Polyline positions={positions} pathOptions={{ color: "#000000", weight: 20, opacity: 0.01 }}>
        <Popup>{children}</Popup>
      </Polyline>

      {(forme === "trait" || forme === "fibre") && (
        <Polyline positions={positions} pathOptions={{ color: couleur, weight: epaisseur }} interactive={false} />
      )}
      {forme === "fibre" && (
        <Polyline positions={positions} pathOptions={{ color: "#ffffff", weight: 1.5, opacity: 0.9 }} interactive={false} />
      )}
      {forme === "inconnu" && (
        <Polyline positions={positions} pathOptions={{ color: couleur, weight: 2, dashArray: "6 6" }} interactive={false} />
      )}
      {(forme === "eclair" || forme === "ondes") && <SymboleCarte a={a} b={b} type={type} couleur={couleur} />}

      <Marker position={milieu} icon={icone} interactive={false} keyboard={false} />
    </>
  );
}
