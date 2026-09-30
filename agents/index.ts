import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AgentConfig } from "../lib/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── REGISTRO DE AGENTES ───────────────────────────────────────────
// Import estático de cada agente (evita problemas de descoberta dinâmica de
// arquivos dentro de funções serverless na Vercel). Para adicionar um agente
// novo: copie agents/_template/, preencha, e importe + liste aqui.
import templateAgent from "./_template/config.js";
// import clinicaXAgent from "./clinica-x/config.js";

const ALL_AGENTS: AgentConfig[] = [
  templateAgent,
  // clinicaXAgent,
];

const registry = new Map<string, AgentConfig>(ALL_AGENTS.map((a) => [a.id, a]));

export function getAgent(id: string): AgentConfig | undefined {
  return registry.get(id);
}

export function listAgents(): AgentConfig[] {
  return [...registry.values()];
}

export function listEnabledAgents(): AgentConfig[] {
  return listAgents().filter((a) => a.enabled);
}

export function getAgentDir(id: string): string {
  return path.join(__dirname, id);
}

export function loadBrain(agent: AgentConfig): string {
  const filePath = path.join(getAgentDir(agent.id), agent.brainFile);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf-8") : "";
}
