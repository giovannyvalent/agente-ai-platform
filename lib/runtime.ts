import type { AgentConfig } from "./types.js";
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
export async function handleIncomingTrelloEvent(agent: AgentConfig, body: unknown): Promise<void> {
  const action = (body as { action?: Record<string, any> } | undefined)?.action;
  if (!action) return;

  const type = action.type as string;
  const cardName = action.data?.card?.name as string | undefined;
  const listName = (action.data?.listAfter?.name ?? action.data?.list?.name) as string | undefined;

  console.log(`[${agent.id}] evento Trello:`, { type, cardName, listName });

  // Placeholder — a regra de quando alertar deve vir do brain.md deste agente.
  // Exemplo simples: avisa a gestão quando um card muda de lista.
  if (type === "updateCard" && action.data?.listAfter) {
    const msg = `📋 *[${agent.name}]* card *${cardName}* movido para *${listName}*`;
    await Promise.all(
      managementPhones(agent).map((phone) => sendTextMessage(zapiCreds(agent), phone, msg))
    );
  }
}

// ─── CRON — ciclo de monitoramento do board do agente ─────────────
export async function runMonitorCycle(agent: AgentConfig): Promise<void> {
  if (!agent.trelloBoardId) return;

  const tCreds = trelloCreds(agent);
  const [lists, cards] = await Promise.all([
    getLists(tCreds, agent.trelloBoardId),
    getBoardCards(tCreds, agent.trelloBoardId),
  ]);

  const allowedListIds = agent.monitoredLists?.length
    ? new Set(lists.filter((l) => agent.monitoredLists!.includes(l.name)).map((l) => l.id))
    : null;

  const overdue = cards
    .filter(isCardOverdue)
    .filter((c) => !allowedListIds || allowedListIds.has(c.idList));

  if (overdue.length === 0) return;

  const lines = overdue.map(
    (c) => `• ${c.name} — venceu em ${new Date(c.due!).toLocaleDateString("pt-BR")}\n  ${c.shortUrl}`
  );
  const digest = `🔴 *[${agent.name}] Cards atrasados* (${overdue.length})\n\n${lines.join("\n\n")}`;

  const zCreds = zapiCreds(agent);
  await Promise.all(managementPhones(agent).map((phone) => sendTextMessage(zCreds, phone, digest)));
}
