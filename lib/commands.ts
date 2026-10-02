import type { AgentConfig, AgentBoard } from "./types.js";
import { getAgentEnv } from "./env.js";
import { getLists, getBoardCards, isCardOverdue } from "./trello.js";
import type { TrelloCreds, TrelloList } from "./trello.js";

/**
 * Responde mensagens do WhatsApp com base em comandos fixos (sem IA) — consulta o
 * Trello de verdade e devolve o resultado formatado. Quando o Claude for ativado,
 * isso pode virar uma das "ferramentas" que a IA chama, mas por ora roda sozinho.
 */

// Credencial cadastrada pelo tenant (tabela trello_credentials) tem
// prioridade; env var compartilhada é o fallback (continua funcionando sem
// precisar migrar quem já está rodando com ela).
function trelloCreds(agent: AgentConfig): TrelloCreds {
  if (agent.trello) return { key: agent.trello.key, token: agent.trello.token };
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

// Acha a lista/coluna mencionada na frase por sobreposição de palavras (ex.: "coluna
// setembro" bate com a lista "SETEMBRO"; "pendentes" bate com "CONTEÚDOS PENDENTES -
// AGUARDANDO INFO OU VÍDEO"). Pega a lista com mais palavras em comum, exige pelo menos 1.
function findList(lists: TrelloList[], text: string): TrelloList | undefined {
  const n = normalize(text);
  let best: TrelloList | undefined;
  let bestScore = 0;
  for (const l of lists) {
    const words = normalize(l.name).split(/\s+/).filter((w) => w.length > 2);
    const score = words.filter((w) => n.includes(w)).length;
    if (score > bestScore) {
      bestScore = score;
      best = l;
    }
  }
  return best;
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

const UPCOMING_DAYS = 7;

function isUpcoming(card: { due: string | null; dueComplete: boolean }): boolean {
  if (!card.due || card.dueComplete) return false;
  const dueTime = new Date(card.due).getTime();
  const now = Date.now();
  return dueTime >= now && dueTime <= now + UPCOMING_DAYS * 24 * 60 * 60 * 1000;
}

async function formatUpcoming(agent: AgentConfig, board: AgentBoard): Promise<string> {
  const creds = trelloCreds(agent);
  const [lists, cards] = await Promise.all([
    getLists(creds, board.trelloBoardId),
    getBoardCards(creds, board.trelloBoardId),
  ]);
  const listNameById = new Map(lists.map((l) => [l.id, l.name]));
  const upcoming = cards
    .filter(isUpcoming)
    .sort((a, b) => new Date(a.due!).getTime() - new Date(b.due!).getTime());

  if (upcoming.length === 0) {
    return `✅ *${board.label}*\nNenhum prazo nos próximos ${UPCOMING_DAYS} dias.`;
  }

  const lines = upcoming
    .slice(0, 15)
    .map(
      (c) =>
        `• ${c.name} — vence em ${new Date(c.due!).toLocaleDateString("pt-BR")} (${listNameById.get(c.idList) ?? "?"})\n  ${c.shortUrl}`
    );
  const extra = upcoming.length > 15 ? `\n\n… e mais ${upcoming.length - 15}.` : "";

  return `🟡 *${board.label}* — ${upcoming.length} prazo${upcoming.length > 1 ? "s" : ""} nos próximos ${UPCOMING_DAYS} dias\n\n${lines.join("\n\n")}${extra}`;
}

async function formatListCards(agent: AgentConfig, board: AgentBoard, list: TrelloList): Promise<string> {
  const creds = trelloCreds(agent);
  const cards = await getBoardCards(creds, board.trelloBoardId);
  const inList = cards.filter((c) => c.idList === list.id);

  if (inList.length === 0) {
    return `📋 *${board.label} → ${list.name}*\nNenhum card nessa coluna.`;
  }

  const lines = inList.slice(0, 25).map((c) => {
    const dueStr = c.due
      ? ` — prazo ${new Date(c.due).toLocaleDateString("pt-BR")}${c.dueComplete ? " ✅" : isCardOverdue(c) ? " 🔴" : ""}`
      : "";
    return `• ${c.name}${dueStr}\n  ${c.shortUrl}`;
  });
  const extra = inList.length > 25 ? `\n\n… e mais ${inList.length - 25}.` : "";

  return `📋 *${board.label} → ${list.name}* (${inList.length} card${inList.length > 1 ? "s" : ""})\n\n${lines.join("\n\n")}${extra}`;
}

function menuText(agent: AgentConfig): string {
  const clients = (agent.boards ?? []).map((b) => `• ${b.label}`).join("\n") || "(nenhum cliente cadastrado ainda)";
  return (
    `👋 Oi! Eu sou o *${agent.name}*. Consulto o Trello em tempo real, é só perguntar.\n\n` +
    `*O que você pode me perguntar:*\n\n` +
    `1️⃣ *Atrasados* — "quais demandas estão atrasadas", "status"\n` +
    `2️⃣ *Prazos próximos* — "o que vence essa semana", "próximos prazos"\n` +
    `3️⃣ *Buscar um assunto* — "tem algum card sobre X", "buscar X"\n` +
    `4️⃣ *Ver uma coluna inteira* — "mostra a coluna X do cliente Y"\n` +
    `5️⃣ *Clientes que acompanho* — "quais clientes vocês acompanham"\n\n` +
    `Dá pra mencionar o nome do cliente em qualquer pergunta, pra filtrar só aquele board.\n\n` +
    `*Clientes atuais:*\n${clients}`
  );
}

function fallbackText(): string {
  return `Não entendi 🤔 Manda *menu* que eu mostro tudo que posso responder.`;
}

// ─── DETECÇÃO DE INTENÇÃO POR PALAVRA-CHAVE (sem IA) ──────────────
// Não é NLU de verdade — procura gatilhos conhecidos em qualquer parte da frase.
// Cobre bastante coisa em português natural, mas tem limite: frases muito fora
// do padrão caem no fallback. Pra expandir, é só adicionar mais gatilhos aqui.
const GREETING_EXACT = ["oi", "ola", "bom dia", "boa tarde", "boa noite", "eae", "e ai", "oii", "oiii"];
const MENU_EXACT = ["menu", "ajuda", "help", "comandos"];
const MENU_PHRASES = ["o que voce faz", "o que vc faz", "como funciona", "o que voce sabe fazer", "o que vc sabe fazer", "o que voce pode fazer"];
const UPCOMING_TRIGGERS = ["vence essa semana", "vence esta semana", "vencendo", "proximos prazos", "prazos dos proximos", "vence em breve", "vai vencer", "prazo essa semana", "prazo desta semana"];
const STATUS_TRIGGERS = ["atrasad", "vencid", "pendente", "status", "andamento", "travad", "parad", "em dia", "atraso"];
const CLIENTS_TRIGGERS = ["quais cliente", "quais board", "que cliente", "clientes voce", "clientes vc", "quem voce acompanha", "quem vc acompanha", "lista de cliente"];
const COLUMN_TRIGGERS = ["coluna", "o que tem em", "o que esta em", "o que ta em", "mostra a lista", "mostra a coluna"];
const SEARCH_TRIGGERS = [
  "busca", "buscar", "procura", "procurar",
  "tem algum", "tem alguma", "tem algo", "tem card",
  "existe algum", "existe alguma",
  "cade o", "cade a", "onde esta", "onde ta",
  "algum card sobre", "alguma coisa sobre", "algo sobre",
];

function extractSearchQuery(text: string): string {
  let q = text;
  const stripPatterns = [
    /tem\s+(algum|alguma|algo)(\s+card)?(\s+(sobre|com|de|da|do))?/gi,
    /existe\s+(algum|alguma)(\s+card)?(\s+(sobre|com|de|da|do))?/gi,
    /(busca|buscar|procura|procurar)(\s+(o|a|por))?/gi,
    /cad[eê]\s+(o|a)/gi,
    /onde\s+(esta|ta)/gi,
    /algo\s+sobre/gi,
  ];
  for (const p of stripPatterns) q = q.replace(p, " ");
  return q.replace(/[?!.]+/g, " ").replace(/\s+/g, " ").trim();
}

export async function handleCommand(agent: AgentConfig, text: string): Promise<string> {
  const n = normalize(text);
  const boards = agent.boards ?? [];

  if (boards.length === 0) {
    return "Ainda não tenho nenhum board do Trello configurado pra consultar.";
  }

  if (GREETING_EXACT.includes(n) || MENU_EXACT.includes(n) || MENU_PHRASES.some((k) => n.includes(k))) {
    return menuText(agent);
  }

  if (n === "clientes" || n === "boards" || CLIENTS_TRIGGERS.some((k) => n.includes(k))) {
    return `Clientes que acompanho:\n\n${boards.map((b) => `• ${b.label}`).join("\n")}`;
  }

  if (UPCOMING_TRIGGERS.some((k) => n.includes(k))) {
    const board = findBoard(agent, text);
    if (board) return formatUpcoming(agent, board);
    const parts = await Promise.all(boards.map((b) => formatUpcoming(agent, b)));
    return parts.join("\n\n---\n\n");
  }

  if (COLUMN_TRIGGERS.some((k) => n.includes(k))) {
    let board = findBoard(agent, text);
    if (!board && boards.length === 1) board = boards[0];
    if (!board) {
      return `De qual cliente? ${boards.map((b) => b.label).join(", ")}`;
    }
    const lists = await getLists(trelloCreds(agent), board.trelloBoardId);
    const list = findList(lists, text);
    if (!list) {
      return `Não identifiquei a coluna. As colunas de *${board.label}* são:\n\n${lists.map((l) => `• ${l.name}`).join("\n")}`;
    }
    return formatListCards(agent, board, list);
  }

  if (SEARCH_TRIGGERS.some((k) => n.includes(k))) {
    const query = extractSearchQuery(text);
    if (!query) return 'Manda assim: "buscar <termo>" (ex.: buscar vitamina d)';
    const board = findBoard(agent, text);
    return formatSearch(agent, query, board);
  }

  if (STATUS_TRIGGERS.some((k) => n.includes(k))) {
    const board = findBoard(agent, text);
    if (board) return formatBoardStatus(agent, board);
    const parts = await Promise.all(boards.map((b) => formatBoardStatus(agent, b)));
    return parts.join("\n\n---\n\n");
  }

  return fallbackText();
}
