import type { AgentConfig, AgentBoard } from "./types.js";
import { getAgentEnv } from "./env.js";
import { sendTextMessage, isValidIncoming, extractText } from "./zapi.js";
import type { ZApiCreds, ZApiPayload } from "./zapi.js";
import { getLists, getBoardCards, isCardOverdue } from "./trello.js";
import type { TrelloCreds } from "./trello.js";
import { askClaude } from "./claude.js";
import { getHistory, pushHistory } from "./history.js";
import { loadBrain } from "../agents/index.js";

function zapiCreds(agent: AgentConfig): ZApiCreds {
  return {
    instanceId: getAgentEnv(agent.id, "ZAPI_INSTANCE_ID"),
    token: getAgentEnv(agent.id, "ZAPI_TOKEN"),
    clientToken: getAgentEnv(agent.id, "ZAPI_CLIENT_TOKEN"),
    baseUrl: getAgentEnv(agent.id, "ZAPI_BASE_URL"),
  };
}

function trelloCreds(agent: AgentConfig): TrelloCreds {
  return {
    key: getAgentEnv(agent.id, "TRELLO_API_KEY"),
    token: getAgentEnv(agent.id, "TRELLO_API_TOKEN"),
  };
}

function managementPhones(agent: AgentConfig): string[] {
  const fromEnv = getAgentEnv(agent.id, "MANAGEMENT_PHONES");
  if (fromEnv) return fromEnv.split(",").map((p) => p.trim()).filter(Boolean);
  return agent.managementPhones ?? [];
}

// ─── WHATSAPP — mensagem recebida ─────────────────────────────────
export async function handleIncomingWhatsApp(agent: AgentConfig, payload: ZApiPayload): Promise<void> {
  if (!isValidIncoming(payload)) return;

  const text = extractText(payload)!;
  const replyTo = payload.participantPhone ?? payload.phone;
  const historyKey = `${agent.id}:${replyTo}`;

  const brain = loadBrain(agent);
  const system = [
    `Você é "${agent.name}", um agente operacional que conversa via WhatsApp.`,
    `Seja direto, objetivo e responda sempre em português brasileiro.`,
    ``,
    `Base de conhecimento e regras deste agente (siga à risca):`,
    brain || "(nenhuma regra cadastrada ainda em brain.md — responda de forma genérica e avise que ainda está sendo configurado)",
  ].join("\n");

  const history = getHistory(historyKey);
  const reply = await askClaude(system, history, text, agent.claudeModel);

  pushHistory(historyKey, "user", text);
  pushHistory(historyKey, "assistant", reply);

  await sendTextMessage(zapiCreds(agent), replyTo, reply);
}

// ─── TRELLO — evento recebido via webhook ─────────────────────────
// Um agente pode ter vários boards; o webhook do Trello manda o id do board no
// payload, então resolvemos qual AgentBoard corresponde antes de agir.
export async function handleIncomingTrelloEvent(agent: AgentConfig, body: unknown): Promise<void> {
  const action = (body as { action?: Record<string, any> } | undefined)?.action;
  if (!action) return;

  const boardId = action.data?.board?.id as string | undefined;
  const board = agent.boards?.find((b) => b.trelloBoardId === boardId);
  if (!board) {
    console.log(`[${agent.id}] evento Trello de board não cadastrado:`, boardId);
    return;
  }

  const type = action.type as string;
  const cardName = action.data?.card?.name as string | undefined;
  const listName = (action.data?.listAfter?.name ?? action.data?.list?.name) as string | undefined;

  console.log(`[${agent.id}] evento Trello [${board.label}]:`, { type, cardName, listName });

  // Placeholder — a regra de quando alertar deve vir do brain.md deste agente.
  // Exemplo simples: avisa a gestão quando um card muda de lista.
  if (type === "updateCard" && action.data?.listAfter) {
    const msg = `📋 *[${board.label}]* card *${cardName}* movido para *${listName}*`;
    await Promise.all(
      managementPhones(agent).map((phone) => sendTextMessage(zapiCreds(agent), phone, msg))
    );
  }
}

// ─── CRON — ciclo de monitoramento de todos os boards do agente ──
async function checkBoardOverdue(tCreds: TrelloCreds, board: AgentBoard) {
  const [lists, cards] = await Promise.all([
    getLists(tCreds, board.trelloBoardId),
    getBoardCards(tCreds, board.trelloBoardId),
  ]);

  const allowedListIds = board.monitoredLists?.length
    ? new Set(lists.filter((l) => board.monitoredLists!.includes(l.name)).map((l) => l.id))
    : null;

  return cards.filter(isCardOverdue).filter((c) => !allowedListIds || allowedListIds.has(c.idList));
}

export async function runMonitorCycle(agent: AgentConfig): Promise<void> {
  if (!agent.boards?.length) return;

  const tCreds = trelloCreds(agent);
  const results = await Promise.allSettled(
    agent.boards.map(async (board) => ({ board, overdue: await checkBoardOverdue(tCreds, board) }))
  );

  const sections: string[] = [];
  for (const r of results) {
    if (r.status === "rejected") {
      console.error(`[${agent.id}] falha ao checar board:`, (r.reason as Error).message);
      continue;
    }
    const { board, overdue } = r.value;
    if (overdue.length === 0) continue;
    const lines = overdue.map(
      (c) => `• ${c.name} — venceu em ${new Date(c.due!).toLocaleDateString("pt-BR")}\n  ${c.shortUrl}`
    );
    sections.push(`*${board.label}* (${overdue.length} atrasado${overdue.length > 1 ? "s" : ""})\n${lines.join("\n\n")}`);
  }

  if (sections.length === 0) return;

  const digest = `🔴 *[${agent.name}] Cards atrasados*\n\n${sections.join("\n\n---\n\n")}`;
  const zCreds = zapiCreds(agent);
  await Promise.all(managementPhones(agent).map((phone) => sendTextMessage(zCreds, phone, digest)));
}
