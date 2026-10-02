import { useEffect, useState } from "react";
import {
  Smartphone,
  Workflow,
  Landmark,
  Calculator,
  Globe,
  Eye,
  EyeOff,
  Trash2,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
import { DashboardLayout } from "../../components/DashboardLayout";
import { Card } from "../../components/ui/Card";
import { Input, Label } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Switch } from "../../components/ui/Switch";
import { Modal } from "../../components/ui/Modal";
import { useAgentsData, ZapiInstanceRow } from "../../lib/useAgents";
import { supabase } from "../../lib/supabase";

interface ExternalApiRow {
  id: string;
  name: string;
  base_url: string;
  auth_type: "none" | "bearer" | "api_key" | "basic";
  auth_header: string | null;
  auth_value: string | null;
}

interface ExternalApiRouteRow {
  id: string;
  api_id: string;
  method: string;
  path: string;
  label: string;
  returns: string;
}

const AUTH_LABELS: Record<ExternalApiRow["auth_type"], string> = {
  none: "Sem autenticação",
  bearer: "Bearer token",
  api_key: "Header de API key",
  basic: "Basic auth (usuário:senha)",
};

// Integrações mostradas aqui refletem o que esse tenant realmente tem configurado
// — não é uma lista fixa igual pra todo mundo. Z-API e API externa já são
// auto-serviço (o próprio tenant cadastra); Conta Azul e Nibo ainda não têm
// conector pronto, aparecem como roadmap até ganharem um.
interface ExternalApiPreset {
  name: string;
  baseUrl: string;
  authType: ExternalApiRow["auth_type"];
  authHeader?: string;
}

type ModalKind = "zapi" | "trello" | "external" | null;

