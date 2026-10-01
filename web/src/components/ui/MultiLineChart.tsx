import { motion } from "framer-motion";

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

// Gráfico multi-linha em SVG puro (sem lib de charts) — usado tanto na landing
// (conteúdo demonstrativo) quanto no painel (dados reais, quando existirem).
// Curva suave + grade + área em gradiente + ponto final pulsando no vivo.
export function MultiLineChart({ series, height = 220 }: { series: ChartSeries[]; height?: number }) {
  const width = 1000;
  const allValues = series.flatMap((s) => s.data);
  const max = Math.max(...allValues, 1);
  const min = Math.min(...allValues, 0);
  const range = max - min || 1;
  const len = series[0]?.data.length ?? 0;
  const top = 14;
  const bottom = height - 14;

  function toPoints(data: number[]) {
    return data.map((v, i) => ({
      x: (i / (len - 1 || 1)) * width,
      y: bottom - ((v - min) / range) * (bottom - top),
    }));
  }

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => top + f * (bottom - top));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
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
    </svg>
  );
}
