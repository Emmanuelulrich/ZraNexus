import { useState } from "react";
import { TYPES_LIAISON, LIBELLE_CATEGORIE } from "../utils/liaisonTypes";
import ApercuLiaison from "./TraceLiaison";

// Légende des types de liaison (repliable). `style` permet de la positionner.
export default function LegendeLiaisons({ style, ouverteParDefaut = false }) {
  const [ouverte, setOuverte] = useState(ouverteParDefaut);

  return (
    <div
      style={{
        position: "absolute",
        zIndex: 1000,
        background: "white",
        borderRadius: "6px",
        boxShadow: "0 1px 6px rgba(0,0,0,0.3)",
        fontSize: "12px",
        ...style,
      }}
    >
      <button
        onClick={() => setOuverte(!ouverte)}
        style={{ border: "none", background: "transparent", padding: "6px 10px", cursor: "pointer", fontWeight: "bold" }}
      >
        {ouverte ? "▾" : "▸"} Légende des liaisons
      </button>
      {ouverte && (
        <div style={{ padding: "0 10px 8px" }}>
          {["filaire", "sans_fil"].map((cat) => (
            <div key={cat} style={{ marginBottom: "4px" }}>
              <div style={{ color: "#777", margin: "4px 0 2px" }}>{LIBELLE_CATEGORIE[cat]}</div>
              {Object.entries(TYPES_LIAISON)
                .filter(([, t]) => t.categorie === cat)
                .map(([cle, t]) => (
                  <div key={cle} style={{ display: "flex", alignItems: "center", gap: "8px", margin: "2px 0" }}>
                    <ApercuLiaison type={cle} />
                    <span>{t.label}</span>
                  </div>
                ))}
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px", borderTop: "1px solid #eee", paddingTop: "6px" }}>
            <ApercuLiaison type="ethernet" horsService />
            <span>Un équipement relié est indisponible</span>
          </div>
        </div>
      )}
    </div>
  );
}
