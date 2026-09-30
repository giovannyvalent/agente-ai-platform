import type { AgentConfig, AgentBoard } from "./types.js";
import { getAgentEnv } from "./env.js";
import { getLists, getBoardCards, isCardOverdue } from "./trello.js";
import type { TrelloCreds } from "./trello.js";

/**
 * Responde mensagens do WhatsApp com base em comandos fixos (sem IA) — consulta o
 * Trello de verdade e devolve o resultado formatado. Quando o Claude for ativado,
 * isso pode virar uma das "ferramentas" que a IA chama, mas por ora roda sozinho.
 */

function trelloCreds(agent: AgentConfig): TrelloCreds {
  return {
    key: getAgentEnv(agent.id, "TRELLO_API_KEY"),
    token: getAgentEnv(agent.id, "TRELLO_API_TOKEN"),
  };
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function findBoard(agent: AgentConfig, text: string): AgentBoard | undefined {
  const n = normalize(text);
  return (agent.boards ?? []).find((b) => n.includes(normalize(b.label)) || n.includes(normalize(b.id)));
}

async function formatBoardStatus(agent: AgentConfig, board: AgentBoard): Promise<string> {
  const creds = trelloCreds(agent);
  const [lists, cards] = await Promise.all([
    getLists(creds, board.trelloBoardId),
    getBoardCards(creds, board.trelloBoardId),
  ]);
  const listNameById = new Map(lists.map((l) => [l.id, l.name]));
  const overdue = cards.filter(isCardOverdue);

  if (overdue.length === 0) {
    return `✅ *${board.label}*\n${cards.length} cards no total, nenhum atrasado.`;
  }

  const lines = overdue
    .slice(0, 15)
    .map(
      (c) =>
        `• ${c.name} — venceu em ${new Date(c.due!).toLocaleDateString("pt-BR")} (${listNameById.get(c.idList) ?? "?"})\n  ${c.shortUrl}`
    );
  const extra = overdue.length > 15 ? `\n\n… e mais ${overdue.length - 15}.` : "";

  return `🔴 *${board.label}* — ${overdue.length} atrasado${overdue.length > 1 ? "s" : ""} de ${cards.length} cards\n\n${lines.join("\n\n")}${extra}`;
}

async function formatSearch(agent: AgentConfig, query: string, board?: AgentBoard): Promise<string> {
  const creds = trelloCreds(agent);
  const boards = board ? [board] : agent.boards ?? [];
  const q = normalize(query);
  const matches: string[] = [];

  for (const b of boards) {
    const [lists, cards] = await Promise.all([
      getLists(creds, b.trelloBoardId),
      getBoardCards(creds, b.trelloBoardId),
    ]);
    const listNameById = new Map(lists.map((l) => [l.id, l.name]));
    for (const c of cards) {
      if (normalize(c.name).includes(q)) {
        const dueStr = c.due
          ? ` — prazo ${new Date(c.due).toLocaleDateString("pt-BR")}${c.dueComplete ? " ✅" : ""}`
          : "";
        matches.push(`• [${b.label}] ${c.name}${dueStr} (${listNameById.get(c.idList) ?? "?"})\n  ${c.shortUrl}`);
      }
    }
  }

  if (matches.length === 0) return `Não achei nenhum card com "${query}".`;
  const extra = matches.length > 15 ? `\n\n… e mais ${matches.length - 15}.` : "";
  return `🔎 *Busca: "${query}"* (${matches.length} resultado${matches.length > 1 ? "s" : ""})\n\n${matches.slice(0, 15).join("\n\n")}${extra}`;
}

function helpText(agent: AgentConfig): string {
  const clients = (agent.boards ?? []).map((b) => `• ${b.label}`).join("\n") || "(nenhum cliente cadastrado)";
  return (
    `Comandos que eu entendo:\n\n` +
    `*status* — resumo de atrasados de todos os clientes\n` +
    `*status <cliente>* — só desse cliente\n` +
    `*buscar <termo>* — procura card pelo nome\n` +
    `*clientes* — lista quem eu acompanho\n\n` +
    `Clientes atuais:\n${clients}`
  );
}

export async function handleCommand(agent: AgentConfig, text: string): Promise<string> {
  const n = normalize(text);
  const boards = agent.boards ?? [];

  if (boards.length === 0) {
    return "Ainda não tenho nenhum board do Trello configurado pra consultar.";
  }

  if (n === "clientes" || n === "boards") {
    return `Clientes que acompanho:\n\n${boards.map((b) => `• ${b.label}`).join("\n")}`;
  }

  if (n.startsWith("buscar") || n.startsWith("procurar")) {
    const query = text.replace(/^\s*(buscar|procurar)\s*/i, "").trim();
    if (!query) return "Manda assim: *buscar <termo>* (ex.: buscar vitamina d)";
    const board = findBoard(agent, text);
    return formatSearch(agent, query, board);
  }

  if (n.startsWith("status") || n.includes("atrasad")) {
    const board = findBoard(agent, text);
    if (board) return formatBoardStatus(agent, board);
    const parts = await Promise.all(boards.map((b) => formatBoardStatus(agent, b)));
    return parts.join("\n\n---\n\n");
  }

  return helpText(agent);
}
