/**
 * Um board do Trello monitorado por um agente. Um agente pode acompanhar vários
 * (ex.: um agente de "gestão de marketing" com um board por cliente) — clientes
 * rotativos entram/saem só editando essa lista, sem criar agente novo.
 */
export interface AgentBoard {
  /** Identificador curto do board dentro do agente (kebab-case, ex.: nome do cliente) */
  id: string;
  /** Nome de exibição — aparece nas mensagens pra identificar de qual cliente/board é */
  label: string;
  /** ID do board no Trello */
  trelloBoardId: string;
  /** Nomes das listas do Trello a monitorar. Vazio = monitora o board inteiro */
  monitoredLists?: string[];
}

export interface AgentConfig {
  /** Slug único (kebab-case) — usado nas URLs de webhook e no prefixo das env vars */
  id: string;
  /** Nome de exibição, usado nas mensagens enviadas */
  name: string;
  /** Boards do Trello monitorados por este agente (pode ficar vazio se o agente só conversa) */
  boards?: AgentBoard[];
  /** Telefones da gestão que recebem alertas, caso não configurados via env (fallback) */
  managementPhones?: string[];
  /** Modelo Claude usado por este agente (opcional, padrão definido em lib/claude.ts) */
  claudeModel?: string;
  /** Precisa estar true para o agente rodar no cron e aparecer como ativo */
  enabled: boolean;
}
