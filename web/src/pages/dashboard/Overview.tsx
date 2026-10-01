import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "../../components/DashboardLayout";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { AgentMetricCard } from "../../components/ui/AgentMetricCard";
import { MultiLineChart } from "../../components/ui/MultiLineChart";
import { useAgentsData } from "../../lib/useAgents";
import { supabase } from "../../lib/supabase";

const SERIES_COLORS = ["#3D5AFE", "#22D3EE", "#A78BFA", "#92969D", "#F472B6", "#FACC15"];

const RANGES = [
  { label: "Últimos 7 dias", days: 7 },
  { label: "Últimos 30 dias", days: 30 },
  { label: "Últimos 90 dias", days: 90 },
];

interface InteractionRow {
  agent_id: string;
  duration_ms: number | null;
  created_at: string;
}

function dayKey(iso: string): string {
  return iso.slice(0, 10); // YYYY-MM-DD
}

export function Overview() {
  const { agents, tenantName, loading } = useAgentsData();
  const [rangeIdx, setRangeIdx] = useState(1);
  const [agentFilter, setAgentFilter] = useState<string>("todos");
  const [rows, setRows] = useState<InteractionRow[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  const days = RANGES[rangeIdx].days;

  useEffect(() => {
    let cancelled = false;
    setLoadingMetrics(true);

    async function load() {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("interactions")
        .select("agent_id,duration_ms,created_at")
        .gte("created_at", since);
      if (!cancelled) {
        setRows(data ?? []);
        setLoadingMetrics(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [days]);

  // Baldes de dia (preenche com 0 nos dias sem interação, pra linha nao "pular")
  const dayBuckets = useMemo(() => {
    const buckets: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      buckets.push(dayKey(new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()));
    }
    return buckets;
  }, [days]);

  const byAgent = useMemo(() => {
    const map = new Map<string, InteractionRow[]>();
    for (const r of rows) {
      map.set(r.agent_id, [...(map.get(r.agent_id) ?? []), r]);
    }
    return map;
  }, [rows]);

  const chartAgents = agentFilter === "todos" ? agents : agents.filter((a) => a.id === agentFilter);

  const series = chartAgents.map((agent, i) => {
    const agentRows = byAgent.get(agent.id) ?? [];
    const countsByDay = new Map<string, number>();
    for (const r of agentRows) {
      const k = dayKey(r.created_at);
      countsByDay.set(k, (countsByDay.get(k) ?? 0) + 1);
    }
    return {
      label: agent.name,
      color: SERIES_COLORS[agents.findIndex((a) => a.id === agent.id) % SERIES_COLORS.length] ?? SERIES_COLORS[i],
      data: dayBuckets.map((d) => countsByDay.get(d) ?? 0),
    };
  });

  const hasAnyData = rows.length > 0;

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-steel text-sm">{tenantName || "—"}</p>
            <h1 className="text-2xl font-semibold text-ivory tracking-tight mt-1">Visão geral</h1>
            <p className="text-steel text-sm mt-1">Performance individual dos agentes em produção.</p>
          </div>
          <select
            value={rangeIdx}
            onChange={(e) => setRangeIdx(Number(e.target.value))}
            className="bg-graphite border border-white/10 rounded-[8px] text-sm text-ivory px-3 py-2"
          >
            {RANGES.map((r, i) => (
              <option key={r.label} value={i}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {loading && <p className="text-steel text-sm mt-8">Carregando...</p>}

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent, i) => {
            const agentRows = byAgent.get(agent.id) ?? [];
            const avgMs =
              agentRows.length > 0
                ? agentRows.reduce((s, r) => s + (r.duration_ms ?? 0), 0) / agentRows.length
                : 0;
            return (
              <AgentMetricCard
                key={agent.id}
                name={agent.name}
                enabled={agent.enabled}
                color={SERIES_COLORS[i % SERIES_COLORS.length]}
                stats={[
                  { label: "Interações", value: loadingMetrics ? "…" : String(agentRows.length) },
                  { label: "Resolução", value: "—" },
                  {
                    label: "Resposta",
                    value: loadingMetrics || agentRows.length === 0 ? "—" : `${(avgMs / 1000).toFixed(1)}s`,
                  },
                ]}
              />
            );
          })}
          {!loading && agents.length === 0 && (
            <Card className="p-6 text-steel text-sm sm:col-span-2 lg:col-span-3">
              Nenhum agente cadastrado ainda.
            </Card>
          )}
        </div>

        <Card className="mt-6 p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-ivory font-medium">Atividade por agente</h2>
              <p className="text-steel text-xs mt-0.5">
                Mensagens processadas por dia, {RANGES[rangeIdx].label.toLowerCase()} — dado real.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="bg-graphite border border-white/10 rounded-[8px] text-xs text-ivory px-2.5 py-1.5"
              >
                <option value="todos">Todos os agentes</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-3">
                {chartAgents.map((agent, i) => (
                  <span key={agent.id} className="flex items-center gap-1.5 text-xs text-steel">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: SERIES_COLORS[agents.findIndex((a) => a.id === agent.id) % SERIES_COLORS.length] }}
                    />
                    {agent.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {loadingMetrics ? (
            <p className="text-steel text-sm py-8 text-center">Carregando...</p>
          ) : hasAnyData ? (
            <MultiLineChart series={series} />
          ) : (
            <p className="text-steel text-sm py-8 text-center">
              Nenhuma interação registrada nesse período ainda.
            </p>
          )}
        </Card>

        <Card className="mt-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-ivory font-medium">Agentes</h2>
              <p className="text-steel text-xs mt-0.5">Acesse um agente para visualizar ou editar suas regras.</p>
            </div>
            <Link to="/dashboard/agentes" className="text-electric-blue text-sm hover:text-[#6b82ff]">
              Ver todos →
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-white/[0.06]">
            {agents.map((agent) => (
              <Link
                key={agent.id}
                to={`/dashboard/agentes/${agent.id}`}
                className="flex items-center gap-3 py-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-md bg-electric-blue/10 text-electric-blue text-xs font-semibold flex items-center justify-center shrink-0">
                  AI
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-ivory text-sm truncate">{agent.name}</p>
                </div>
                <Badge tone={agent.enabled ? "success" : "neutral"} className="shrink-0 whitespace-nowrap">
                  {agent.enabled ? "Em produção" : "Pausado"}
                </Badge>
                <span className="text-steel">→</span>
              </Link>
            ))}
            {!loading && agents.length === 0 && (
              <p className="text-steel text-sm py-3">Nenhum agente cadastrado ainda.</p>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
