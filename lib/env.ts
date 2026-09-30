/**
 * Cada agente tem suas próprias credenciais (instância Z-API, board do Trello, etc).
 * Convenção: env var com prefixo `<AGENT_ID_EM_MAIUSCULO>_<CHAVE>`.
 * Ex.: agente "clinica-x" → CLINICA_X_ZAPI_INSTANCE_ID, CLINICA_X_ZAPI_TOKEN...
 *
 * Chaves compartilháveis entre agentes (ex.: ANTHROPIC_API_KEY, TRELLO_API_KEY quando
 * é a mesma conta do Trello para todos) caem no fallback da env var sem prefixo.
 */
export function agentEnvPrefix(agentId: string): string {
  return agentId.toUpperCase().replace(/[^A-Z0-9]/g, "_");
}

export function getAgentEnv(agentId: string, key: string): string | undefined {
  const scoped = process.env[`${agentEnvPrefix(agentId)}_${key}`];
  return scoped ?? process.env[key];
}
