import { DashboardLayout } from "../../components/DashboardLayout";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useAgentsData } from "../../lib/useAgents";

export function Reports() {
  const { agents, loading } = useAgentsData();

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ivory tracking-tight">Relatórios</h1>
            <p className="text-steel text-sm mt-1">Indicadores essenciais dos agentes e automações.</p>
          </div>
          <div className="flex gap-2">
            <select className="bg-graphite border border-white/10 rounded-[8px] text-sm text-ivory px-3 py-2">
              <option>Todos os agentes</option>
              {agents.map((a) => (
                <option key={a.id}>{a.name}</option>
              ))}
            </select>
            <select className="bg-graphite border border-white/10 rounded-[8px] text-sm text-ivory px-3 py-2">
              <option>Últimos 30 dias</option>
            </select>
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          <Card className="p-5">
            <p className="text-steel text-sm">Total de interações</p>
            <p className="text-2xl font-semibold text-ivory mt-2">—</p>
          </Card>
          <Card className="p-5">
            <p className="text-steel text-sm">Transferências humanas</p>
            <p className="text-2xl font-semibold text-ivory mt-2">—</p>
          </Card>
          <Card className="p-5">
            <p className="text-steel text-sm">Taxa média de resolução</p>
            <p className="text-2xl font-semibold text-ivory mt-2">—</p>
          </Card>
        </div>

        <Card className="mt-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-ivory font-medium">Resumo por agente</h2>
            <Button variant="secondary" size="sm" disabled>
              Exportar CSV
            </Button>
          </div>

          {loading && <p className="text-steel text-sm">Carregando...</p>}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-steel border-b border-white/[0.06]">
                  <th className="pb-2 font-normal">Agente</th>
                  <th className="pb-2 font-normal">Interações</th>
                  <th className="pb-2 font-normal">Resolução</th>
                  <th className="pb-2 font-normal">Tempo médio</th>
                  <th className="pb-2 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id} className="border-b border-white/[0.04]">
                    <td className="py-3 text-ivory">{agent.name}</td>
                    <td className="py-3 text-steel">—</td>
                    <td className="py-3 text-steel">—</td>
                    <td className="py-3 text-steel">—</td>
                    <td className="py-3">
                      <Badge tone={agent.enabled ? "success" : "neutral"}>
                        {agent.enabled ? "Em produção" : "Pausado"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && agents.length === 0 && (
              <p className="text-steel text-sm py-4">Nenhum agente cadastrado ainda.</p>
            )}
          </div>

          <p className="text-steel text-xs mt-4">
            Números ainda não coletados — entram aqui assim que a medição de interações for ligada.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
