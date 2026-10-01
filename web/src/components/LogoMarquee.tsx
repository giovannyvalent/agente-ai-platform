// Nomes reais de clientes da Venture (não inventados) — adicionar aqui conforme
// novos clientes entrarem na plataforma.
const brands = [
  { name: "AM", full: "AM Gestão & Estratégia" },
  { name: "ANSER", full: "Anser" },
];

export function LogoMarquee() {
  const row = [...brands, ...brands, ...brands];

  return (
    <section className="py-16 border-y border-white/[0.06] bg-graphite/20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center mb-10">
        <p className="text-electric-blue text-xs font-semibold tracking-[0.15em]">QUEM JÁ OPERA COM A VENTURE</p>
        <p className="text-steel text-sm mt-2 max-w-md mx-auto">
          Agentes de IA rodando em produção, monitorando operação e atendimento real.
        </p>
      </div>
      <div className="overflow-hidden">
        <div className="flex w-max animate-marquee">
          {row.map((b, i) => (
            <div
              key={`${b.name}-${i}`}
              className="flex items-center gap-3 mx-4 px-6 py-4 rounded-lg border border-white/[0.08] bg-venture-black/60 shrink-0"
            >
              <div className="w-9 h-9 rounded-md bg-electric-blue/10 flex items-center justify-center shrink-0">
                <span className="text-electric-blue text-xs font-bold">{b.name.slice(0, 2)}</span>
              </div>
              <div className="text-left">
                <p className="text-ivory font-medium text-sm leading-tight">{b.name}</p>
                <p className="text-steel text-xs leading-tight">{b.full}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
