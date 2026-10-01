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
  const { agents, clientsByAgent } = useAgentsData();
  const [dispatches, setDispatches] = useState<DispatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [agentId, setAgentId] = useState("");
  const [rules, setRules] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedHasBoards = (clientsByAgent[agentId] ?? []).length > 0;

  // Opções sugeridas mudam conforme a integração do agente selecionado —
  // "resumo_interacoes" serve pra qualquer um (todo agente tem WhatsApp);
  // "monitor_boards" só aparece pra quem tem board do Trello vinculado.
  const presets = [
    { label: "Resumo de interações (WhatsApp)", value: "tipo: resumo_interacoes\ndias: 1\n" },
    ...(selectedHasBoards
      ? [{ label: "Checagem de atrasados (Trello)", value: "tipo: monitor_boards\n" }]
      : []),
  ];

  // Zera o texto ao trocar de agente (evita manter uma regra que não existe
  // mais pra esse agente, ex.: monitor_boards pra um sem Trello).
  useEffect(() => {
    setRules("");
  }, [agentId]);

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
      setRules("");
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
            <Label>Regras (texto livre: define o que esse disparo faz)</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setRules(p.value)}
                  className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-steel hover:text-ivory hover:border-electric-blue/50 hover:bg-electric-blue/10 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="Escolha uma opção acima ou escreva manualmente, ex.: tipo: monitor_boards"
              spellCheck={false}
              className="w-full min-h-[120px] bg-venture-black border border-white/10 rounded-[10px] px-4 py-3 text-[0.9rem] text-ivory font-mono"
            />
            <p className="text-steel text-xs mt-1.5">
              As opções acima mudam de acordo com as integrações desse agente: todo agente tem{" "}
              <code className="text-ivory">resumo_interacoes</code> (WhatsApp), e quem tem board vinculado
              também ganha <code className="text-ivory">monitor_boards</code> (Trello). Novos tipos entram
              aqui conforme forem construídos.
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
