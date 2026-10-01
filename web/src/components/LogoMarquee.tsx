// Nomes fictícios (mockup de prova social, como no briefing original) —
// não são empresas reais, só compõem a faixa visualmente até termos uma
// lista maior de clientes reais pra exibir.
const brands = [
  { name: "Nexum", mark: "NX" },
  { name: "Orvia", mark: "OR" },
  { name: "Kivora", mark: "KV" },
  { name: "Cendra", mark: "CD" },
  { name: "Talvo", mark: "TV" },
  { name: "Aurenz", mark: "AZ" },
  { name: "Zenith Labs", mark: "ZL" },
  { name: "Fluxora", mark: "FX" },
];

export function LogoMarquee() {
  const row = [...brands, ...brands];

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
              className="flex items-center gap-3 mx-3 px-5 py-4 w-[200px] shrink-0 rounded-lg border border-white/[0.08] bg-venture-black/60"
            >
              <div className="w-9 h-9 rounded-md bg-electric-blue/10 flex items-center justify-center shrink-0">
                <span className="text-electric-blue text-xs font-bold">{b.mark}</span>
              </div>
              <p className="text-ivory font-medium text-sm leading-tight truncate">{b.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
