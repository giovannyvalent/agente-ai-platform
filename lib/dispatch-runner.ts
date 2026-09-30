import type { AgentConfig } from "./types.js";
import { runMonitorCycle } from "./runtime.js";

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

// Cada "tipo" é uma ação que sabemos executar de verdade. Novos tipos entram
// aqui conforme forem construídos — por ora só reaproveita o monitor de boards
// já existente (mesma lógica do cron nativo, só que disparável de fora).
export async function runDispatch(agent: AgentConfig, rules: string): Promise<string> {
  const parsed = parseRules(rules);
  const tipo = (parsed.tipo ?? "monitor_boards").toLowerCase();

  if (tipo === "monitor_boards") {
    await runMonitorCycle(agent);
    return "monitor_boards executado";
  }

  throw new Error(`tipo de disparo ainda não suportado: "${tipo}"`);
}
