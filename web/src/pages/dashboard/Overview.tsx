import { Link } from "react-router-dom";
import { DashboardLayout } from "../../components/DashboardLayout";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { AgentMetricCard } from "../../components/ui/AgentMetricCard";
import { MultiLineChart } from "../../components/ui/MultiLineChart";
import { useAgentsData } from "../../lib/useAgents";

const SERIES_COLORS = ["#3D5AFE", "#22D3EE", "#A78BFA", "#92969D", "#F472B6", "#FACC15"];

export function Overview() {
  const { agents, tenantName, loading } = useAgentsData();

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-steel text-sm">{tenantName || "—"}</p>
            <h1 className="text-2xl font-semibold text-ivory tracking-tight mt-1">Visão geral</h1>
            <p className="text-steel text-sm mt-1">Performance individual dos agentes em produção.</p>
          </div>
          <select className="bg-graphite border border-white/10 rounded-[8px] text-sm text-ivory px-3 py-2">
            <option>Últimos 30 dias</option>
            <option>Últimos 7 dias</option>
            <option>Este mês</option>
          </select>
        </div>

        {loading && <p className="text-steel text-sm mt-8">Carregando...</p>}

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent, i) => (
            <AgentMetricCard
              key={agent.id}
              name={agent.name}
              enabled={agent.enabled}
              color={SERIES_COLORS[i % SERIES_COLORS.length]}
              stats={[
                { label: "Interações", value: "—" },
                { label: "Resolução", value: "—" },
                { label: "Resposta", value: "—" },
              ]}
            />
          ))}
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
              <p className="text-steel text-xs mt-0.5">Interações processadas ao longo do período · ilustrativo</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {agents.map((agent, i) => (
                <span key={agent.id} className="flex items-center gap-1.5 text-xs text-steel">
                  <span className="w-2 h-2 rounded-full" style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }} />
                  {agent.name}
                </span>
              ))}
            </div>
          </div>
          <MultiLineChart
            series={agents.map((agent, i) => ({
              label: agent.name,
              color: SERIES_COLORS[i % SERIES_COLORS.length],
              data: [18, 24, 20, 30, 38, 34, 44, 50, 46, 56, 48, 58],
            }))}
          />
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
                <Badge tone={agent.enabled ? "success" : "neutral"}>
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
