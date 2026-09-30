import { Card } from "./Card";
import { Badge } from "./Badge";

interface Stat {
  label: string;
  value: string;
}

interface AgentMetricCardProps {
  name: string;
  enabled: boolean;
  color: string;
  stats: Stat[];
}

export function AgentMetricCard({ name, enabled, color, stats }: AgentMetricCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
          <strong className="text-ivory text-sm truncate">{name}</strong>
        </div>
        <Badge tone={enabled ? "success" : "neutral"}>{enabled ? "Em produção" : "Pausado"}</Badge>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-steel text-xs">{s.label}</p>
            <p className="text-ivory font-semibold text-lg mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
