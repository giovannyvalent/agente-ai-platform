// Config dos agentes de operação da AM (Alana Miranda) — ver briefing.md.
// Deliberadamente em arquivo, não em tabela: o Supabase do painel está fora
// do ar e o pedido foi "não mexer nele agora". Credenciais seguem em env var
// (nunca aqui), igual o resto do projeto.

export interface AmClientBoard {
  /** Id curto só pra referência nos relatórios/logs */
  slug: string;
  /** Nome de exibição do cliente */
  label: string;
  trelloBoardId: string;
}

// Confirmados via /api/debug/trello-boards — excluído "GV Gestão" (board
// pessoal, só o Giovanny como membro, não é cliente da Alana).
export const AM_CLIENT_BOARDS: AmClientBoard[] = [
  { slug: "ana-paula-carvalho", label: "Ana Paula Carvalho", trelloBoardId: "6abd5f00b5892730ee1ea1b9" },
  { slug: "dra-alyssa-miranda", label: "Dra. Alyssa Miranda", trelloBoardId: "69d3fa693bdc48b3ba5a24ad" },
  { slug: "dra-ana-galvao", label: "Dra. Ana Galvão", trelloBoardId: "69977d99cd2b21714576444e" },
];

export interface AmCollaborator {
  /** Nome usado no briefing (ordem de exibição no relatório do Gerente) */
  name: "Bia" | "Barbara" | "Catia" | "Thay";
  /** Nome completo real no Trello — null enquanto não confirmado */
  trelloFullName: string | null;
}

// TODO [Alana/Giovanny confirmar]: "Bia" e "Thay" ainda não confirmados.
// Candidatos encontrados nos 3 boards (além da própria Alana e dos clientes):
//   Beatriz Aguiar — aparece nos 3 boards (candidata a "Bia")
//   Amanda Superbi — aparece nos 3 boards (não bate com nenhum nome do briefing)
//   Bárbara Gomes  — só no board da Dra. Alyssa Miranda (bate com "Barbara")
//   Cátia Emilio   — só no board da Dra. Ana Galvão (bate com "Catia")
export const AM_COLLABORATORS: AmCollaborator[] = [
  { name: "Bia", trelloFullName: null },
  { name: "Barbara", trelloFullName: "Bárbara Gomes" },
  { name: "Catia", trelloFullName: "Cátia Emilio" },
  { name: "Thay", trelloFullName: null },
];

// TODO [Alana/Giovanny confirmar]: o que define "pronto/publicado" nos boards
// reais (não existe lista "Concluído"). Ver seção 4 do briefing.
export const AM_PRONTO_DEFINITION_CONFIRMED = false;

// TODO: números de WhatsApp (formato 55DDXXXXXXXXX) de quem recebe cada
// relatório — Alana (Agente G) e a colaboradora da ronda (Agentes R e P).
export const AM_ALANA_PHONE = "";
export const AM_RONDA_COLLABORATOR_PHONE = "";

export function trelloCreds() {
  return { key: process.env.TRELLO_API_KEY, token: process.env.TRELLO_API_TOKEN };
}

export function zapiCreds() {
  return {
    instanceId: process.env.AM_OPS_ZAPI_INSTANCE_ID,
    token: process.env.AM_OPS_ZAPI_TOKEN,
    // client-token é de conta, não por instância — reaproveita o que já existe.
    clientToken: process.env.GESTAO_MARKETING_ZAPI_CLIENT_TOKEN,
  };
}
