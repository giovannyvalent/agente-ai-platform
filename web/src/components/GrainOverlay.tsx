// Textura de grain sutil pra dar profundidade premium sem parecer neon/template.
const NOISE_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

export function GrainOverlay() {
  return (
    <div
      className="fixed inset-0 z-40 pointer-events-none opacity-[0.025] mix-blend-overlay"
      style={{ backgroundImage: `url("${NOISE_SVG}")` }}
      aria-hidden="true"
    />
  );
}
