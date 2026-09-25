import { useEffect, useState } from "react";
import api from "../services/api";

function messageApi(err, defaut) {
  const detail = err?.response?.data?.detail;
  return typeof detail === "string" ? detail : defaut;
}

function ServeursZabbix() {
  const [serveurs, setServeurs] = useState([]);
  const [sites, setSites] = useState([]);
  const [equipements, setEquipements] = useState([]);
  const [erreur, setErreur] = useState("");
  const [accesRefuse, setAccesRefuse] = useState(false);
  const [form, setForm] = useState({ nom: "", adresse_ip: "", adresse_mac: "", site_id: "", description: "" });

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const charger = async () => {
    try {
      const [serveursRes, sitesRes, equipementsRes] = await Promise.all([
        api.get("/api/serveurs-zabbix/", { headers }),
        api.get("/api/sites", { headers }),
        api.get("/api/equipements", { headers }),
      ]);
      setServeurs(serveursRes.data);
      setSites(sitesRes.data);
      setEquipements(equipementsRes.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setAccesRefuse(true);
      } else {
        setErreur("Impossible de charger les serveurs Zabbix.");
      }
    }
  };

  useEffect(() => {
    charger();
    // Le statut est rafraîchi automatiquement toutes les 30 secondes
    const minuteur = setInterval(charger, 30000);
    return () => clearInterval(minuteur);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(
        "/api/serveurs-zabbix/",
        {
          nom: form.nom,
          adresse_ip: form.adresse_ip.trim(),
          adresse_mac: form.adresse_mac.trim() || null,
          site_id: parseInt(form.site_id),
          description: form.description || null,
        },
        { headers }
      );
      setErreur("");
      setForm({ nom: "", adresse_ip: "", adresse_mac: "", site_id: "", description: "" });
      charger();
    } catch (err) {
      setErreur(messageApi(err, "Erreur lors de la création du serveur."));
    }
  };

  const supprimerServeur = async (id) => {
    if (!window.confirm("Supprimer ce serveur Zabbix (il disparaîtra aussi de la carte) ?")) return;
    try {
      await api.delete(`/api/serveurs-zabbix/${id}`, { headers });
      charger();
    } catch (err) {
      setErreur("Erreur lors de la suppression.");
    }
  };

  const placerSurCarte = async (serveur, siteId) => {
    if (!siteId) return;
    try {
      await api.put(`/api/serveurs-zabbix/${serveur.id}`, { site_id: parseInt(siteId) }, { headers });
      setErreur("");
      charger();
    } catch (err) {
      setErreur(messageApi(err, "Erreur lors du placement sur la carte."));
    }
  };

  const changerMac = async (serveur) => {
    const saisie = window.prompt("Adresse MAC (AA:BB:CC:DD:EE:FF) :", serveur.adresse_mac || "");
    if (saisie === null) return;
    try {
      await api.put(
        `/api/serveurs-zabbix/${serveur.id}`,
        { adresse_mac: saisie.trim() || null },
        { headers }
      );
      setErreur("");
      charger();
    } catch (err) {
      setErreur(messageApi(err, "Erreur lors de la modification de l'adresse MAC."));
    }
  };

  const nomDuSite = (siteId) => {
    const site = sites.find((s) => s.id === siteId);
    return site ? site.nom : null;
  };

  const statutDuServeur = (serveur) => {
    const equipement = equipements.find((eq) => eq.id === serveur.equipement_id);
    return equipement ? equipement.statut : null;
  };

  if (accesRefuse) {
    return (
      <div style={{ padding: "24px" }}>
        <p style={{ color: "red" }}>Accès réservé aux administrateurs.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1000px" }}>
      <h2>Serveurs Zabbix</h2>
      <p style={{ fontSize: "13px", color: "#555" }}>
        Seules les adresses IP listées ici sont autorisées à envoyer des alertes via le webhook.
        Chaque serveur ajouté apparaît aussi sur la carte réseau, sur le site choisi, avec son statut (déterminé par ping).
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
          name="adresse_mac"
          placeholder="Adresse MAC (optionnel)"
          value={form.adresse_mac}
          onChange={handleChange}
          style={inputStyle}
        />
        <select name="site_id" value={form.site_id} onChange={handleChange} required style={inputStyle}>
          <option value="">-- Site où se trouve le serveur --</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>{s.nom}</option>
          ))}
        </select>
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
            <th style={thStyle}>Adresse MAC</th>
            <th style={thStyle}>Site</th>
            <th style={thStyle}>Statut</th>
            <th style={thStyle}>Description</th>
            <th style={thStyle}></th>
          </tr>
        </thead>
        <tbody>
          {serveurs.map((s) => {
            const statut = statutDuServeur(s);
            const sitePlace = s.equipement_id && nomDuSite(s.site_id);
            return (
              <tr key={s.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={tdStyle}>{s.nom}</td>
                <td style={tdStyle}>{s.adresse_ip}</td>
                <td style={tdStyle}>
                  {s.adresse_mac || "—"}{" "}
                  <button onClick={() => changerMac(s)} style={{ fontSize: "11px" }}>Modifier</button>
                </td>
                <td style={tdStyle}>
                  {sitePlace ? (
                    sitePlace
                  ) : (
                    <select defaultValue="" onChange={(e) => placerSurCarte(s, e.target.value)} style={{ padding: "4px" }}>
                      <option value="">Placer sur la carte...</option>
                      {sites.map((site) => (
                        <option key={site.id} value={site.id}>{site.nom}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td style={tdStyle}>
                  {statut ? (
                    <span
                      style={{
                        padding: "2px 10px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        background: statut === "disponible" ? "#dcfce7" : "#fee2e2",
                        color: statut === "disponible" ? "#16a34a" : "#dc2626",
                      }}
                    >
                      {statut}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td style={tdStyle}>{s.description || "—"}</td>
                <td style={tdStyle}>
                  <button onClick={() => supprimerServeur(s.id)} style={{ color: "red" }}>
                    Supprimer
                  </button>
                </td>
              </tr>
            );
          })}
          {serveurs.length === 0 && (
            <tr>
              <td colSpan={7} style={{ ...tdStyle, textAlign: "center", color: "#777" }}>
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
