const brands = ["AURENZO", "NEXUM", "ORVIA", "KIVORA", "CENDRA", "TALVA"];

export function LogoMarquee() {
  const row = [...brands, ...brands];

  return (
    <section className="py-14 border-y border-white/[0.06] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center mb-8">
        <p className="text-steel text-xs tracking-[0.15em]">MARCAS DEMONSTRATIVAS</p>
        <p className="text-steel/70 text-sm mt-1.5">Visual de prova social para apresentação da marca Venture</p>
      </div>
      <div className="flex w-max animate-marquee">
        {row.map((name, i) => (
          <span
            key={`${name}-${i}`}
            className="flex items-center gap-2.5 text-steel/60 font-medium text-lg px-8 shrink-0"
          >
            <span className="w-2 h-2 rounded-full bg-steel/40" />
            {name}
          </span>
        ))}
      </div>
    </section>
  );
}
