import { Routes, Route } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Overview } from "./pages/dashboard/Overview";
import { Agents } from "./pages/dashboard/Agents";
import { AgentDetail } from "./pages/dashboard/AgentDetail";
import { Reports } from "./pages/dashboard/Reports";
import { SettingsPage } from "./pages/dashboard/Settings";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Overview />} />
      <Route path="/dashboard/agentes" element={<Agents />} />
      <Route path="/dashboard/agentes/:id" element={<AgentDetail />} />
      <Route path="/dashboard/relatorios" element={<Reports />} />
      <Route path="/dashboard/configuracoes" element={<SettingsPage />} />
    </Routes>
  );
}
