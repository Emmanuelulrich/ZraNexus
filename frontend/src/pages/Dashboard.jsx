import { useEffect, useState } from "react";
import api from "../services/api";

function Dashboard() {
  const [statsSites, setStatsSites] = useState(null);
  const [statsEquipements, setStatsEquipements] = useState(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    const chargerStats = async () => {
      try {
        const [sitesRes, equipementsRes] = await Promise.all([
          api.get("/api/sites/stats", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/api/equipements/stats", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setStatsSites(sitesRes.data);
        setStatsEquipements(equipementsRes.data);
      } catch (err) {
        setErreur("Impossible de charger les statistiques.");
      }
    };

    chargerStats();
  }, []);

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ color: "#0c4a6e", fontSize: "32px", marginBottom: "4px" }}>
        ZraNexus - Dashboard
      </h1>
      <p style={{ color: "#64748b", marginBottom: "32px" }}>
        Bienvenue sur la plateforme de cartographie réseau.
      </p>

      {erreur && <p style={{ color: "#dc2626" }}>{erreur}</p>}

      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
        <div style={carteStyle}>
          <div style={enteteCarteStyle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <h3 style={titreCarteStyle}>Sites par ville</h3>
          </div>
          {statsSites ? (
            <ul style={listeStyle}>
              {statsSites.map((s, i) => (
                <li key={i} style={ligneStyle}>
                  <span>{s.pays} / {s.ville}</span>
                  <span style={badgeStyle}>{s.total}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "#94a3b8" }}>Chargement...</p>
          )}
        </div>

        <div style={carteStyle}>
          <div style={enteteCarteStyle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="14" width="8" height="7" rx="1" />
              <rect x="14" y="14" width="8" height="7" rx="1" />
              <rect x="8" y="3" width="8" height="7" rx="1" />
              <path d="M12 10v4M6 14v-2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
            </svg>
            <h3 style={titreCarteStyle}>Équipements par statut</h3>
          </div>
          {statsEquipements ? (
            <ul style={listeStyle}>
              {statsEquipements.par_statut.map((s, i) => (
                <li key={i} style={ligneStyle}>
                  <span style={{ textTransform: "capitalize" }}>{s.statut}</span>
                  <span
                    style={{
                      ...badgeStyle,
                      background: s.statut === "disponible" ? "#dcfce7" : "#fee2e2",
                      color: s.statut === "disponible" ? "#16a34a" : "#dc2626",
                    }}
                  >
                    {s.total}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "#94a3b8" }}>Chargement...</p>
          )}
        </div>

        <div style={carteStyle}>
          <div style={enteteCarteStyle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <h3 style={titreCarteStyle}>Équipements par type</h3>
          </div>
          {statsEquipements ? (
            <ul style={listeStyle}>
              {statsEquipements.par_type.map((t, i) => (
                <li key={i} style={ligneStyle}>
                  <span>{t.type}</span>
                  <span style={badgeStyle}>{t.total}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "#94a3b8" }}>Chargement...</p>
          )}
        </div>

        <div style={carteStyle}>
          <div style={enteteCarteStyle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9v.01M9 12v.01M9 15v.01M15 9v.01M15 12v.01M15 15v.01" />
            </svg>
            <h3 style={titreCarteStyle}>Équipements par site</h3>
          </div>
          {statsEquipements ? (
            <ul style={listeStyle}>
              {statsEquipements.par_site.map((s, i) => (
                <li key={i} style={ligneStyle}>
                  <span>{s.site}</span>
                  <span style={badgeStyle}>{s.total}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "#94a3b8" }}>Chargement...</p>
          )}
        </div>
      </div>
    </div>
  );
}

const carteStyle = {
  background: "#f1f5f9",
  borderRadius: "12px",
  padding: "24px",
  minWidth: "280px",
  flex: "1",
  border: "1px solid #e0f2fe",
  boxShadow: "0 4px 16px rgba(14, 165, 233, 0.12)",
};

const enteteCarteStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "16px",
  paddingBottom: "12px",
  borderBottom: "2px solid #e0f2fe",
};

const titreCarteStyle = {
  margin: 0,
  color: "#0c4a6e",
  fontSize: "17px",
};

const listeStyle = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const ligneStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  color: "#334155",
  fontSize: "14px",
};

const badgeStyle = {
  background: "#e0f2fe",
  color: "#0369a1",
  fontWeight: "bold",
  padding: "3px 10px",
  borderRadius: "12px",
  fontSize: "13px",
};

export default Dashboard;