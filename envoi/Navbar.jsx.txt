import { Link, useNavigate, useLocation } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

   const liens = [
    { to: "/", label: "Dashboard" },
    { to: "/carte", label: "Carte réseau" },
    { to: "/serveurs-zabbix", label: "Serveurs Zabbix" },
    { to: "/notifications", label: "Notifications" },
    { to: "/plan-site", label: "Plan de site" },
    { to: "/types-equipements", label: "Icônes des types" },
    { to: "/journal", label: "Journal d'activité" },
    { to: "/comptes", label: "Gestion des comptes" },
  ];
  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 24px",
        background: "linear-gradient(90deg, #0ea5e9, #38bdf8)",
        color: "white",
        boxShadow: "0 2px 10px rgba(14, 165, 233, 0.35)",
      }}
    >
      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
        <strong style={{ fontSize: "18px", marginRight: "16px", letterSpacing: "0.5px" }}>
          ZraNexus
        </strong>
        {liens.map((lien) => {
          const actif = location.pathname === lien.to;
          return (
            <Link
              key={lien.to}
              to={lien.to}
              style={{
                color: "white",
                textDecoration: "none",
                padding: "8px 14px",
                borderRadius: "20px",
                fontSize: "14px",
                fontWeight: actif ? "700" : "500",
                background: actif ? "rgba(255,255,255,0.25)" : "transparent",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!actif) e.currentTarget.style.background = "rgba(255,255,255,0.15)";
              }}
              onMouseLeave={(e) => {
                if (!actif) e.currentTarget.style.background = "transparent";
              }}
            >
              {lien.label}
            </Link>
          );
        })}
      </div>
      <button
        onClick={handleLogout}
        style={{
          padding: "8px 18px",
          background: "#ffffff",
          color: "#0369a1",
          border: "none",
          borderRadius: "20px",
          fontWeight: "bold",
          fontSize: "14px",
          cursor: "pointer",
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        }}
      >
        Déconnexion
      </button>
    </nav>
  );
}

export default Navbar;