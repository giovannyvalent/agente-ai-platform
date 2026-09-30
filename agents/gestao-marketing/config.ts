import type { AgentConfig } from "../../lib/types.js";

const config: AgentConfig = {
  id: "gestao-marketing",
  name: "Agente Gestão de Marketing",
  brainFile: "brain.md",
  boards: [
    {
      id: "dra-alyssa",
      label: "Dra. Alyssa Miranda",
      trelloBoardId: "69d3fa693bdc48b3ba5a24ad",
      monitoredLists: [], // vazio = monitora o board inteiro
    },
    // Próximos clientes entram aqui — só adicionar mais um item:
    // { id: "dra-ana", label: "Dra. Ana Galvão", trelloBoardId: "69977d99cd2b21714576444e", monitoredLists: [] },
  ],
  managementPhones: [], // fallback; o valor real vem de GESTAO_MARKETING_MANAGEMENT_PHONES na Vercel
  enabled: true,
};

export default config;
