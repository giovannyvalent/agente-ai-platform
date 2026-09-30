import { Routes, Route } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Overview } from "./pages/dashboard/Overview";
import { BrainRules } from "./pages/dashboard/BrainRules";
import { Agents } from "./pages/dashboard/Agents";
import { Reports } from "./pages/dashboard/Reports";
import { SettingsPage } from "./pages/dashboard/Settings";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Overview />} />
      <Route path="/dashboard/regras-do-cerebro" element={<BrainRules />} />
      <Route path="/dashboard/agentes" element={<Agents />} />
      <Route path="/dashboard/relatorios" element={<Reports />} />
      <Route path="/dashboard/configuracoes" element={<SettingsPage />} />
    </Routes>
  );
}
