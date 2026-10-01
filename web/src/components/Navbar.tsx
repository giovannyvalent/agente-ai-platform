import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "./ui/Button";

const links = [
  { label: "Soluções", href: "#solucoes" },
  { label: "Método", href: "#metodo" },
  { label: "Resultados", href: "#resultados" },
  { label: "Sobre", href: "#sobre" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-venture-black border-b border-white/[0.06]">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-8 h-20">
        <Link to="/">
          <Logo />
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="text-[0.9rem] text-steel hover:text-ivory transition-colors">
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-5">
          <Link to="/login" className="hidden md:block text-[0.9rem] text-steel hover:text-ivory transition-colors">
            Entrar
          </Link>
          <a href="#contato" className="hidden md:block">
            <Button size="sm">Falar com especialista</Button>
          </a>
          <button
            className="md:hidden text-ivory"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden px-6 pb-6 flex flex-col gap-4">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-ivory text-[0.95rem]"
            >
              {l.label}
            </a>
          ))}
          <Link to="/login" onClick={() => setOpen(false)} className="text-ivory text-[0.95rem]">
            Entrar
          </Link>
          <a href="#contato" onClick={() => setOpen(false)}>
            <Button size="sm" className="w-full justify-center">
              Falar com especialista
            </Button>
          </a>
        </div>
      )}
    </header>
  );
}
