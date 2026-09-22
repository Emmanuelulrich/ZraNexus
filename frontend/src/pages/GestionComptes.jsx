import { useEffect, useState } from "react";
import api from "../services/api";

function GestionComptes() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [sites, setSites] = useState([]);
  const [erreur, setErreur] = useState("");
  const [accesRefuse, setAccesRefuse] = useState(false);

  const [form, setForm] = useState({ identifiant: "", mot_de_passe: "", role: "delegue", site_ids: [] });

  const [utilisateurEnModification, setUtilisateurEnModification] = useState(null);
  const [formModif, setFormModif] = useState({ identifiant: "", mot_de_passe: "" });

  const [utilisateurEnPermissions, setUtilisateurEnPermissions] = useState(null);
  const [siteIdsSelectionnes, setSiteIdsSelectionnes] = useState([]);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const chargerDonnees = async () => {
    try {
      const [usersRes, sitesRes] = await Promise.all([
        api.get("/users/", { headers }),
        api.get("/api/sites", { headers }),
      ]);
      setUtilisateurs(usersRes.data);
      setSites(sitesRes.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setAccesRefuse(true);
      } else {
        setErreur("Impossible de charger les comptes.");
      }
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleSiteCreation = (siteId) => {
    setForm((prev) => ({
      ...prev,
      site_ids: prev.site_ids.includes(siteId)
        ? prev.site_ids.filter((id) => id !== siteId)
        : [...prev.site_ids, siteId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/users/", form, { headers });
      setForm({ identifiant: "", mot_de_passe: "", role: "delegue", site_ids: [] });
      chargerDonnees();
    } catch (err) {
      setErreur(err.response?.data?.detail || "Erreur lors de la création du compte.");
    }
  };

  const supprimerUtilisateur = async (id) => {
    if (!window.confirm("Supprimer ce compte ?")) return;
    try {
      await api.delete(`/users/${id}`, { headers });
      chargerDonnees();
    } catch (err) {
      setErreur(err.response?.data?.detail || "Erreur lors de la suppression.");
    }
  };

  const ouvrirModification = (utilisateur) => {
    setUtilisateurEnModification(utilisateur);
    setFormModif({ identifiant: utilisateur.identifiant, mot_de_passe: "" });
  };

  const handleChangeModif = (e) => {
    setFormModif({ ...formModif, [e.target.name]: e.target.value });
  };

  const handleSubmitModif = async (e) => {
    e.preventDefault();
    try {
      const payload = { identifiant: formModif.identifiant };
      if (formModif.mot_de_passe) payload.mot_de_passe = formModif.mot_de_passe;
      await api.put(`/users/${utilisateurEnModification.id}`, payload, { headers });
      setUtilisateurEnModification(null);
      chargerDonnees();
    } catch (err) {
      setErreur(err.response?.data?.detail || "Erreur lors de la modification.");
    }
  };

  const ouvrirPermissions = (utilisateur) => {
    setUtilisateurEnPermissions(utilisateur);
    setSiteIdsSelectionnes(utilisateur.site_ids || []);
  };

  const toggleSitePermission = (siteId) => {
    setSiteIdsSelectionnes((prev) =>
      prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]
    );
  };

  const enregistrerPermissions = async () => {
    try {
      await api.put(`/users/${utilisateurEnPermissions.id}/permissions`, siteIdsSelectionnes, { headers });
      setUtilisateurEnPermissions(null);
      chargerDonnees();
    } catch (err) {
      setErreur("Erreur lors de la mise à jour des permissions.");
    }
  };

  const nomsDesSites = (siteIds) =>
    siteIds.length === 0
      ? "—"
      : siteIds.map((id) => sites.find((s) => s.id === id)?.nom || `#${id}`).join(", ");

  if (accesRefuse) {
    return (
      <div style={{ padding: "24px" }}>
        <p style={{ color: "red" }}>Accès réservé aux administrateurs.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "800px" }}>
      <h2>Gestion des comptes</h2>
      {erreur && <p style={{ color: "red" }}>{erreur}</p>}

      <h3>Créer un sous-compte</h3>
      <form onSubmit={handleSubmit} style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
          <input
            name="identifiant"
            placeholder="Identifiant"
            value={form.identifiant}
            onChange={handleChange}
            required
            style={inputStyle}
          />
          <input
            name="mot_de_passe"
            type="password"
            placeholder="Mot de passe"
            value={form.mot_de_passe}
            onChange={handleChange}
            required
            style={inputStyle}
          />
          <select name="role" value={form.role} onChange={handleChange} style={inputStyle}>
            <option value="delegue">Délégué</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>

        <p style={{ fontSize: "13px", color: "#555", marginBottom: "6px" }}>Sites autorisés :</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
          {sites.map((s) => (
            <label key={s.id} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}>
              <input
                type="checkbox"
                checked={form.site_ids.includes(s.id)}
                onChange={() => toggleSiteCreation(s.id)}
              />
              {s.nom}
            </label>
          ))}
        </div>

        <button type="submit" style={boutonStyle}>Créer le compte</button>
      </form>

      <h3>Comptes existants</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
            <th style={thStyle}>Identifiant</th>
            <th style={thStyle}>Rôle</th>
            <th style={thStyle}>Sites autorisés</th>
            <th style={thStyle}></th>
          </tr>
        </thead>
        <tbody>
          {utilisateurs.map((u) => (
            <tr key={u.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={tdStyle}>{u.identifiant}</td>
              <td style={tdStyle}>{u.role}</td>
              <td style={tdStyle}>{nomsDesSites(u.site_ids || [])}</td>
              <td style={tdStyle}>
                <button onClick={() => ouvrirModification(u)} style={{ marginRight: "6px" }}>
                  Modifier identifiants
                </button>
                <button onClick={() => ouvrirPermissions(u)} style={{ marginRight: "6px" }}>
                  Permissions
                </button>
                <button onClick={() => supprimerUtilisateur(u.id)} style={{ color: "red" }}>
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {utilisateurEnModification && (
        <div style={panneauStyle}>
          <h3>Modifier — {utilisateurEnModification.identifiant}</h3>
          <form onSubmit={handleSubmitModif}>
            <input
              name="identifiant"
              placeholder="Identifiant"
              value={formModif.identifiant}
              onChange={handleChangeModif}
              required
              style={inputStyle}
            />
            <input
              name="mot_de_passe"
              type="password"
              placeholder="Nouveau mot de passe (laisser vide pour ne pas changer)"
              value={formModif.mot_de_passe}
              onChange={handleChangeModif}
              style={inputStyle}
            />
            <button type="submit" style={boutonStyle}>Enregistrer</button>
            <button type="button" onClick={() => setUtilisateurEnModification(null)} style={boutonStyle}>
              Annuler
            </button>
          </form>
        </div>
      )}

      {utilisateurEnPermissions && (
        <div style={panneauStyle}>
          <h3>Permissions — {utilisateurEnPermissions.identifiant}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
            {sites.map((s) => (
              <label key={s.id} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                <input
                  type="checkbox"
                  checked={siteIdsSelectionnes.includes(s.id)}
                  onChange={() => toggleSitePermission(s.id)}
                />
                {s.nom}
              </label>
            ))}
          </div>
          <button onClick={enregistrerPermissions} style={boutonStyle}>Enregistrer</button>
          <button onClick={() => setUtilisateurEnPermissions(null)} style={boutonStyle}>Annuler</button>
        </div>
      )}
    </div>
  );
}

const inputStyle = { padding: "6px", flex: "1 1 150px", marginBottom: "6px" };
const boutonStyle = { padding: "6px 14px", marginRight: "6px" };
const thStyle = { padding: "8px" };
const tdStyle = { padding: "8px" };
const panneauStyle = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  background: "white",
  padding: "20px",
  borderRadius: "8px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
  width: "320px",
  zIndex: 1000,
};

export default GestionComptes;