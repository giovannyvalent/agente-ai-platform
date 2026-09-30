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
  const res = await fetch(`${BASE}${path}?key=${creds.key}&token=${creds.token}`);
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

export async function getLists(creds: TrelloCreds, boardId: string): Promise<TrelloList[]> {
  return trelloGet<TrelloList[]>(creds, `/boards/${boardId}/lists`);
}

export async function getBoardCards(creds: TrelloCreds, boardId: string): Promise<TrelloCard[]> {
  return trelloGet<TrelloCard[]>(creds, `/boards/${boardId}/cards`);
}

export async function getCard(creds: TrelloCreds, cardId: string): Promise<TrelloCard> {
  return trelloGet<TrelloCard>(creds, `/cards/${cardId}`);
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
