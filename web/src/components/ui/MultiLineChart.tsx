export interface ChartSeries {
  label: string;
  color: string; // classe tailwind de cor, ex. "#3D5AFE"
  data: number[];
}

// Gráfico multi-linha em SVG puro (sem lib de charts) — usado tanto na landing
// (conteúdo demonstrativo) quanto no painel (dados reais, quando existirem).
export function MultiLineChart({ series, height = 220 }: { series: ChartSeries[]; height?: number }) {
  const width = 1000;
  const allValues = series.flatMap((s) => s.data);
  const max = Math.max(...allValues, 1);
  const min = Math.min(...allValues, 0);
  const range = max - min || 1;
  const len = series[0]?.data.length ?? 0;

  function toPath(data: number[]) {
    return data
      .map((v, i) => {
        const x = (i / (len - 1 || 1)) * width;
        const y = height - ((v - min) / range) * (height - 24) - 12;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      {series.map((s) => (
        <path key={s.label} d={toPath(s.data)} fill="none" stroke={s.color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
