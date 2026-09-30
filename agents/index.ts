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
  management_phones: string[];
}

interface DbClient {
  id: string;
  agent_id: string;
  label: string;
}

interface DbBoard {
  client_id: string;
  trello_board_id: string;
  monitored_lists: string[];
}

async function buildAgentConfig(dbAgent: DbAgent): Promise<AgentConfig> {
  const clients = await sbGet<DbClient[]>(`/clients?agent_id=eq.${encodeURIComponent(dbAgent.id)}&select=*`);

  let boards: AgentBoard[] = [];
  if (clients.length > 0) {
    const clientIds = clients.map((c) => c.id).join(",");
    const boardRows = await sbGet<DbBoard[]>(`/boards?client_id=in.(${clientIds})&select=*`);
    const clientById = new Map(clients.map((c) => [c.id, c]));
    boards = boardRows.map((b) => {
      const client = clientById.get(b.client_id)!;
      return {
        id: client.id,
        label: client.label,
        trelloBoardId: b.trello_board_id,
        monitoredLists: b.monitored_lists ?? [],
      };
    });
  }

  return {
    id: dbAgent.id,
    name: dbAgent.name,
    boards,
    managementPhones: dbAgent.management_phones ?? [],
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
  const rows = await sbGet<{ content: string }[]>(
    `/brains?agent_id=eq.${encodeURIComponent(agent.id)}&select=content`
  );
  return rows[0]?.content ?? "";
}
