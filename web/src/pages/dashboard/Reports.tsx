import { DashboardLayout } from "../../components/DashboardLayout";
import { Card } from "../../components/ui/Card";
import { MetricCard } from "../../components/ui/MetricCard";
import { useAgentsData } from "../../lib/useAgents";

export function Reports() {
  const { agents } = useAgentsData();

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <h1 className="text-2xl font-semibold text-ivory tracking-tight">Relatórios</h1>
        <p className="text-steel text-sm mt-1">
          Indicadores de interações e desempenho dos agentes. Estrutura pronta — números reais
          entram assim que a coleta de métricas for ligada.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <select className="bg-graphite border border-white/10 rounded-[8px] text-sm text-ivory px-3 py-2">
            <option>Últimos 30 dias</option>
            <option>Últimos 7 dias</option>
            <option>Este mês</option>
          </select>
          <select className="bg-graphite border border-white/10 rounded-[8px] text-sm text-ivory px-3 py-2">
            <option>Todos os agentes</option>
            {agents.map((a) => (
              <option key={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Total de interações" value="—" />
          <MetricCard label="Atendimentos" value="—" />
          <MetricCard label="Resoluções" value="—" />
          <MetricCard label="Transferências" value="—" />
          <MetricCard label="Agendamentos" value="—" />
          <MetricCard label="Taxa de resolução" value="—" />
          <MetricCard label="Tempo médio de resposta" value="—" />
        </div>

        <Card className="mt-6 p-6 text-steel text-sm">
          Gráficos comparativos por período e por agente entram aqui quando os dados de
          interação passarem a ser registrados.
        </Card>
      </div>
    </DashboardLayout>
  );
}
