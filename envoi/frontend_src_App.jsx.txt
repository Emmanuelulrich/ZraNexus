import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import NetworkMap from "./pages/NetworkMap";
import Login from "./pages/Login";
import ServeursZabbix from "./pages/ServeursZabbix";
import ConfigNotifications from "./pages/ConfigNotifications";
import PlanSite from "./pages/PlanSite";
import ProtectedRoute from "./components/ProtectedRoute";
import TypesEquipements from "./pages/TypesEquipements";
import JournalActivite from "./pages/JournalActivite";
import GestionComptes from "./pages/GestionComptes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/carte"
          element={
            <ProtectedRoute>
              <NetworkMap />
            </ProtectedRoute>
          }
        />
        <Route
          path="/serveurs-zabbix"
          element={
            <ProtectedRoute>
              <ServeursZabbix />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <ConfigNotifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plan-site"
          element={
            <ProtectedRoute>
              <PlanSite />
            </ProtectedRoute>
          }
        />
        <Route
          path="/types-equipements"
          element={
            <ProtectedRoute>
              <TypesEquipements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/journal"
          element={
            <ProtectedRoute>
              <JournalActivite />
            </ProtectedRoute>
          }
        />
        <Route
          path="/comptes"
          element={
            <ProtectedRoute>
              <GestionComptes />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;