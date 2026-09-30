// Formas abstratas do hero — esfera com brilho azul sutil + linhas finas.
// Propositalmente sem robôs/cérebros/circuitos, como pedido no briefing.
export function AbstractVisual({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`} aria-hidden="true">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 32% 28%, #3a3c42 0%, #1a1b1e 45%, #0b0b0c 72%)",
          boxShadow: "0 0 120px 20px rgba(61,90,254,0.15), inset -40px -40px 80px rgba(0,0,0,0.5)",
        }}
      />
      <div
        className="absolute inset-0 rounded-full opacity-70"
        style={{
          background: "radial-gradient(circle at 70% 75%, rgba(61,90,254,0.35), transparent 55%)",
        }}
      />
      <svg className="absolute -inset-10 w-[calc(100%+80px)] h-[calc(100%+80px)]" viewBox="0 0 400 400" fill="none">
        <ellipse cx="200" cy="200" rx="185" ry="60" stroke="rgba(243,241,235,0.08)" strokeWidth="1" transform="rotate(-18 200 200)" />
        <ellipse cx="200" cy="200" rx="150" ry="40" stroke="rgba(61,90,254,0.25)" strokeWidth="1" transform="rotate(-18 200 200)" />
      </svg>
    </div>
  );
}
