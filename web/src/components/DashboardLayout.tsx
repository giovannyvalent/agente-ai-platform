import { ReactNode, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutGrid, Bot, BarChart3, Settings, Menu, X, LogOut } from "lucide-react";
import { Logo } from "./Logo";
import { supabase } from "../lib/supabase";

// "Regras do cérebro" não é item de sidebar — é a tela de detalhe de um agente
// específico (acessada a partir de Visão geral / Agentes), como na referência.
const nav = [
  { to: "/dashboard", label: "Visão geral", icon: LayoutGrid, end: true },
  { to: "/dashboard/agentes", label: "Agentes", icon: Bot },
  { to: "/dashboard/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate("/login");
        return;
      }
      setEmail(data.user.email ?? "");
    });
  }, [navigate]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  const username = email.split("@")[0];
  const initials = username.slice(0, 2).toUpperCase() || "—";

  return (
    <div className="min-h-screen bg-venture-black flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-white/[0.06] px-4 py-6">
        <div className="px-2 mb-8">
          <Logo />
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[0.9rem] transition-colors ${
                  isActive ? "bg-electric-blue/10 text-electric-blue" : "text-steel hover:text-ivory hover:bg-white/[0.04]"
                }`
              }
            >
              <item.icon size={17} strokeWidth={1.75} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-white/[0.06] flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-full bg-electric-blue/15 text-electric-blue text-xs font-semibold flex items-center justify-center">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-ivory text-sm truncate capitalize">{username || "—"}</p>
              <p className="text-steel text-xs">Empresa</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-steel hover:text-ivory shrink-0" title="Sair">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Sidebar — mobile drawer */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-venture-black/90 backdrop-blur border-b border-white/[0.06]">
        <Logo />
        <button onClick={() => setOpen(true)} className="text-ivory">
          <Menu size={22} />
        </button>
      </div>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 bg-venture-black/95 backdrop-blur-sm flex flex-col px-6 py-6">
          <div className="flex items-center justify-between mb-8">
            <Logo />
            <button onClick={() => setOpen(false)} className="text-ivory">
              <X size={22} />
            </button>
          </div>
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-3 rounded-[8px] text-[0.95rem] ${
                    isActive ? "bg-electric-blue/10 text-electric-blue" : "text-steel"
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button onClick={handleLogout} className="mt-auto flex items-center gap-2 text-steel px-3 py-3">
            <LogOut size={16} /> Sair
          </button>
        </div>
      )}

      <main className="flex-1 min-w-0 px-6 lg:px-10 py-8 pt-20 lg:pt-8">{children}</main>
    </div>
  );
}
