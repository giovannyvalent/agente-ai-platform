import type { AgentConfig } from "./types.js";
import { runMonitorCycle, zapiCreds, managementPhones } from "./runtime.js";
import { sendTextMessage } from "./zapi.js";
import { getRecentInteractions } from "./interactions.js";

// Regras de um disparo são texto livre no mesmo formato "chave: valor" usado
// no cérebro — parser simples e determinístico, sem IA envolvida.
function parseRules(rules: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of rules.split("\n")) {
    const match = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.+?)\s*$/);
    if (match) result[match[1].toLowerCase()] = match[2];
  }
  return result;
}

async function runResumoInteracoes(agent: AgentConfig, parsed: Record<string, string>): Promise<string> {
  const dias = Number(parsed.dias ?? "1") || 1;
  const since = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();
  const rows = await getRecentInteractions(agent.id, since);
  const total = rows.length;
  const avgMs = total > 0 ? rows.reduce((s, r) => s + (r.duration_ms ?? 0), 0) / total : 0;

  const periodo = dias === 1 ? "últimas 24h" : `últimos ${dias} dias`;
  const lines = [`📊 *[${agent.name}] Resumo de interações* — ${periodo}`, "", `Total: *${total}* interação${total === 1 ? "" : "ões"}`];
  if (total > 0) lines.push(`Tempo médio de resposta: ${(avgMs / 1000).toFixed(1)}s`);

  const creds = zapiCreds(agent);
  await Promise.all(managementPhones(agent).map((phone) => sendTextMessage(creds, phone, lines.join("\n"))));
  return "resumo_interacoes executado";
}

// Cada "tipo" é uma ação que sabemos executar de verdade. Novos tipos entram
// aqui conforme forem construídos.
export async function runDispatch(agent: AgentConfig, rules: string): Promise<string> {
  const parsed = parseRules(rules);
  const tipo = (parsed.tipo ?? "monitor_boards").toLowerCase();

  if (tipo === "monitor_boards") {
    await runMonitorCycle(agent);
    return "monitor_boards executado";
  }

  if (tipo === "resumo_interacoes") {
    return runResumoInteracoes(agent, parsed);
  }

  throw new Error(`tipo de disparo ainda não suportado: "${tipo}"`);
}
