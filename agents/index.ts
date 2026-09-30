import type { AgentConfig, AgentBoard } from "../lib/types.js";

/**
 * Registro de agentes — lido do Supabase (tabelas agents/clients/boards/brains),
 * não mais de arquivos no repo. Adicionar um cliente novo ou mudar o cérebro vira
 * um INSERT/UPDATE no banco, sem precisar de deploy. Ver supabase/migrations/ e
 * SQL_MIGRATIONS.md para o schema.
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? "";

function requireSupabaseEnv(): void {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    throw new Error("SUPABASE_URL / SUPABASE_SECRET_KEY não configurados");
  }
}

async function sbGet<T>(path: string): Promise<T> {
  requireSupabaseEnv();
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase error (${path}): ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

interface DbAgent {
  id: string;
  name: string;
  enabled: boolean;
  claude_model: string | null;
}

interface DbBoardWithClient {
  trello_board_id: string;
  monitored_lists: string[];
  clients: { id: string; label: string } | null; // embed via FK (boards.client_id -> clients.id)
}

// Telefones de gestão não vêm mais de coluna nenhuma — são extraídos direto do
// texto do cérebro (ex.: "- Alana Miranda — 5511966477472"). Editar o cérebro no
// painel já edita quem recebe alerta, sem precisar de tabela/campo separado.
function extractPhonesFromBrain(content: string): string[] {
  const matches = content.match(/\b55\d{10,11}\b/g) ?? [];
  return [...new Set(matches)];
}

async function fetchBrainContent(agentId: string): Promise<string> {
  const rows = await sbGet<{ content: string }[]>(
    `/brains?agent_id=eq.${encodeURIComponent(agentId)}&select=content`
  );
  return rows[0]?.content ?? "";
}

async function buildAgentConfig(dbAgent: DbAgent): Promise<AgentConfig> {
  // boards.agent_id liga direto ao agente; o embed `clients(...)` traz o label do
  // cliente numa query só (cliente pode ser acompanhado por mais de um agente do
  // mesmo tenant, então o vínculo relevante aqui é sempre por board, não por cliente).
  const [boardRows, brainContent] = await Promise.all([
    sbGet<DbBoardWithClient[]>(
      `/boards?agent_id=eq.${encodeURIComponent(dbAgent.id)}&select=trello_board_id,monitored_lists,clients(id,label)`
    ),
    fetchBrainContent(dbAgent.id),
  ]);

  const boards: AgentBoard[] = boardRows
    .filter((b): b is DbBoardWithClient & { clients: { id: string; label: string } } => b.clients !== null)
    .map((b) => ({
      id: b.clients.id,
      label: b.clients.label,
      trelloBoardId: b.trello_board_id,
      monitoredLists: b.monitored_lists ?? [],
    }));

  return {
    id: dbAgent.id,
    name: dbAgent.name,
    boards,
    managementPhones: extractPhonesFromBrain(brainContent),
    claudeModel: dbAgent.claude_model ?? undefined,
    enabled: dbAgent.enabled,
  };
}

export async function getAgent(id: string): Promise<AgentConfig | undefined> {
  const rows = await sbGet<DbAgent[]>(`/agents?id=eq.${encodeURIComponent(id)}&select=*`);
  const dbAgent = rows[0];
  return dbAgent ? buildAgentConfig(dbAgent) : undefined;
}

export async function listAgents(): Promise<AgentConfig[]> {
  const rows = await sbGet<DbAgent[]>(`/agents?select=*`);
  return Promise.all(rows.map(buildAgentConfig));
}

export async function listEnabledAgents(): Promise<AgentConfig[]> {
  const agents = await listAgents();
  return agents.filter((a) => a.enabled);
}

export async function loadBrain(agent: AgentConfig): Promise<string> {
  return fetchBrainContent(agent.id);
}
