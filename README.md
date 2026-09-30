# Agente AI Platform

> Deploy automático: todo push em `main` builda e sobe sozinho na Vercel.
> Produção: https://agente-ai-platform.vercel.app

Plataforma de agentes de IA para WhatsApp, integrados ao Trello, para monitorar tarefas
e se comunicar com a gestão. Feita para ser **replicável**: uma empresa pode ter 1, 2 ou
20 agentes rodando no mesmo deploy — cada um com vários clientes, e tudo configurado no
banco, sem precisar de código novo por cliente.

## Conceito

- **Agente** = um tipo de trabalho (ex.: "Gestão de Marketing"), com seu próprio número
  de WhatsApp (instância Z-API) e seu "cérebro" (regras/contexto).
- **Cliente** = alguém que o agente atende (ex.: "Dra. Alyssa Miranda"), ligado a um board
  do Trello. Um agente pode ter vários clientes — clientes rotativos entram/saem sem
  precisar criar agente novo nem fazer deploy.

Tudo isso (agentes, clientes, boards, cérebro) vive no **Supabase**, não em arquivos do
repo — editar é um INSERT/UPDATE no banco, não um commit. O `brain` de cada agente é o
texto que dá contexto/regras pra IA (quando ativada) e para as respostas no WhatsApp; vai
sendo alimentado aos poucos, direto no banco.

O motor (`lib/`) é genérico e roda qualquer agente cadastrado. Adicionar um agente ou
cliente novo não exige tocar na lógica principal nem fazer deploy.

## Estrutura

```
agents/
  index.ts             ← registro de agentes, lido do Supabase (não mais de arquivos)
lib/
  types.ts              ← shape de AgentConfig / AgentBoard
  env.ts                 ← resolve env vars por agente (prefixo <AGENT_ID>_...)
  zapi.ts                 ← cliente Z-API (envio + parsing do payload recebido)
  trello.ts               ← cliente Trello (boards, listas, cards, comentários)
  commands.ts             ← respostas no WhatsApp por palavra-chave (sem IA, por ora)
  runtime.ts               ← orquestração: mensagem recebida, evento Trello, ciclo de monitor
api/
  index.ts               ← único entrypoint Express, todas as rotas
supabase/
  migrations/             ← schema versionado (aplicado direto no banco)
SQL_MIGRATIONS.md          ← histórico de mudanças de schema, com o SQL de cada uma
vercel.json                ← rewrite catch-all para api/index + cron do monitor
```

## Banco (Supabase)

Tabelas principais (ver `supabase/migrations/` para o schema completo):

- `agents` — id, nome, telefones da gestão, modelo Claude (se/quando ativado), `enabled`
- `clients` — id, `agent_id`, nome de exibição
- `boards` — `client_id`, id do board no Trello, listas monitoradas
- `brains` — `agent_id`, conteúdo do cérebro (texto livre), quem editou por último

RLS está habilitado em todas, sem policies públicas — só a `SUPABASE_SECRET_KEY` (usada
pelo backend) acessa, já que ainda não existe login de cliente nesse projeto.

## Rotas

- `POST /api/webhook/whatsapp/:agentId` — recebida pela Z-API quando chega mensagem
- `POST /api/webhook/trello/:agentId` — recebida pelo Trello quando algo muda no board
  (o Trello também faz `GET`/`HEAD` na criação do webhook, para validar a URL)
- `GET /api/cron/monitor` — protegida por `Authorization: Bearer <CRON_SECRET>`, roda o
  ciclo de monitoramento de todos os agentes com `enabled = true`
- `GET /api/health` — status + lista de agentes ativos

## Como adicionar um cliente a um agente existente

Só SQL, sem deploy (registrar a mudança em `supabase/migrations/` + `SQL_MIGRATIONS.md`,
como qualquer outra mudança de schema/dado relevante):

```sql
insert into public.clients (id, agent_id, label) values ('clinica-x', 'gestao-marketing', 'Clínica X');
insert into public.boards (client_id, trello_board_id) values ('clinica-x', '<id do board no Trello>');
```

## Como criar um agente novo (tipo de trabalho novo)

1. `insert into public.agents (id, name, management_phones) values (...)`
2. `insert into public.brains (agent_id, content) values (...)` com as regras iniciais
3. Configure as env vars na Vercel com o prefixo do novo id (ver `.env.example`):
   `<ID>_ZAPI_INSTANCE_ID`, `<ID>_ZAPI_TOKEN`, `<ID>_ZAPI_CLIENT_TOKEN` — `TRELLO_API_KEY`/
   `TRELLO_API_TOKEN` só precisam de override se esse agente usar uma conta Trello diferente
   da compartilhada.
4. Na instância Z-API desse cliente/agente, configure o webhook de mensagem recebida para:
   `https://SEU-DEPLOY.vercel.app/api/webhook/whatsapp/<id>`
5. Se for monitorar Trello, crie o webhook do board apontando para:
   `https://SEU-DEPLOY.vercel.app/api/webhook/trello/<id>`

## Limitações conhecidas (MVP)

- Deduplicação de mensagens (`api/index.ts`) fica em memória — some entre cold starts.
  Baixo risco na prática (janela de 60s), mas pode virar tabela se precisar.
- `handleIncomingTrelloEvent` e `runMonitorCycle` têm regras de exemplo simples (avisa
  quando um card muda de lista / lista cards vencidos). A regra real de cada cliente deve
  vir do `brain` do agente e ser refletida em código conforme necessário.
- Claude/IA está propositalmente **desligado** — respostas no WhatsApp hoje são por
  comando fixo (`lib/commands.ts`), sem custo de IA. Reativar é uma decisão consciente,
  não automática.

## Setup local

```bash
npm install
cp .env.example .env   # preencher com as credenciais reais
npx vercel dev          # roda localmente simulando as functions da Vercel
```