export function SettingsPage() {
  const { tenantId, tenantName, clientsByAgent, zapiInstances, agents, refetch } = useAgentsData();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [externalApiNames, setExternalApiNames] = useState<string[]>([]);
  const [preset, setPreset] = useState<ExternalApiPreset | null>(null);
  const [activeModal, setActiveModal] = useState<ModalKind>(null);
  const [trelloConfigured, setTrelloConfigured] = useState(false);

  const hasContaAzul = externalApiNames.includes("Conta Azul");
  const hasNibo = externalApiNames.includes("Nibo");

  function configureIntegration(p: ExternalApiPreset) {
    setPreset(p);
    setActiveModal("external");
  }

  useEffect(() => {
    setName(tenantName);
  }, [tenantName]);

  // Status real do grid não pode depender de já ter aberto o modal (os modais
  // só montam o conteúdo quando abertos) — busca leve só pra saber o que já
  // está configurado, independente do usuário ter clicado em algo ainda.
  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    supabase
      .from("external_apis")
      .select("name")
      .then(({ data }) => {
        if (!cancelled) setExternalApiNames((data ?? []).map((r) => r.name));
      });
    supabase
      .from("trello_credentials")
      .select("tenant_id")
      .eq("tenant_id", tenantId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setTrelloConfigured(!!data);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const hasTrello = Object.values(clientsByAgent).some((list) => list.length > 0) || trelloConfigured;
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
            Conexões disponíveis pra essa empresa. Z-API e API externa você mesmo cadastra abaixo; as demais
            entram aqui assim que o conector for construído.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <IntegrationStatus
              icon={Smartphone}
              name="Z-API (WhatsApp)"
              desc="Canal operacional dos agentes"
              status={zapiInstances.length > 0 ? `Conectado (${zapiInstances.length})` : "Não configurado"}
              connected={zapiInstances.length > 0}
              cta={zapiInstances.length > 0 ? "Gerenciar" : "Configurar"}
              onClick={() => setActiveModal("zapi")}
            />
            <IntegrationStatus
              icon={Workflow}
              name="Trello"
              desc="Boards de acompanhamento dos clientes"
              status={hasTrello ? "Conectado" : "Não configurado"}
              connected={hasTrello}
              cta={hasTrello ? "Gerenciar" : "Configurar"}
              onClick={() => setActiveModal("trello")}
            />
            <IntegrationStatus
              icon={Landmark}
              name="Conta Azul"
              desc="Financeiro e faturamento"
              status={hasContaAzul ? "Conectado" : "Não configurado"}
              connected={hasContaAzul}
              cta={hasContaAzul ? "Gerenciar" : "Configurar"}
              onClick={() =>
                configureIntegration({ name: "Conta Azul", baseUrl: "https://api.contaazul.com", authType: "bearer" })
              }
            />
            <IntegrationStatus
              icon={Calculator}
              name="Nibo"
              desc="Contabilidade e obrigações"
              status={hasNibo ? "Conectado" : "Não configurado"}
              connected={hasNibo}
              cta={hasNibo ? "Gerenciar" : "Configurar"}
              onClick={() =>
                configureIntegration({
                  name: "Nibo",
                  baseUrl: "https://api.nibo.com.br/empresas/v1",
                  authType: "api_key",
                  authHeader: "apitoken",
                })
              }
            />
            <IntegrationStatus
              icon={Globe}
              name="API externa"
              desc="Qualquer outra API que você queira mapear"
              status={externalApiNames.length > 0 ? `Conectado (${externalApiNames.length})` : "Não configurado"}
              connected={externalApiNames.length > 0}
              cta={externalApiNames.length > 0 ? "Gerenciar" : "Configurar"}
              onClick={() => setActiveModal("external")}
            />
          </div>
        </Card>
      </div>

      <Modal
        open={activeModal === "zapi"}
        onClose={() => setActiveModal(null)}
        title="Instâncias Z-API"
        description="Credenciais do WhatsApp dos seus agentes. Pode ter mais de uma instância — um agente novo escolhe qual usar na criação."
      >
        <ZapiSection instances={zapiInstances} agents={agents} tenantId={tenantId} onChange={refetch} />
      </Modal>

      <Modal
        open={activeModal === "trello"}
        onClose={() => setActiveModal(null)}
        title="Trello"
        description="Credencial usada pelos agentes pra consultar boards e cards dos seus clientes."
      >
        <TrelloSection tenantId={tenantId} onConfigured={setTrelloConfigured} />
      </Modal>

      <Modal
        open={activeModal === "external"}
        onClose={() => {
          setActiveModal(null);
          setPreset(null);
        }}
        title="APIs externas"
        description="Cadastre qualquer API que queira consumir (ERP, financeiro, sistema interno) e mapeie as rotas que importam, com o que cada uma retorna."
        maxWidth="max-w-2xl"
      >
        <ExternalApisSection
          tenantId={tenantId}
          preset={preset}
          onPresetConsumed={() => setPreset(null)}
          onApisChange={(rows) => setExternalApiNames(rows.map((r) => r.name))}
        />
      </Modal>
    </DashboardLayout>
  );
}

function IntegrationStatus({
  icon: Icon,
  name,
  desc,
  status,
  connected,
  cta,
  onClick,
}: {
  icon: typeof Smartphone;
  name: string;
  desc: string;
  status: string;
  connected?: boolean;
  cta?: string;
  onClick?: () => void;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-[10px] border border-white/[0.06] bg-venture-black">
      <div className="w-9 h-9 shrink-0 rounded-md bg-electric-blue/10 flex items-center justify-center">
        <Icon size={17} className="text-electric-blue" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-ivory text-sm font-medium">{name}</p>
          {onClick && cta && (
            <button type="button" onClick={onClick} className="text-electric-blue text-xs font-medium shrink-0 hover:underline">
              {cta}
            </button>
          )}
        </div>
        <p className="text-steel text-xs mt-0.5">{desc}</p>
        <Badge tone={connected ? "success" : "neutral"} className="mt-2">
          {status}
        </Badge>
      </div>
    </div>
  );
}

