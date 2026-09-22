import { useEffect, useState } from "react";
import api from "../services/api";

function ConfigNotifications() {
  const [config, setConfig] = useState(null);
  const [erreur, setErreur] = useState("");
  const [accesRefuse, setAccesRefuse] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [messageSucces, setMessageSucces] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const chargerConfig = async () => {
    try {
      const res = await api.get("/api/config/notifications/", { headers });
      setConfig(res.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setAccesRefuse(true);
      } else {
        setErreur("Impossible de charger la configuration.");
      }
    }
  };

  useEffect(() => {
    chargerConfig();
  }, []);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setConfig({ ...config, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnregistrement(true);
    setMessageSucces("");
    try {
      const donnees = {
        active: config.active,
        destinataires: config.destinataires,
        gravite_indisponibilite: config.gravite_indisponibilite,
        seuil_priorite_basse: parseInt(config.seuil_priorite_basse),
        seuil_priorite_normale: parseInt(config.seuil_priorite_normale),
        seuil_priorite_haute: parseInt(config.seuil_priorite_haute),
        seuil_priorite_critique: parseInt(config.seuil_priorite_critique),
        seuil_site: parseInt(config.seuil_site),
      };
      const res = await api.put("/api/config/notifications/", donnees, { headers });
      setConfig(res.data);
      setMessageSucces("Configuration enregistrée avec succès.");
    } catch (err) {
      setErreur("Erreur lors de l'enregistrement.");
    } finally {
      setEnregistrement(false);
    }
  };

  if (accesRefuse) {
    return <div style={{ padding: "20px" }}>Accès réservé aux administrateurs.</div>;
  }

  if (!config) {
    return <div style={{ padding: "20px" }}>Chargement...</div>;
  }

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <h2>Configuration des notifications e-mail</h2>
      <p style={{ fontSize: "13px", color: "#555" }}>
        Le seuil détermine à partir de quel niveau de gravité (1 = information, 5 = catastrophe)
        un e-mail est envoyé. Plus la priorité de l'équipement est haute, plus le seuil peut être bas.
      </p>

      {erreur && <p style={{ color: "red" }}>{erreur}</p>}
      {messageSucces && <p style={{ color: "green" }}>{messageSucces}</p>}

      <form onSubmit={handleSubmit}>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <input type="checkbox" name="active" checked={config.active} onChange={handleChange} />
          Notifications actives
        </label>

        <label>Destinataires (e-mails séparés par des virgules)</label>
        <input
          name="destinataires"
          value={config.destinataires}
          onChange={handleChange}
          placeholder="admin@exemple.com, autre@exemple.com"
          style={{ width: "100%", padding: "8px", marginBottom: "12px" }}
        />

        <label>Gravité attribuée à un équipement qui passe indisponible</label>
        <select name="gravite_indisponibilite" value={config.gravite_indisponibilite} onChange={handleChange} style={{ width: "100%", padding: "8px", marginBottom: "16px" }}>
          <option value="information">Information (1)</option>
          <option value="avertissement">Avertissement (2)</option>
          <option value="moyenne">Moyenne (3)</option>
          <option value="elevee">Élevée (4)</option>
          <option value="catastrophe">Catastrophe (5)</option>
        </select>

        <h4>Seuils minimum de gravité par priorité d'équipement</h4>
        <p style={{ fontSize: "12px", color: "#888" }}>Une valeur plus basse = plus d'e-mails envoyés pour cette priorité.</p>

        {[
          ["seuil_priorite_basse", "Priorité basse"],
          ["seuil_priorite_normale", "Priorité normale"],
          ["seuil_priorite_haute", "Priorité haute"],
          ["seuil_priorite_critique", "Priorité critique"],
          ["seuil_site", "Alertes sur un site (sans équipement précis)"],
        ].map(([champ, label]) => (
          <div key={champ} style={{ marginBottom: "10px" }}>
            <label>{label}</label>
            <select name={champ} value={config[champ]} onChange={handleChange} style={{ width: "100%", padding: "8px" }}>
              <option value={1}>1 — Information et plus</option>
              <option value={2}>2 — Avertissement et plus</option>
              <option value={3}>3 — Moyenne et plus</option>
              <option value={4}>4 — Élevée et plus</option>
              <option value={5}>5 — Catastrophe uniquement</option>
            </select>
          </div>
        ))}

        <button type="submit" disabled={enregistrement} style={{ width: "100%", padding: "10px", marginTop: "10px" }}>
          {enregistrement ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}

export default ConfigNotifications;