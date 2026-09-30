import { Link } from "react-router-dom";
import { DashboardLayout } from "../../components/DashboardLayout";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { useAgentsData } from "../../lib/useAgents";

export function Agents() {
  const { agents, clientsByAgent, loading } = useAgentsData();

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <h1 className="text-2xl font-semibold text-ivory tracking-tight">Agentes</h1>
        <p className="text-steel text-sm mt-1">Agentes em produção e seus clientes vinculados.</p>

        {loading && <p className="text-steel text-sm mt-6">Carregando...</p>}

        <div className="mt-6 flex flex-col gap-3">
          {agents.map((agent) => (
            <Link key={agent.id} to="/dashboard/regras-do-cerebro">
              <Card className="p-5 hover:border-white/20 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-ivory font-medium">{agent.name}</h3>
                    <p className="text-steel text-sm mt-1">
                      {(clientsByAgent[agent.id] ?? []).join(", ") || "Nenhum cliente vinculado"}
                    </p>
                  </div>
                  <Badge tone={agent.enabled ? "success" : "neutral"}>
                    {agent.enabled ? "Em produção" : "Pausado"}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
          {!loading && agents.length === 0 && (
            <Card className="p-6 text-steel text-sm">Nenhum agente cadastrado ainda.</Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
