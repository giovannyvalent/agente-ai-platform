import { DashboardLayout } from "../../components/DashboardLayout";
import { Card } from "../../components/ui/Card";
import { MetricCard } from "../../components/ui/MetricCard";
import { LineChart } from "../../components/ui/LineChart";
import { Switch } from "../../components/ui/Switch";
import { useAgentsData } from "../../lib/useAgents";

// Série ilustrativa até termos métricas reais de conversas/interações.
const activitySeries = [12, 18, 14, 22, 30, 26, 34, 40, 36, 44, 38, 48];

export function Overview() {
  const { agents, tenantName, loading } = useAgentsData();

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <p className="text-steel text-sm">{tenantName || "—"}</p>
        <h1 className="text-2xl font-semibold text-ivory tracking-tight mt-1">Visão geral</h1>
        <p className="text-steel text-sm mt-1">Acompanhe o desempenho dos seus agentes e automações.</p>

        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Conversas atendidas" value="—" delta="dado ainda não coletado" deltaTone="up" />
          <MetricCard label="Taxa de resolução" value="—" />
          <MetricCard label="Tempo médio de resposta" value="—" />
          <MetricCard label="Agentes ativos" value={String(agents.filter((a) => a.enabled).length)} />
        </div>

        <Card className="mt-6 p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-ivory font-medium">Conversas ao longo do tempo</h2>
            <span className="text-xs text-steel">últimos 30 dias · ilustrativo</span>
          </div>
          <LineChart data={activitySeries} />
        </Card>

        <Card className="mt-6 p-6">
          <h2 className="text-ivory font-medium mb-4">Agentes em produção</h2>
          {loading && <p className="text-steel text-sm">Carregando...</p>}
          <div className="flex flex-col divide-y divide-white/[0.06]">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between py-3">
                <span className="text-ivory text-sm">{agent.name}</span>
                <Switch checked={agent.enabled} disabled />
              </div>
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
