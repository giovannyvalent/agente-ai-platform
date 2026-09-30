import type { AgentConfig } from "../../lib/types.js";

const config: AgentConfig = {
  id: "dra-alyssa",
  name: "Agente Brand — Dra. Alyssa Miranda",
  brainFile: "brain.md",
  trelloBoardId: "69d3fa693bdc48b3ba5a24ad", // board "Brand | Dra. Alyssa Miranda"
  monitoredLists: [], // vazio = monitora o board inteiro
  managementPhones: [], // fallback; o valor real vem de DRA_ALYSSA_MANAGEMENT_PHONES na Vercel
  enabled: true,
};

export default config;
