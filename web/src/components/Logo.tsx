// Logo oficial da Venture (arquivo enviado pelo usuário) — não recriar como texto.
export function Logo({ className = "" }: { className?: string }) {
  return <img src="/logo-venture.png" alt="Venture" className={`h-7 w-auto ${className}`} />;
}
