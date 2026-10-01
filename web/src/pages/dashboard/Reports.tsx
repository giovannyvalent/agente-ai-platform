import { useEffect, useState } from "react";
import { DashboardLayout } from "../../components/DashboardLayout";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { useAgentsData } from "../../lib/useAgents";
import { supabase } from "../../lib/supabase";

interface InteractionRow {
  agent_id: string;
  duration_ms: number | null;
  created_at: string;
}

const RANGES = [
  { label: "Últimos 7 dias", days: 7 },
  { label: "Últimos 30 dias", days: 30 },
  { label: "Últimos 90 dias", days: 90 },
];

function fmtMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function Reports() {
  const { agents, loading: loadingAgents } = useAgentsData();
  const [rangeIdx, setRangeIdx] = useState(1);
  const [rows, setRows] = useState<InteractionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      const since = new Date(Date.now() - RANGES[rangeIdx].days * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("interactions")
        .select("agent_id,duration_ms,created_at")
        .gte("created_at", since);
      if (!cancelled) {
        setRows(data ?? []);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [rangeIdx]);

  const total = rows.length;
  const avgMs = total > 0 ? rows.reduce((sum, r) => sum + (r.duration_ms ?? 0), 0) / total : 0;

  const byAgent = new Map<string, InteractionRow[]>();
  for (const r of rows) {
    byAgent.set(r.agent_id, [...(byAgent.get(r.agent_id) ?? []), r]);
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ivory tracking-tight">Relatórios</h1>
            <p className="text-steel text-sm mt-1">Interações reais processadas pelos agentes.</p>
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

        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          <Card className="p-5">
            <p className="text-steel text-sm">Total de interações</p>
            <p className="text-2xl font-semibold text-ivory mt-2">{loading ? "…" : total}</p>
          </Card>
          <Card className="p-5">
            <p className="text-steel text-sm">Tempo médio de resposta</p>
            <p className="text-2xl font-semibold text-ivory mt-2">{loading || total === 0 ? "—" : fmtMs(avgMs)}</p>
          </Card>
          <Card className="p-5">
            <p className="text-steel text-sm">Agentes com atividade</p>
            <p className="text-2xl font-semibold text-ivory mt-2">{loading ? "…" : byAgent.size}</p>
          </Card>
        </div>

        <Card className="mt-6 p-6">
          <h2 className="text-ivory font-medium mb-4">Resumo por agente</h2>

          {(loading || loadingAgents) && <p className="text-steel text-sm">Carregando...</p>}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-steel border-b border-white/[0.06]">
                  <th className="pb-2 font-normal">Agente</th>
                  <th className="pb-2 font-normal">Interações</th>
                  <th className="pb-2 font-normal">Tempo médio</th>
                  <th className="pb-2 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => {
                  const agentRows = byAgent.get(agent.id) ?? [];
                  const agentAvg =
                    agentRows.length > 0
                      ? agentRows.reduce((s, r) => s + (r.duration_ms ?? 0), 0) / agentRows.length
                      : 0;
                  return (
                    <tr key={agent.id} className="border-b border-white/[0.04]">
                      <td className="py-3 text-ivory">{agent.name}</td>
                      <td className="py-3 text-steel">{agentRows.length}</td>
                      <td className="py-3 text-steel">{agentRows.length > 0 ? fmtMs(agentAvg) : "—"}</td>
                      <td className="py-3">
                        <Badge tone={agent.enabled ? "success" : "neutral"}>
                          {agent.enabled ? "Em produção" : "Pausado"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!loadingAgents && agents.length === 0 && (
              <p className="text-steel text-sm py-4">Nenhum agente cadastrado ainda.</p>
            )}
          </div>

          {!loading && total === 0 && (
            <p className="text-steel text-xs mt-4">
              Nenhuma interação registrada no período. Os números aparecem conforme o WhatsApp for usado.
            </p>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