// ─── Z-API: instâncias cadastradas pelo tenant ────────────────────────
function ZapiSection({
  instances,
  agents,
  tenantId,
  onChange,
}: {
  instances: ZapiInstanceRow[];
  agents: { id: string; name: string; zapi_instance_id: string | null }[];
  tenantId: string;
  onChange: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [instanceId, setInstanceId] = useState("");
  const [token, setToken] = useState("");
  const [clientToken, setClientToken] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function resetForm() {
    setLabel("");
    setInstanceId("");
    setToken("");
    setClientToken("");
    setBaseUrl("");
  }

  async function handleCreate() {
    if (!tenantId || !label.trim() || !instanceId.trim() || !token.trim()) return;
    setCreating(true);
    const { error } = await supabase.from("zapi_instances").insert({
      tenant_id: tenantId,
      label: label.trim(),
      instance_id: instanceId.trim(),
      token: token.trim(),
      client_token: clientToken.trim() || null,
      base_url: baseUrl.trim() || null,
    });
    setCreating(false);
    if (!error) {
      resetForm();
      setShowForm(false);
      onChange();
    }
  }

  async function handleDelete(instance: ZapiInstanceRow) {
    const usedBy = agents.filter((a) => a.zapi_instance_id === instance.id).map((a) => a.name);
    const warning =
      usedBy.length > 0
        ? `Os agentes ${usedBy.join(", ")} usam essa instância e ficarão sem WhatsApp configurado. `
        : "";
    if (!window.confirm(`${warning}Remover a instância "${instance.label}"?`)) return;
    setDeletingId(instance.id);
    await supabase.from("zapi_instances").delete().eq("id", instance.id);
    setDeletingId(null);
    onChange();
  }

  return (
    <div>
      <div className="flex items-center justify-end">
        <Button variant="secondary" size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus size={14} /> Nova instância
        </Button>
      </div>

      {instances.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {instances.map((inst) => (
            <div
              key={inst.id}
              className="flex items-center justify-between gap-3 p-3 rounded-[10px] border border-white/[0.06] bg-venture-black"
            >
              <div className="min-w-0">
                <p className="text-ivory text-sm font-medium">{inst.label}</p>
                <p className="text-steel text-xs mt-0.5 font-mono">
                  id: {inst.instance_id} · token: {revealed[inst.id] ? inst.token : "•".repeat(10)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setRevealed((r) => ({ ...r, [inst.id]: !r[inst.id] }))}
                  className="p-2 text-steel hover:text-ivory"
                  aria-label="Mostrar/ocultar token"
                >
                  {revealed[inst.id] ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(inst)}
                  disabled={deletingId === inst.id}
                  className="p-2 text-steel hover:text-[#f87171]"
                  aria-label="Remover instância"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {instances.length === 0 && !showForm && (
        <p className="text-steel text-sm mt-4">Nenhuma instância cadastrada ainda.</p>
      )}

      {showForm && (
        <div className="mt-4 p-4 rounded-[10px] border border-white/10 bg-venture-black">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Nome (uso interno)</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex.: WhatsApp comercial" />
            </div>
            <div>
              <Label>Instance ID</Label>
              <Input value={instanceId} onChange={(e) => setInstanceId(e.target.value)} />
            </div>
            <div>
              <Label>Token</Label>
              <Input value={token} onChange={(e) => setToken(e.target.value)} />
            </div>
            <div>
              <Label>Client-Token (opcional)</Label>
              <Input value={clientToken} onChange={(e) => setClientToken(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>Base URL (opcional — padrão https://api.z-api.io)</Label>
              <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.z-api.io" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={creating || !label.trim() || !instanceId.trim() || !token.trim()}
            >
              {creating ? "Salvando..." : "Salvar instância"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── API externa: catálogo de APIs + rotas mapeadas pelo tenant ──────
function ExternalApisSection({
  tenantId,
  preset,
  onPresetConsumed,
  onApisChange,
}: {
  tenantId: string;
  preset?: ExternalApiPreset | null;
  onPresetConsumed?: () => void;
  onApisChange?: (apis: ExternalApiRow[]) => void;
}) {
  const [apis, setApis] = useState<ExternalApiRow[]>([]);
  const [routesByApi, setRoutesByApi] = useState<Record<string, ExternalApiRouteRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [apiName, setApiName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [authType, setAuthType] = useState<ExternalApiRow["auth_type"]>("none");
  const [authHeader, setAuthHeader] = useState("");
  const [authValue, setAuthValue] = useState("");
  const [creatingApi, setCreatingApi] = useState(false);

  const [routeForm, setRouteForm] = useState<Record<string, { method: string; path: string; label: string; returns: string }>>({});
  const [creatingRoute, setCreatingRoute] = useState<string | null>(null);

  async function load() {
    const { data: apiRows } = await supabase
      .from("external_apis")
      .select("id,name,base_url,auth_type,auth_header,auth_value")
      .order("name");
    setApis(apiRows ?? []);
    onApisChange?.(apiRows ?? []);

    const apiIds = (apiRows ?? []).map((a) => a.id);
    if (apiIds.length > 0) {
      const { data: routeRows } = await supabase
        .from("external_api_routes")
        .select("id,api_id,method,path,label,returns")
        .in("api_id", apiIds)
        .order("created_at");
      const byApi: Record<string, ExternalApiRouteRow[]> = {};
      (routeRows ?? []).forEach((r) => {
        byApi[r.api_id] = [...(byApi[r.api_id] ?? []), r];
      });
      setRoutesByApi(byApi);
    } else {
      setRoutesByApi({});
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clicar em "Configurar" num card de integração (Conta Azul, Nibo) pré-preenche
  // esse formulário em vez de abrir em branco — mesmo catálogo por baixo, só
  // com um atalho pros provedores mais comuns.
  useEffect(() => {
    if (!preset) return;
    const existing = apis.find((a) => a.name === preset.name);
    if (existing) {
      setExpanded((e) => ({ ...e, [existing.id]: true }));
    } else {
      setApiName(preset.name);
      setBaseUrl(preset.baseUrl);
      setAuthType(preset.authType);
      setAuthHeader(preset.authHeader ?? "");
      setShowForm(true);
    }
    onPresetConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset]);

  function resetApiForm() {
    setApiName("");
    setBaseUrl("");
    setAuthType("none");
    setAuthHeader("");
    setAuthValue("");
  }

  async function handleCreateApi() {
    if (!tenantId || !apiName.trim() || !baseUrl.trim()) return;
    setCreatingApi(true);
    const { error } = await supabase.from("external_apis").insert({
      tenant_id: tenantId,
      name: apiName.trim(),
      base_url: baseUrl.trim(),
      auth_type: authType,
      auth_header: authType === "api_key" ? authHeader.trim() || null : null,
      auth_value: authType === "none" ? null : authValue.trim() || null,
    });
    setCreatingApi(false);
    if (!error) {
      resetApiForm();
      setShowForm(false);
      load();
    }
  }

  async function handleDeleteApi(api: ExternalApiRow) {
    if (!window.confirm(`Remover "${api.name}" e todas as rotas mapeadas dela?`)) return;
    await supabase.from("external_apis").delete().eq("id", api.id);
    load();
  }

  async function handleCreateRoute(apiId: string) {
    const form = routeForm[apiId];
    if (!form?.path.trim() || !form?.label.trim()) return;
    setCreatingRoute(apiId);
    const { error } = await supabase.from("external_api_routes").insert({
      api_id: apiId,
      method: form.method || "GET",
      path: form.path.trim(),
      label: form.label.trim(),
      returns: form.returns.trim(),
    });
    setCreatingRoute(null);
    if (!error) {
      setRouteForm((f) => ({ ...f, [apiId]: { method: "GET", path: "", label: "", returns: "" } }));
      load();
    }
  }

  async function handleDeleteRoute(routeId: string) {
    await supabase.from("external_api_routes").delete().eq("id", routeId);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-end">
        <Button variant="secondary" size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus size={14} /> Nova API
        </Button>
      </div>

      {!loading && apis.length === 0 && !showForm && (
        <p className="text-steel text-sm mt-4">Nenhuma API externa cadastrada ainda.</p>
      )}

      {showForm && (
        <div className="mt-4 p-4 rounded-[10px] border border-white/10 bg-venture-black">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Nome</Label>
              <Input value={apiName} onChange={(e) => setApiName(e.target.value)} placeholder="Ex.: ERP interno" />
            </div>
            <div>
              <Label>Base URL</Label>
              <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.exemplo.com" />
            </div>
            <div>
              <Label>Autenticação</Label>
              <select
                value={authType}
                onChange={(e) => setAuthType(e.target.value as ExternalApiRow["auth_type"])}
                className="w-full bg-venture-black border border-white/10 rounded-[10px] px-3.5 py-2.5 text-[0.95rem] text-ivory"
              >
                {(Object.keys(AUTH_LABELS) as ExternalApiRow["auth_type"][]).map((t) => (
                  <option key={t} value={t}>
                    {AUTH_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            {authType === "api_key" && (
              <div>
                <Label>Nome do header</Label>
                <Input value={authHeader} onChange={(e) => setAuthHeader(e.target.value)} placeholder="X-API-Key" />
              </div>
            )}
            {authType !== "none" && (
              <div className={authType === "api_key" ? "" : "sm:col-span-2"}>
                <Label>{authType === "basic" ? "usuário:senha" : "Token / chave"}</Label>
                <Input value={authValue} onChange={(e) => setAuthValue(e.target.value)} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button size="sm" onClick={handleCreateApi} disabled={creatingApi || !apiName.trim() || !baseUrl.trim()}>
              {creatingApi ? "Salvando..." : "Salvar API"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {apis.map((api) => {
          const routes = routesByApi[api.id] ?? [];
          const isOpen = expanded[api.id] ?? false;
          const form = routeForm[api.id] ?? { method: "GET", path: "", label: "", returns: "" };
          return (
            <div key={api.id} className="rounded-[10px] border border-white/[0.06] bg-venture-black overflow-hidden">
              <div className="flex items-center justify-between gap-3 p-3">
                <button
                  type="button"
                  onClick={() => setExpanded((e) => ({ ...e, [api.id]: !isOpen }))}
                  className="flex items-center gap-2 min-w-0 flex-1 text-left"
                >
                  {isOpen ? (
                    <ChevronUp size={15} className="text-steel shrink-0" />
                  ) : (
                    <ChevronDown size={15} className="text-steel shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-ivory text-sm font-medium">{api.name}</p>
                    <p className="text-steel text-xs mt-0.5 font-mono truncate">{api.base_url}</p>
                  </div>
                </button>
                <Badge tone="neutral" className="shrink-0">
                  {routes.length} rota{routes.length === 1 ? "" : "s"}
                </Badge>
                <button
                  type="button"
                  onClick={() => handleDeleteApi(api)}
                  className="p-2 text-steel hover:text-[#f87171] shrink-0"
                  aria-label="Remover API"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {isOpen && (
                <div className="border-t border-white/[0.06] p-3">
                  {routes.length > 0 && (
                    <div className="flex flex-col gap-2 mb-3">
                      {routes.map((r) => (
                        <div key={r.id} className="flex items-start justify-between gap-3 p-2.5 rounded-[8px] bg-graphite/40">
                          <div className="min-w-0">
                            <p className="text-ivory text-sm">
                              <span className="text-electric-blue font-mono text-xs mr-2">{r.method}</span>
                              {r.label}
                            </p>
                            <p className="text-steel text-xs font-mono mt-0.5">{r.path}</p>
                            {r.returns && <p className="text-steel text-xs mt-1">{r.returns}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteRoute(r.id)}
                            className="p-1.5 text-steel hover:text-[#f87171] shrink-0"
                            aria-label="Remover rota"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-[100px_1fr] gap-2">
                    <select
                      value={form.method}
                      onChange={(e) => setRouteForm((f) => ({ ...f, [api.id]: { ...form, method: e.target.value } }))}
                      className="bg-black border border-white/10 rounded-[10px] px-2 py-2 text-sm text-ivory"
                    >
                      {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <Input
                      value={form.path}
                      onChange={(e) => setRouteForm((f) => ({ ...f, [api.id]: { ...form, path: e.target.value } }))}
                      placeholder="/clientes/{id}/faturas"
                    />
                  </div>
                  <Input
                    className="mt-2"
                    value={form.label}
                    onChange={(e) => setRouteForm((f) => ({ ...f, [api.id]: { ...form, label: e.target.value } }))}
                    placeholder="Nome curto — ex.: Listar faturas do cliente"
                  />
                  <textarea
                    value={form.returns}
                    onChange={(e) => setRouteForm((f) => ({ ...f, [api.id]: { ...form, returns: e.target.value } }))}
                    placeholder="O que essa rota retorna (texto livre)"
                    rows={2}
                    className="mt-2 w-full bg-black border border-white/10 rounded-[10px] px-3.5 py-2.5 text-sm text-ivory placeholder:text-steel/60 outline-none focus:border-electric-blue"
                  />
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => handleCreateRoute(api.id)}
                    disabled={creatingRoute === api.id || !form.path.trim() || !form.label.trim()}
                  >
                    {creatingRoute === api.id ? "Salvando..." : "Adicionar rota"}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Trello: credencial única por tenant ──────────────────────────────
function TrelloSection({
  tenantId,
  onConfigured,
}: {
  tenantId: string;
  onConfigured?: (configured: boolean) => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    supabase
      .from("trello_credentials")
      .select("api_key,api_token,updated_at")
      .eq("tenant_id", tenantId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          setApiKey(data.api_key);
          setApiToken(data.api_token);
          setSavedAt(data.updated_at);
        }
        onConfigured?.(!!data);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  async function handleSave() {
    if (!tenantId || !apiKey.trim() || !apiToken.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("trello_credentials")
      .upsert(
        { tenant_id: tenantId, api_key: apiKey.trim(), api_token: apiToken.trim(), updated_at: new Date().toISOString() },
        { onConflict: "tenant_id" }
      );
    setSaving(false);
    if (!error) {
      setSavedAt(new Date().toISOString());
      onConfigured?.(true);
    }
  }

  async function handleRemove() {
    if (!window.confirm("Remover a credencial do Trello? Os agentes que dependem dela deixam de responder sobre boards.")) return;
    setRemoving(true);
    await supabase.from("trello_credentials").delete().eq("tenant_id", tenantId);
    setRemoving(false);
    setApiKey("");
    setApiToken("");
    setSavedAt(null);
    onConfigured?.(false);
  }

  if (loading) return <p className="text-steel text-sm">Carregando...</p>;

  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>API Key</Label>
          <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
        </div>
        <div>
          <Label>Token</Label>
          <div className="relative">
            <Input
              type={revealed ? "text" : "password"}
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-steel hover:text-ivory"
              aria-label="Mostrar/ocultar token"
            >
              {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
      </div>
      <p className="text-steel text-xs mt-2">
        Gere em{" "}
        <a href="https://trello.com/power-ups/admin" target="_blank" rel="noreferrer" className="text-electric-blue">
          trello.com/power-ups/admin
        </a>{" "}
        (criar um Power-Up seu dá acesso a API Key + Token).
      </p>
      <div className="flex items-center gap-2 mt-4">
        <Button size="sm" onClick={handleSave} disabled={saving || !apiKey.trim() || !apiToken.trim()}>
          {saving ? "Salvando..." : "Salvar credencial"}
        </Button>
        {savedAt && (
          <Button variant="secondary" size="sm" onClick={handleRemove} disabled={removing}>
            {removing ? "Removendo..." : "Remover"}
          </Button>
        )}
      </div>
    </div>
  );
}
