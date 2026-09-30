import { useEffect, useState } from "react";
import { DashboardLayout } from "../../components/DashboardLayout";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Label } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { supabase } from "../../lib/supabase";
import { useAgentsData } from "../../lib/useAgents";

interface DispatchRow {
  id: string;
  agent_id: string;
  name: string;
  rules: string;
  token: string;
  enabled: boolean;
  last_run_at: string | null;
}

export function Dispatches() {
  const { agents } = useAgentsData();
  const [dispatches, setDispatches] = useState<DispatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [agentId, setAgentId] = useState("");
  const [rules, setRules] = useState("tipo: monitor_boards\n");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from("dispatches").select("*").order("created_at", { ascending: false });
    setDispatches(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!agentId && agents.length > 0) setAgentId(agents[0].id);
  }, [agents, agentId]);

  async function handleCreate() {
    if (!name.trim() || !agentId) return;
    setCreating(true);
    const token = crypto.randomUUID().replace(/-/g, "");
    const { error } = await supabase.from("dispatches").insert({ agent_id: agentId, name: name.trim(), rules, token });
    setCreating(false);
    if (!error) {
      setName("");
      setRules("tipo: monitor_boards\n");
      load();
    }
  }

  async function toggleEnabled(d: DispatchRow) {
    await supabase.from("dispatches").update({ enabled: !d.enabled }).eq("id", d.id);
    load();
  }

  function linkFor(token: string) {
    return `${window.location.origin}/api/dispatch/${token}`;
  }

  function copyLink(d: DispatchRow) {
    navigator.clipboard.writeText(linkFor(d.token));
    setCopiedId(d.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-semibold text-ivory tracking-tight">Disparos</h1>
        <p className="text-steel text-sm mt-1">
          Crie um gatilho, defina as regras e cole o link gerado num cron externo (cron-job.org,
          EasyCron etc.) pra disparar no horário que quiser.
        </p>

        <Card className="mt-6 p-6">
          <h2 className="text-ivory font-medium mb-4">Criar novo disparo</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Checagem de atrasados 08h" />
            </div>
            <div>
              <Label>Agente</Label>
              <select
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="w-full bg-venture-black border border-white/10 rounded-[10px] px-3.5 py-2.5 text-[0.95rem] text-ivory"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <Label>Regras (texto livre — define o que esse disparo faz)</Label>
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              spellCheck={false}
              className="w-full min-h-[120px] bg-venture-black border border-white/10 rounded-[10px] px-4 py-3 text-[0.9rem] text-ivory font-mono"
            />
            <p className="text-steel text-xs mt-1.5">
              Hoje só o tipo <code className="text-ivory">monitor_boards</code> está implementado (roda a
              checagem de cards atrasados do Trello desse agente). Novos tipos entram conforme forem
              construídos.
            </p>
          </div>
          <Button className="mt-4" onClick={handleCreate} disabled={creating || !name.trim()}>
            {creating ? "Criando..." : "Criar disparo"}
          </Button>
        </Card>

        <div className="mt-6 flex flex-col gap-3">
          {loading && <p className="text-steel text-sm">Carregando...</p>}
          {dispatches.map((d) => (
            <Card key={d.id} className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-ivory font-medium">{d.name}</p>
                  <p className="text-steel text-xs mt-0.5">
                    {agents.find((a) => a.id === d.agent_id)?.name ?? d.agent_id}
                    {d.last_run_at && ` · última execução ${new Date(d.last_run_at).toLocaleString("pt-BR")}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={d.enabled ? "success" : "neutral"}>{d.enabled ? "Ativo" : "Pausado"}</Badge>
                  <button onClick={() => toggleEnabled(d)} className="text-steel text-xs hover:text-ivory">
                    {d.enabled ? "Pausar" : "Ativar"}
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 text-xs text-steel bg-venture-black border border-white/10 rounded-[8px] px-3 py-2 truncate">
                  {linkFor(d.token)}
                </code>
                <Button variant="secondary" size="sm" onClick={() => copyLink(d)}>
                  {copiedId === d.id ? "Copiado!" : "Copiar link"}
                </Button>
              </div>
            </Card>
          ))}
          {!loading && dispatches.length === 0 && (
            <Card className="p-6 text-steel text-sm">Nenhum disparo criado ainda.</Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
