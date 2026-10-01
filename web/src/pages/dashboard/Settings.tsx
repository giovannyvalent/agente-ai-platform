import { useEffect, useState } from "react";
import { DashboardLayout } from "../../components/DashboardLayout";
import { Card } from "../../components/ui/Card";
import { Input, Label } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Switch } from "../../components/ui/Switch";
import { useAgentsData } from "../../lib/useAgents";
import { supabase } from "../../lib/supabase";

// Integrações mostradas aqui refletem o que esse tenant realmente tem configurado
// — não é uma lista fixa igual pra todo mundo. AM usa Trello, por exemplo; quando
// a ANSER (ou outro tenant) ligar o Nibo, a linha dele aparece só pro tenant dela.
export function SettingsPage() {
  const { tenantId, tenantName, clientsByAgent } = useAgentsData();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(tenantName);
  }, [tenantName]);

  const hasTrello = Object.values(clientsByAgent).some((list) => list.length > 0);
  const dirty = name !== tenantName;

  async function handleSave() {
    if (!tenantId) return;
    setSaving(true);
    setSaved(false);
    const { error } = await supabase.from("tenants").update({ name: name.trim() }).eq("id", tenantId);
    setSaving(false);
    if (!error) setSaved(true);
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ivory tracking-tight">Configurações</h1>
            <p className="text-steel text-sm mt-1">Dados da empresa, usuários, integrações e preferências.</p>
          </div>
          <Button onClick={handleSave} disabled={!dirty || saving}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>

        <Card className="mt-6 p-6">
          <h2 className="text-ivory font-medium mb-1">Dados da empresa</h2>
          <p className="text-steel text-sm mb-4">Informações gerais usadas nos agentes e relatórios.</p>
          <Label>Empresa</Label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
          />
          {saved && <p className="text-[#4ade80] text-xs mt-2">Salvo.</p>}
        </Card>

        <Card className="mt-4 p-6">
          <h2 className="text-ivory font-medium mb-1">Preferências</h2>
          <p className="text-steel text-sm mb-4">Comportamentos gerais do painel.</p>
          <div className="flex items-center justify-between py-3 border-t border-white/[0.06]">
            <div>
              <p className="text-ivory text-sm">Notificações de erro</p>
              <p className="text-steel text-xs mt-0.5">Alertar quando uma automação falhar.</p>
            </div>
            <Switch checked disabled />
          </div>
          <div className="flex items-center justify-between py-3 border-t border-white/[0.06]">
            <div>
              <p className="text-ivory text-sm">Resumo semanal</p>
              <p className="text-steel text-xs mt-0.5">Receber relatório por e-mail.</p>
            </div>
            <Switch checked={false} disabled />
          </div>
        </Card>

        <Card className="mt-4 p-6">
          <h2 className="text-ivory font-medium mb-1">Usuários</h2>
          <p className="text-steel text-sm mb-4">Gerenciamento de acessos ao painel. Em breve.</p>
          <Button variant="secondary" disabled>
            Convidar usuário
          </Button>
        </Card>

        <Card className="mt-4 p-6">
          <h2 className="text-ivory font-medium mb-1">Integrações</h2>
          <p className="text-steel text-sm mb-4">
            Conexões ativas pra essa empresa. Novas integrações aparecem aqui assim que forem ligadas.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-steel border-b border-white/[0.06]">
                  <th className="pb-2 font-normal">Integração</th>
                  <th className="pb-2 font-normal">Descrição</th>
                  <th className="pb-2 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/[0.04]">
                  <td className="py-3 text-ivory">WhatsApp</td>
                  <td className="py-3 text-steel">Canal operacional dos agentes</td>
                  <td className="py-3">
                    <Badge tone="success">Conectado</Badge>
                  </td>
                </tr>
                {hasTrello && (
                  <tr className="border-b border-white/[0.04]">
                    <td className="py-3 text-ivory">Trello</td>
                    <td className="py-3 text-steel">Boards de acompanhamento dos clientes</td>
                    <td className="py-3">
                      <Badge tone="success">Conectado</Badge>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
