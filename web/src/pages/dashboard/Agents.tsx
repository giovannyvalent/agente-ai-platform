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
        <p className="text-steel text-sm mt-1">Selecione um agente para acessar as regras do cérebro.</p>

        {loading && <p className="text-steel text-sm mt-6">Carregando...</p>}

        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          {agents.map((agent) => (
            <Link key={agent.id} to={`/dashboard/agentes/${agent.id}`}>
              <Card className="p-5 h-full hover:border-white/20 transition-colors flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-md bg-electric-blue/10 text-electric-blue text-xs font-semibold flex items-center justify-center">
                    AI
                  </div>
                  <Badge tone={agent.enabled ? "success" : "neutral"}>
                    {agent.enabled ? "Em produção" : "Pausado"}
                  </Badge>
                </div>
                <h3 className="text-ivory font-medium">{agent.name}</h3>
                <p className="text-steel text-sm mt-1.5 flex-1">
                  {(clientsByAgent[agent.id] ?? []).length > 0
                    ? `Clientes: ${(clientsByAgent[agent.id] ?? []).join(", ")}`
                    : "Nenhum cliente vinculado ainda."}
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-electric-blue text-sm font-medium">
                  Abrir regras <span>→</span>
                </div>
              </Card>
            </Link>
          ))}
          {!loading && agents.length === 0 && (
            <Card className="p-6 text-steel text-sm sm:col-span-2">Nenhum agente cadastrado ainda.</Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
