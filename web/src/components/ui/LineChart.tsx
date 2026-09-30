// Gráfico de linha minimalista em SVG puro — sem dependência de lib de charts,
// suficiente para o volume de dado de uma "visão geral" enxuta.
export function LineChart({ data, height = 180 }: { data: number[]; height?: number }) {
  const width = 100;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 20) - 10;
    return [x, y];
  });

  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3D5AFE" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3D5AFE" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#chart-fill)" />
      <path d={linePath} fill="none" stroke="#3D5AFE" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
