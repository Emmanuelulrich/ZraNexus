import { useEffect, useState } from "react";
import api from "../services/api";

function TypesEquipements() {
  const [types, setTypes] = useState([]);
  const [fichiersChoisis, setFichiersChoisis] = useState({});
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const apiUrl = import.meta.env.VITE_API_URL;

  const chargerTypes = async () => {
    try {
      const res = await api.get("/api/type-equipements/", { headers });
      setTypes(res.data);
    } catch (err) {
      setErreur("Impossible de charger les types d'équipement.");
    }
  };

  useEffect(() => {
    chargerTypes();
  }, []);

  const handleChoixFichier = (typeId, fichier) => {
    setFichiersChoisis({ ...fichiersChoisis, [typeId]: fichier });
  };

  const uploaderIcone = async (typeId) => {
    const fichier = fichiersChoisis[typeId];
    if (!fichier) return;
    setErreur("");
    setMessage("");
    const formData = new FormData();
    formData.append("fichier", fichier);
    try {
      await api.post(`/api/type-equipements/${typeId}/icone`, formData, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      setMessage("Icône mise à jour avec succès.");
      chargerTypes();
    } catch (err) {
      if (err.response?.status === 403) {
        setErreur("Accès réservé aux administrateurs.");
      } else {
        setErreur("Erreur lors de l'upload de l'icône.");
      }
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Types d'équipement — Icônes</h2>
      <p style={{ fontSize: "13px", color: "#666" }}>
        Associe une icône personnalisée à un type d'équipement, utile quand la détection automatique ne trouve pas d'icône adaptée.
      </p>
      {erreur && <p style={{ color: "red" }}>{erreur}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "16px" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ccc", textAlign: "left" }}>
            <th style={{ padding: "8px" }}>Icône actuelle</th>
            <th style={{ padding: "8px" }}>Libellé</th>
            <th style={{ padding: "8px" }}>Nouveau fichier</th>
            <th style={{ padding: "8px" }}></th>
          </tr>
        </thead>
        <tbody>
          {types.map((t) => (
            <tr key={t.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "8px" }}>
                {t.icone ? (
                  <img
                    src={`${apiUrl}${t.icone}`}
                    alt={t.libelle}
                    style={{ width: "32px", height: "32px", objectFit: "contain" }}
                  />
                ) : (
                  <span style={{ color: "#999", fontSize: "12px" }}>Aucune icône</span>
                )}
              </td>
              <td style={{ padding: "8px" }}>{t.libelle}</td>
              <td style={{ padding: "8px" }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleChoixFichier(t.id, e.target.files[0])}
                />
              </td>
              <td style={{ padding: "8px" }}>
                <button onClick={() => uploaderIcone(t.id)}>Uploader</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TypesEquipements;