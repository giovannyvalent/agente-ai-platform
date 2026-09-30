import type { ChatMessage } from "./claude.js";

/**
 * Histórico de conversa em memória, por chave `${agentId}:${chatId}`.
 * Some entre cold starts da função serverless — serve para dar contexto dentro de
 * uma mesma conversa "quente". Se precisar de memória persistente entre deploys/
 * cold starts, trocar por uma tabela no Supabase (mesmo padrão usado em outros
 * agentes deste ecossistema).
 */
const MAX_HISTORY = 20;
const INACTIVE_MS = 2 * 60 * 60 * 1000; // 2h sem atividade = zera o contexto

interface Entry {
  messages: ChatMessage[];
  lastActivityAt: number;
}

const store = new Map<string, Entry>();

export function getHistory(key: string): ChatMessage[] {
  const entry = store.get(key);
  if (!entry) return [];
  if (Date.now() - entry.lastActivityAt > INACTIVE_MS) {
    store.delete(key);
    return [];
  }
  return entry.messages;
}

export function pushHistory(key: string, role: ChatMessage["role"], content: string): void {
  const entry = store.get(key) ?? { messages: [], lastActivityAt: Date.now() };
  entry.messages.push({ role, content });
  if (entry.messages.length > MAX_HISTORY) {
    entry.messages.splice(0, entry.messages.length - MAX_HISTORY);
  }
  entry.lastActivityAt = Date.now();
  store.set(key, entry);
}
