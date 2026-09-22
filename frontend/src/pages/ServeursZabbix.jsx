import { useEffect, useState } from "react";
import api from "../services/api";

function ServeursZabbix() {
  const [serveurs, setServeurs] = useState([]);
  const [erreur, setErreur] = useState("");
  const [accesRefuse, setAccesRefuse] = useState(false);
  const [form, setForm] = useState({ nom: "", adresse_ip: "", description: "" });

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const chargerServeurs = async () => {
    try {
      const res = await api.get("/api/serveurs-zabbix/", { headers });
      setServeurs(res.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setAccesRefuse(true);
      } else {
        setErreur("Impossible de charger les serveurs Zabbix.");
      }
    }
  };

  useEffect(() => {
    chargerServeurs();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/serveurs-zabbix/", form, { headers });
      setForm({ nom: "", adresse_ip: "", description: "" });
      chargerServeurs();
    } catch (err) {
      setErreur(err.response?.data?.detail || "Erreur lors de la création du serveur.");
    }
  };

  const supprimerServeur = async (id) => {
    if (!window.confirm("Supprimer ce serveur Zabbix ?")) return;
    try {
      await api.delete(`/api/serveurs-zabbix/${id}`, { headers });
      chargerServeurs();
    } catch (err) {
      setErreur("Erreur lors de la suppression.");
    }
  };

  if (accesRefuse) {
    return (
      <div style={{ padding: "24px" }}>
        <p style={{ color: "red" }}>Accès réservé aux administrateurs.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "700px" }}>
      <h2>Serveurs Zabbix</h2>
      <p style={{ fontSize: "13px", color: "#555" }}>
        Seules les adresses IP listées ici sont autorisées à envoyer des alertes via le webhook.
      </p>

      {erreur && <p style={{ color: "red" }}>{erreur}</p>}

      <form onSubmit={handleSubmit} style={{ marginBottom: "24px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <input
          name="nom"
          placeholder="Nom du serveur"
          value={form.nom}
          onChange={handleChange}
          required
          style={inputStyle}
        />
        <input
          name="adresse_ip"
          placeholder="Adresse IP"
          value={form.adresse_ip}
          onChange={handleChange}
          required
          style={inputStyle}
        />
        <input
          name="description"
          placeholder="Description (optionnel)"
          value={form.description}
          onChange={handleChange}
          style={inputStyle}
        />
        <button type="submit" style={boutonStyle}>Ajouter</button>
      </form>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
            <th style={thStyle}>Nom</th>
            <th style={thStyle}>Adresse IP</th>
            <th style={thStyle}>Description</th>
            <th style={thStyle}></th>
          </tr>
        </thead>
        <tbody>
          {serveurs.map((s) => (
            <tr key={s.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={tdStyle}>{s.nom}</td>
              <td style={tdStyle}>{s.adresse_ip}</td>
              <td style={tdStyle}>{s.description || "—"}</td>
              <td style={tdStyle}>
                <button onClick={() => supprimerServeur(s.id)} style={{ color: "red" }}>
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
          {serveurs.length === 0 && (
            <tr>
              <td colSpan={4} style={{ ...tdStyle, textAlign: "center", color: "#777" }}>
                Aucun serveur Zabbix configuré.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const inputStyle = { padding: "6px", flex: "1 1 150px" };
const boutonStyle = { padding: "6px 14px" };
const thStyle = { padding: "8px" };
const tdStyle = { padding: "8px" };

export default ServeursZabbix;