# Agente AI Platform

> Deploy automático: todo push em `main` builda e sobe sozinho na Vercel.
> Produção: https://agente-ai-platform.vercel.app

Plataforma de agentes de IA para WhatsApp, integrados ao Trello, para monitorar tarefas
e se comunicar com a gestão. Feita para ser **replicável**: uma empresa pode ter 1, 2 ou
20 agentes rodando no mesmo deploy — cada um com seu próprio "cérebro" (base de
conhecimento) e suas próprias credenciais.

## Conceito

Cada **agente** é uma pasta em `agents/<id>/` com dois arquivos:

- `config.ts` — metadados: nome, board do Trello, listas monitoradas, etc.
- `brain.md` — a base de conhecimento/regras em markdown, lida e injetada como contexto
  para a IA responder no WhatsApp e decidir quando alertar. **É o documento que vocês vão
  alimentando aos poucos** conforme surgem regras novas — não precisa mexer em código
  para atualizar o comportamento do agente, só editar o `brain.md`.

O motor (`lib/`) é genérico e roda qualquer agente registrado. Adicionar um agente novo
não exige tocar na lógica principal.

## Estrutura

```
agents/
  _template/          ← copie esta pasta para criar um agente novo
    config.ts
    brain.md
  index.ts            ← registro central de agentes (import estático de cada um)
lib/
  types.ts            ← shape de AgentConfig
  env.ts               ← resolve env vars por agente (prefixo <AGENT_ID>_...)
  zapi.ts              ← cliente Z-API (envio + parsing do payload recebido)
  trello.ts            ← cliente Trello (boards, listas, cards, comentários)
  claude.ts            ← chamada à API da Anthropic
  history.ts           ← histórico de conversa em memória, por agente+chat
  runtime.ts           ← orquestração: mensagem recebida, evento Trello, ciclo de monitor
api/
  index.ts             ← único entrypoint Express, todas as rotas
vercel.json            ← rewrite catch-all para api/index + cron do monitor
```

## Rotas

- `POST /api/webhook/whatsapp/:agentId` — recebida pela Z-API quando chega mensagem
- `POST /api/webhook/trello/:agentId` — recebida pelo Trello quando algo muda no board
  (o Trello também faz `GET`/`HEAD` na criação do webhook, para validar a URL)
- `GET /api/cron/monitor` — protegida por `Authorization: Bearer <CRON_SECRET>`, roda o
  ciclo de monitoramento de todos os agentes com `enabled: true`
- `GET /api/health` — status + lista de agentes ativos

## Como criar um agente novo

1. Copie `agents/_template/` para `agents/<novo-id>/` (id em kebab-case, ex.: `clinica-x`)
2. Preencha `config.ts` (nome, board do Trello, listas monitoradas, `enabled: true`)
3. Escreva as regras em `brain.md` (tom de voz, quando alertar, comandos aceitos etc.)
4. Registre em `agents/index.ts`:
   ```ts
   import clinicaXAgent from "./clinica-x/config.js";
   const ALL_AGENTS: AgentConfig[] = [templateAgent, clinicaXAgent];
   ```
5. Configure as env vars na Vercel com o prefixo do novo id (ver `.env.example`):
   `CLINICA_X_ZAPI_INSTANCE_ID`, `CLINICA_X_ZAPI_TOKEN`, `CLINICA_X_MANAGEMENT_PHONES`, etc.
   — `ANTHROPIC_API_KEY` e `TRELLO_API_KEY`/`TRELLO_API_TOKEN` só precisam de override se
   esse agente usar uma conta diferente da compartilhada.
6. Na instância Z-API do cliente, configure o webhook de mensagem recebida para:
   `https://SEU-DEPLOY.vercel.app/api/webhook/whatsapp/clinica-x`
7. Se for monitorar Trello, crie o webhook do board apontando para:
   `https://SEU-DEPLOY.vercel.app/api/webhook/trello/clinica-x`

## Limitações conhecidas (MVP)

- Deduplicação de mensagens e histórico de conversa (`lib/history.ts`) ficam em memória —
  somem entre cold starts da função serverless. Para produção com muito volume, trocar
  por uma tabela (ex.: Supabase, mesmo padrão usado em outros agentes deste ecossistema).
- `handleIncomingTrelloEvent` e `runMonitorCycle` têm regras de exemplo simples (avisa
  quando um card muda de lista / lista cards vencidos). A regra real de cada cliente deve
  vir do `brain.md` do agente e ser refletida em código conforme necessário.

## Setup local

```bash
npm install
cp .env.example .env   # preencher com as credenciais reais
npx vercel dev          # roda localmente simulando as functions da Vercel
```
