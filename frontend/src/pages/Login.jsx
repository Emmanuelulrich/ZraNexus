import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");

    try {
      const formData = new URLSearchParams();
      formData.append("username", identifiant);
      formData.append("password", motDePasse);

      const response = await api.post("/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      localStorage.setItem("token", response.data.access_token);
      navigate("/");
    } catch (err) {
      setErreur("Identifiant ou mot de passe incorrect.");
    }
  };

  return (
    <div style={{ maxWidth: "320px", margin: "100px auto", fontFamily: "sans-serif" }}>
      <h2>Connexion à ZraNexus</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <label>Identifiant</label>
          <input
            type="text"
            value={identifiant}
            onChange={(e) => setIdentifiant(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
            required
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Mot de passe</label>
          <input
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
            required
          />
        </div>
        {erreur && <p style={{ color: "red" }}>{erreur}</p>}
        <button type="submit" style={{ width: "100%", padding: "10px" }}>
          Se connecter
        </button>
      </form>
    </div>
  );
}

export default Login;