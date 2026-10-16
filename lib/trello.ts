export interface TrelloCreds {
  key?: string;
  token?: string;
}

function requireCreds(creds: TrelloCreds): void {
  if (!creds.key || !creds.token) {
    throw new Error("Credenciais do Trello ausentes (key/token) para este agente");
  }
}

const BASE = "https://api.trello.com/1";

async function trelloGet<T>(creds: TrelloCreds, path: string): Promise<T> {
  requireCreds(creds);
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${BASE}${path}${sep}key=${creds.key}&token=${creds.token}`);
  if (!res.ok) throw new Error(`Trello error (${path}): ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

export interface TrelloList {
  id: string;
  name: string;
}

export interface TrelloCard {
  id: string;
  name: string;
  due: string | null;
  dueComplete: boolean;
  idList: string;
  idMembers: string[];
  labels: { id: string; name: string; color: string }[];
  shortUrl: string;
}

export interface TrelloBoardSummary {
  id: string;
  name: string;
  url: string;
  closed: boolean;
}

export interface TrelloMember {
  id: string;
  username: string;
  fullName: string;
}

// Usado só pra descobrir boards/membros reais com a credencial já configurada
// (ex.: montar a config de um cliente novo) — não faz parte do fluxo de leitura
// recorrente dos agentes.
export async function listMyBoards(creds: TrelloCreds): Promise<TrelloBoardSummary[]> {
  return trelloGet<TrelloBoardSummary[]>(creds, `/members/me/boards?fields=name,url,closed`);
}

export async function getBoardMembers(creds: TrelloCreds, boardId: string): Promise<TrelloMember[]> {
  return trelloGet<TrelloMember[]>(creds, `/boards/${boardId}/members?fields=username,fullName`);
}

export async function getLists(creds: TrelloCreds, boardId: string): Promise<TrelloList[]> {
  return trelloGet<TrelloList[]>(creds, `/boards/${boardId}/lists`);
}

export async function getBoardCards(creds: TrelloCreds, boardId: string): Promise<TrelloCard[]> {
  return trelloGet<TrelloCard[]>(creds, `/boards/${boardId}/cards`);
}

export async function getCard(creds: TrelloCreds, cardId: string): Promise<TrelloCard> {
  return trelloGet<TrelloCard>(creds, `/cards/${cardId}`);
}

export interface TrelloChecklistItem {
  name: string;
  state: "complete" | "incomplete";
}

export interface TrelloChecklist {
  name: string;
  checkItems: TrelloChecklistItem[];
}

export interface TrelloComment {
  date: string;
  text: string;
  memberName: string;
}

export interface TrelloCardDetailed extends TrelloCard {
  dateLastActivity: string;
  checklists: TrelloChecklist[];
  comments: TrelloComment[];
  memberNames: string[];
}

interface RawDetailedCard extends TrelloCard {
  dateLastActivity: string;
  checklists?: { name: string; checkItems?: { name: string; state: string }[] }[];
  members?: { fullName: string }[];
  actions?: { type: string; date: string; data: { text?: string }; memberCreator?: { fullName: string } }[];
}

// Uma chamada só por board traz tudo que os agentes de relatório precisam:
// checklist (pra "Feita"), comentários (pra contar "Cobrança N"), membros e
// data da última atividade (pra "Parada"). Evita N+1 requisição por card.
export async function getBoardCardsDetailed(creds: TrelloCreds, boardId: string): Promise<TrelloCardDetailed[]> {
  const path =
    `/boards/${boardId}/cards` +
    `?fields=name,due,dueComplete,idList,idMembers,labels,shortUrl,dateLastActivity` +
    `&checklists=all&checklist_fields=name` +
    `&members=true&member_fields=fullName` +
    `&actions=commentCard&actions_limit=50&action_fields=date,data`;
  const raw = await trelloGet<RawDetailedCard[]>(creds, path);

  return raw.map((c) => ({
    ...c,
    checklists: (c.checklists ?? []).map((cl) => ({
      name: cl.name,
      checkItems: (cl.checkItems ?? []).map((ci) => ({
        name: ci.name,
        state: ci.state as "complete" | "incomplete",
      })),
    })),
    comments: (c.actions ?? [])
      .filter((a) => a.type === "commentCard")
      .map((a) => ({ date: a.date, text: a.data.text ?? "", memberName: a.memberCreator?.fullName ?? "" })),
    memberNames: (c.members ?? []).map((m) => m.fullName),
  }));
}

export async function addComment(creds: TrelloCreds, cardId: string, text: string): Promise<void> {
  requireCreds(creds);
  const res = await fetch(
    `${BASE}/cards/${cardId}/actions/comments?key=${creds.key}&token=${creds.token}&text=${encodeURIComponent(text)}`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error(`Trello error (comment): ${res.status} ${await res.text()}`);
}

export function isCardOverdue(card: TrelloCard): boolean {
  if (!card.due || card.dueComplete) return false;
  return new Date(card.due).getTime() < Date.now();
}
