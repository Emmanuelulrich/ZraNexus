import { useEffect, useState } from "react";
import api from "../services/api";

function JournalActivite() {
  const [entrees, setEntrees] = useState([]);
  const [erreur, setErreur] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const chargerJournal = async () => {
    try {
      const res = await api.get("/api/journal/", { headers });
      setEntrees(res.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setErreur("Accès réservé aux administrateurs.");
      } else {
        setErreur("Impossible de charger le journal.");
      }
    }
  };

  useEffect(() => {
    chargerJournal();
  }, []);

  const traduireAction = (methode, chemin) => {
  const regles = [
    { regex: /^\/auth\/login$/, label: "Connexion" },
    { regex: /^\/auth\/register$/, label: "Création de compte" },
    { regex: /^\/users\/me$/, label: "Consultation du profil" },

    { regex: /^\/api\/sites\/stats\/?$/, label: "Statistiques des sites" },
    { regex: /^\/api\/sites\/\d+\/plan\/?$/, label: "Upload du plan de site" },
    { regex: /^\/api\/sites\/\d+\/?$/, methode: "GET", label: "Consultation d'un site" },
    { regex: /^\/api\/sites\/\d+\/?$/, methode: "PUT", label: "Modification d'un site" },
    { regex: /^\/api\/sites\/\d+\/?$/, methode: "DELETE", label: "Suppression d'un site" },
    { regex: /^\/api\/sites\/?$/, methode: "GET", label: "Liste des sites" },
    { regex: /^\/api\/sites\/?$/, methode: "POST", label: "Création d'un site" },

    { regex: /^\/api\/type-equipements\/?$/, label: "Types d'équipements" },

    { regex: /^\/api\/equipements\/stats\/?$/, label: "Statistiques des équipements" },
    { regex: /^\/api\/equipements\/scan\/?$/, label: "Scan de plage IP" },
    { regex: /^\/api\/equipements\/\d+\/historique\/?$/, label: "Historique d'un équipement" },
    { regex: /^\/api\/equipements\/\d+\/ping\/?$/, label: "Ping d'un équipement" },
    { regex: /^\/api\/equipements\/\d+\/?$/, methode: "GET", label: "Consultation d'un équipement" },
    { regex: /^\/api\/equipements\/\d+\/?$/, methode: "PUT", label: "Modification d'un équipement" },
    { regex: /^\/api\/equipements\/\d+\/?$/, methode: "DELETE", label: "Suppression d'un équipement" },
    { regex: /^\/api\/equipements\/?$/, methode: "GET", label: "Liste des équipements" },
    { regex: /^\/api\/equipements\/?$/, methode: "POST", label: "Création d'un équipement" },

    { regex: /^\/api\/liaisons\/\d+\/?$/, methode: "DELETE", label: "Suppression d'une liaison" },
    { regex: /^\/api\/liaisons\/?$/, methode: "GET", label: "Liste des liaisons" },
    { regex: /^\/api\/liaisons\/?$/, methode: "POST", label: "Création d'une liaison" },

    { regex: /^\/api\/permissions\/?$/, label: "Gestion des permissions" },

    { regex: /^\/api\/alertes\/zabbix\/?$/, label: "Réception d'une alerte Zabbix" },
    { regex: /^\/api\/alertes\/\d+\/resoudre\/?$/, label: "Résolution d'une alerte" },
    { regex: /^\/api\/alertes\/?$/, label: "Liste des alertes" },

    { regex: /^\/api\/serveurs-zabbix\/?/, label: "Gestion des serveurs Zabbix" },
    { regex: /^\/api\/config-notifications\/?/, label: "Configuration des notifications" },
    { regex: /^\/api\/journal\/?$/, label: "Consultation du journal d'activité" },

    { regex: /^\/uploads\//, label: "Chargement d'un fichier (plan / icône)" },
  ];

  const regle = regles.find(
    (r) => r.regex.test(chemin) && (!r.methode || r.methode === methode)
  );

  return regle ? regle.label : `${methode} ${chemin}`;
};
  const couleurCode = (code) => {
    if (!code) return "#999";
    if (code >= 200 && code < 300) return "#2ecc71";
    if (code === 307 || code === 308) return "#95a5a6";
    if (code === 401 || code === 403) return "#e67e22";
    if (code >= 400) return "#e74c3c";
    return "#999";
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Journal d'activité</h2>
      <p style={{ fontSize: "13px", color: "#666" }}>
        Les 500 dernières actions effectuées sur l'application (connexions, requêtes API).
      </p>
      {erreur && <p style={{ color: "red" }}>{erreur}</p>}

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "16px", fontSize: "13px" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ccc", textAlign: "left" }}>
            <th style={{ padding: "8px" }}>Date</th>
            <th style={{ padding: "8px" }}>Utilisateur</th>
            
            <th style={{ padding: "8px" }}>Chemin</th>
            <th style={{ padding: "8px" }}>IP</th>
            <th style={{ padding: "8px" }}>Statut</th>
          </tr>
        </thead>
        <tbody>
          {entrees.map((e) => (
            <tr key={e.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "8px" }}>{new Date(e.date_creation).toLocaleString()}</td>
              <td style={{ padding: "8px" }}>{e.utilisateur_identifiant || "—"}</td>
              
              <td style={{ padding: "8px" }}>
  {traduireAction(e.methode, e.chemin)}
  <span style={{ color: "#777", fontSize: "11px", marginLeft: "6px" }}>
    ({e.methode})
  </span>
</td>
              <td style={{ padding: "8px" }}>{e.adresse_ip || "—"}</td>
              <td style={{ padding: "8px", color: couleurCode(e.code_statut), fontWeight: "bold" }}>
                {e.code_statut || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default JournalActivite;