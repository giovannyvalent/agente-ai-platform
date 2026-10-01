import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface ChartSeries {
  label: string;
  color: string; // cor em hex, ex. "#3D5AFE"
  data: number[];
}

// Catmull-rom -> bezier: curva suave passando pelos pontos reais (em vez de
// segmentos retos), sem precisar de lib externa de charts/interpolação.
function smoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";
  let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

function formatXLabel(label: string): string {
  // "YYYY-MM-DD" -> "DD/MM"; qualquer outro formato passa direto.
  const m = label.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}` : label;
}

// Gráfico multi-linha em SVG puro (sem lib de charts) — usado tanto na landing
// (conteúdo demonstrativo) quanto no painel (dado real). Curva suave + grade +
// área em gradiente + crosshair com tooltip de detalhes ao passar o mouse.
export function MultiLineChart({
  series,
  height = 220,
  xLabels,
}: {
  series: ChartSeries[];
  height?: number;
  xLabels?: string[];
}) {
  const width = 1000;
  const allValues = series.flatMap((s) => s.data);
  const max = Math.max(...allValues, 1);
  const min = Math.min(...allValues, 0);
  const range = max - min || 1;
  const len = series[0]?.data.length ?? 0;
  const top = 14;
  const bottom = height - 14;

  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  function toPoints(data: number[]) {
    return data.map((v, i) => ({
      x: (i / (len - 1 || 1)) * width,
      y: bottom - ((v - min) / range) * (bottom - top),
    }));
  }

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => top + f * (bottom - top));

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    if (len < 2 || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setHoverIdx(Math.round(frac * (len - 1)));
  }

  const hoverX = hoverIdx !== null ? (hoverIdx / (len - 1 || 1)) * width : null;
  const hoverPct = hoverIdx !== null ? (hoverIdx / (len - 1 || 1)) * 100 : null;
  const tooltipAlign: "left" | "right" | "center" =
    hoverPct === null ? "center" : hoverPct < 18 ? "left" : hoverPct > 82 ? "right" : "center";

  return (
    <div
      ref={containerRef}
      className="relative w-full cursor-crosshair"
      onMouseMove={handleMove}
      onMouseLeave={() => setHoverIdx(null)}
    >
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full block" style={{ height }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.label} id={`mlc-grad-${s.label.replace(/\s+/g, "-")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        {gridLines.map((y, i) => (
          <line key={i} x1={0} x2={width} y1={y} y2={y} stroke="#ffffff" strokeOpacity={0.05} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        ))}

        {series.map((s, i) => {
          const points = toPoints(s.data);
          const line = smoothPath(points);
          const area = `${line} L${points[points.length - 1].x.toFixed(1)},${bottom} L${points[0].x.toFixed(1)},${bottom} Z`;
          const last = points[points.length - 1];
          const gradId = `mlc-grad-${s.label.replace(/\s+/g, "-")}`;

          return (
            <g key={s.label}>
              <motion.path
                d={area}
                fill={`url(#${gradId})`}
                stroke="none"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 1, delay: i * 0.15 + 0.3 }}
              />
              <motion.path
                d={line}
                fill="none"
                stroke={s.color}
                strokeWidth={2.25}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 1.4, delay: i * 0.15, ease: "easeOut" }}
              />
              <motion.circle
                cx={last.x}
                cy={last.y}
                r={4.5}
                fill={s.color}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.15 + 1.2 }}
              />
              <motion.circle
                cx={last.x}
                cy={last.y}
                r={4.5}
                fill="none"
                stroke={s.color}
                strokeWidth={1.5}
                animate={{ r: [4.5, 11, 4.5], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 + 1.4, ease: "easeOut" }}
              />
            </g>
          );
        })}

        {hoverIdx !== null && hoverX !== null && (
          <g pointerEvents="none">
            <line x1={hoverX} x2={hoverX} y1={top} y2={bottom} stroke="#ffffff" strokeOpacity={0.18} strokeWidth={1} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
            {series.map((s) => {
              const points = toPoints(s.data);
              const p = points[hoverIdx];
              return (
                <circle key={s.label} cx={p.x} cy={p.y} r={5} fill="#0B0B0C" stroke={s.color} strokeWidth={2.5} />
              );
            })}
          </g>
        )}
      </svg>

      <AnimatePresence>
        {hoverIdx !== null && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute top-0 z-10 bg-[#0B0B0C]/95 border border-white/10 rounded-[8px] px-3 py-2 shadow-card backdrop-blur-sm pointer-events-none min-w-[140px]"
            style={{
              left: tooltipAlign === "center" ? `${hoverPct}%` : tooltipAlign === "left" ? "0%" : "100%",
              transform: tooltipAlign === "center" ? "translateX(-50%)" : tooltipAlign === "left" ? "translateX(0%)" : "translateX(-100%)",
            }}
          >
            {xLabels?.[hoverIdx] && (
              <p className="text-steel text-[0.65rem] tracking-wide mb-1.5 pb-1.5 border-b border-white/[0.06]">
                {formatXLabel(xLabels[hoverIdx])}
              </p>
            )}
            <div className="flex flex-col gap-1">
              {series.map((s) => (
                <div key={s.label} className="flex items-center gap-2 justify-between">
                  <span className="flex items-center gap-1.5 text-steel text-[0.7rem]">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    {s.label}
                  </span>
                  <span className="text-ivory text-[0.75rem] font-medium tabular-nums">{s.data[hoverIdx]}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
