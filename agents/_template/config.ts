import type { AgentConfig } from "../../lib/types.js";

/**
 * Template de configuração de um agente. Um agente representa uma FUNÇÃO/TIPO de
 * trabalho (ex.: "gestão de marketing", "cobrança", "suporte") — não um cliente.
 * Cada cliente entra como um item em `boards`, então clientes rotativos só mexem
 * nessa lista, sem precisar criar agente novo.
 *
 * Para criar um agente novo:
 * 1. Copie esta pasta inteira para agents/<novo-id>/
 * 2. Preencha os campos abaixo (id deve bater com o nome da pasta)
 * 3. Escreva as regras em brain.md
 * 4. Registre o import em agents/index.ts
 * 5. Configure as env vars com prefixo <NOVO_ID_MAIUSCULO>_... (ver .env.example)
 * 6. Aponte o webhook da Z-API e o webhook do Trello para as URLs deste agente
 */
const config: AgentConfig = {
  id: "template",
  name: "Agente Template",
  brainFile: "brain.md",
  boards: [
    // { id: "cliente-x", label: "Cliente X", trelloBoardId: "...", monitoredLists: [] },
  ],
  managementPhones: [],
  enabled: false,
};

export default config;
