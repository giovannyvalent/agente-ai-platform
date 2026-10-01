import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Copy, Check } from "lucide-react";
import { DashboardLayout } from "../../components/DashboardLayout";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input, Label } from "../../components/ui/Input";
import { useAgentsData } from "../../lib/useAgents";
import { supabase } from "../../lib/supabase";

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function Agents() {
  const { agents, clientsByAgent, zapiInstances, tenantId, loading, refetch } = useAgentsData();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [zapiInstanceId, setZapiInstanceId] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdWebhook, setCreatedWebhook] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function uniqueSlug(base: string): string {
    const existing = new Set(agents.map((a) => a.id));
    if (!existing.has(base)) return base;
    let i = 2;
    while (existing.has(`${base}-${i}`)) i++;
    return `${base}-${i}`;
  }

  async function handleCreate() {
    if (!tenantId || !name.trim()) return;
    const slug = uniqueSlug(slugify(name) || "agente");
    setCreating(true);

    const { error: agentError } = await supabase.from("agents").insert({
      id: slug,
      name: name.trim(),
      tenant_id: tenantId,
      enabled: false,
      zapi_instance_id: zapiInstanceId || null,
    });
    if (agentError) {
      setCreating(false);
      return;
    }
    await supabase.from("brains").insert({ agent_id: slug, content: "" });

    setCreating(false);
    setCreatedWebhook(`${window.location.origin}/api/webhook/whatsapp/${slug}`);
    setName("");
    setZapiInstanceId("");
    refetch();
  }

  function copyWebhook() {
    if (!createdWebhook) return;
    navigator.clipboard.writeText(createdWebhook);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function closeCreate() {
    setShowCreate(false);
    setCreatedWebhook(null);
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ivory tracking-tight">Agentes</h1>
            <p className="text-steel text-sm mt-1">Selecione um agente para acessar as regras do cérebro.</p>
          </div>
          <Button onClick={() => setShowCreate((v) => !v)}>
            <Plus size={16} /> Novo agente
          </Button>
        </div>

        {showCreate && (
          <Card className="mt-6 p-6">
            {!createdWebhook ? (
              <>
                <h2 className="text-ivory font-medium mb-1">Criar novo agente</h2>
                <p className="text-steel text-sm mb-4">
                  Dá um nome e, se já tiver uma instância Z-API cadastrada, vincula o WhatsApp dele agora. Pode
                  configurar depois também.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome do agente</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Agente Financeiro" />
                  </div>
                  <div>
                    <Label>Instância Z-API</Label>
                    <select
                      value={zapiInstanceId}
                      onChange={(e) => setZapiInstanceId(e.target.value)}
                      className="w-full bg-venture-black border border-white/10 rounded-[10px] px-3.5 py-2.5 text-[0.95rem] text-ivory"
                    >
                      <option value="">Sem instância (configurar depois)</option>
                      {zapiInstances.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.label}
                        </option>
                      ))}
                    </select>
                    {zapiInstances.length === 0 && (
                      <p className="text-steel text-xs mt-1.5">
                        Nenhuma instância ainda —{" "}
                        <Link to="/dashboard/configuracoes" className="text-electric-blue">
                          cadastre uma em Configurações
                        </Link>
                        .
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button onClick={handleCreate} disabled={creating || !name.trim()}>
                    {creating ? "Criando..." : "Criar agente"}
                  </Button>
                  <Button variant="secondary" onClick={closeCreate}>
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-ivory font-medium mb-1">Agente criado</h2>
                <p className="text-steel text-sm mb-4">
                  Cole essa URL como webhook de mensagens na instância Z-API correspondente (painel da Z-API →
                  Webhooks → Ao receber). O agente começa pausado — ative em Agentes assim que o cérebro estiver
                  pronto.
                </p>
                <div className="flex items-center gap-2 p-3 rounded-[10px] border border-white/10 bg-venture-black">
                  <code className="text-ivory text-sm flex-1 truncate font-mono">{createdWebhook}</code>
                  <button onClick={copyWebhook} className="text-steel hover:text-ivory shrink-0" aria-label="Copiar">
                    {copied ? <Check size={16} className="text-[#4ade80]" /> : <Copy size={16} />}
                  </button>
                </div>
                <Button className="mt-4" onClick={closeCreate}>
                  Concluir
                </Button>
              </>
            )}
          </Card>
        )}

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
