export interface AgentConfig {
  /** Slug único (kebab-case) — usado nas URLs de webhook e no prefixo das env vars */
  id: string;
  /** Nome de exibição, usado nas mensagens enviadas */
  name: string;
  /** Caminho do arquivo de conhecimento, relativo à pasta do próprio agente (agents/<id>/) */
  brainFile: string;
  /** Board do Trello monitorado por este agente (pode ficar vazio se o agente só conversa) */
  trelloBoardId?: string;
  /** Nomes das listas do Trello a monitorar. Vazio = monitora o board inteiro */
  monitoredLists?: string[];
  /** Telefones da gestão que recebem alertas, caso não configurados via env (fallback) */
  managementPhones?: string[];
  /** Modelo Claude usado por este agente (opcional, padrão definido em lib/claude.ts) */
  claudeModel?: string;
  /** Precisa estar true para o agente rodar no cron e aparecer como ativo */
  enabled: boolean;
}
