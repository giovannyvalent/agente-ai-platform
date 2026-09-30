import { DashboardLayout } from "../../components/DashboardLayout";
import { Card } from "../../components/ui/Card";
import { Input, Label } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useAgentsData } from "../../lib/useAgents";

export function SettingsPage() {
  const { tenantName } = useAgentsData();

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold text-ivory tracking-tight">Configurações</h1>
        <p className="text-steel text-sm mt-1">Dados da empresa, usuários, integrações e preferências.</p>

        <Card className="mt-6 p-6">
          <h2 className="text-ivory font-medium mb-4">Dados da empresa</h2>
          <Label>Nome</Label>
          <Input value={tenantName} disabled />
        </Card>

        <Card className="mt-4 p-6">
          <h2 className="text-ivory font-medium mb-1">Usuários</h2>
          <p className="text-steel text-sm mb-4">Gerenciamento de acessos ao painel — em breve.</p>
          <Button variant="secondary" disabled>
            Convidar usuário
          </Button>
        </Card>

        <Card className="mt-4 p-6">
          <h2 className="text-ivory font-medium mb-1">Integrações</h2>
          <p className="text-steel text-sm">
            Trello e WhatsApp (Z-API) configurados por agente. Gestão visual delas entra aqui em breve.
          </p>
        </Card>

        <Card className="mt-4 p-6">
          <h2 className="text-ivory font-medium mb-1">Preferências gerais</h2>
          <p className="text-steel text-sm">Nenhuma preferência configurável ainda.</p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
