import { getLists, getBoardCardsDetailed, type TrelloCardDetailed } from "../../lib/trello.js";
import { askClaude } from "../../lib/claude.js";
import { sendTextMessage } from "../../lib/zapi.js";
import { AM_CLIENT_BOARDS, trelloCreds, zapiCreds } from "./config.js";
import { GERENTE_SYSTEM_PROMPT, RONDA_SYSTEM_PROMPT, PLANEJAMENTO_SYSTEM_PROMPT } from "./prompts.js";

const WEEKDAY_PT = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

function formatCard(card: TrelloCardDetailed, listNameById: Map<string, string>): string {
  const lines = [
    `- "${card.name}" (${card.shortUrl})`,
    `  lista: ${listNameById.get(card.idList) ?? "?"}`,
    `  responsável: ${card.memberNames.join(", ") || "(sem responsável)"}`,
    `  prazo: ${card.due ? new Date(card.due).toLocaleDateString("pt-BR") + (card.dueComplete ? " (marcado concluído)" : "") : "(sem prazo)"}`,
    `  última atividade: ${new Date(card.dateLastActivity).toLocaleDateString("pt-BR")}`,
  ];
  if (card.labels.length > 0) lines.push(`  etiquetas: ${card.labels.map((l) => l.name || l.color).join(", ")}`);
  if (card.checklists.length > 0) {
    for (const cl of card.checklists) {
      const done = cl.checkItems.filter((i) => i.state === "complete").length;
      lines.push(`  checklist "${cl.name}": ${done}/${cl.checkItems.length} concluído`);
    }
  }
  if (card.comments.length > 0) {
    lines.push(`  comentários (mais recente primeiro):`);
    for (const c of card.comments.slice().reverse().slice(0, 10)) {
      lines.push(`    [${new Date(c.date).toLocaleDateString("pt-BR")}] ${c.memberName}: ${c.text}`);
    }
  }
  return lines.join("\n");
}

async function fetchBoardContext(boardId: string, label: string): Promise<string> {
  const creds = trelloCreds();
  const [lists, cards] = await Promise.all([getLists(creds, boardId), getBoardCardsDetailed(creds, boardId)]);
  const listNameById = new Map(lists.map((l) => [l.id, l.name]));

  const header = `=== CLIENTE: ${label} ===\nListas deste board: ${lists.map((l) => l.name).join(", ")}\nTotal de cards: ${cards.length}\n`;
  const body = cards.map((c) => formatCard(c, listNameById)).join("\n\n");
  return `${header}\n${body}`;
}

async function fetchAllBoardsContext(): Promise<string> {
  const parts = await Promise.all(AM_CLIENT_BOARDS.map((b) => fetchBoardContext(b.trelloBoardId, b.label)));
  return parts.join("\n\n");
}

function nowContext(): string {
  const now = new Date();
  const fortaleza = new Date(now.toLocaleString("en-US", { timeZone: "America/Fortaleza" }));
  return `Data/hora atual (America/Fortaleza): ${fortaleza.toLocaleDateString("pt-BR")}, ${WEEKDAY_PT[fortaleza.getDay()]}, ${fortaleza.toLocaleTimeString("pt-BR")}.`;
}

export type GerenteRun = "abertura" | "fechamento" | "relatorio-semana" | "balanco-semana";

export async function generateGerenteReport(run: GerenteRun): Promise<string> {
  const context = await fetchAllBoardsContext();
  const runLabel: Record<GerenteRun, string> = {
    abertura: "Relatório de abertura do dia.",
    fechamento: "Relatório de fechamento do dia.",
    "relatorio-semana": "Hoje é segunda-feira: este é o RELATÓRIO DA SEMANA (substitui a abertura normal).",
    "balanco-semana": "Hoje é sexta-feira: este é o BALANÇO DA SEMANA (substitui o fechamento normal).",
  };
  const prompt = `${nowContext()}\n${runLabel[run]}\n\nDADOS DOS BOARDS (um por cliente):\n\n${context}`;
  return askClaude({ system: GERENTE_SYSTEM_PROMPT, prompt, maxTokens: 4000 });
}

export async function generateRondaReport(): Promise<string> {
  const context = await fetchAllBoardsContext();
  const prompt = `${nowContext()}\nHoje é dia de ronda.\n\nDADOS DOS BOARDS (um por cliente):\n\n${context}`;
  return askClaude({ system: RONDA_SYSTEM_PROMPT, prompt, maxTokens: 4000 });
}

export async function generatePlanejamentoReport(): Promise<string> {
  const context = await fetchAllBoardsContext();
  const prompt = `${nowContext()}\nHoje é quarta-feira: planejamento da próxima semana.\n\nDADOS DOS BOARDS (um por cliente):\n\n${context}`;
  return askClaude({ system: PLANEJAMENTO_SYSTEM_PROMPT, prompt, maxTokens: 4000 });
}

export async function sendAmOpsMessage(phone: string, text: string): Promise<void> {
  if (!phone) throw new Error("Telefone de destino não configurado (AM_ALANA_PHONE / AM_RONDA_COLLABORATOR_PHONE)");
  await sendTextMessage(zapiCreds(), phone, text);
}
