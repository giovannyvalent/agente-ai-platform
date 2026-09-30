# SQL Migrations — agente-ai-platform

Histórico de mudanças de schema no Supabase. Cada entrada corresponde a um arquivo
em `supabase/migrations/`, com o mesmo SQL. Projeto: `igdbposcmkluiqfczoma`.

---

## [2026-09-30] Schema inicial — agentes, clientes, boards, cérebro

```sql
-- Schema inicial do agente-ai-platform: agentes, clientes, boards do Trello e
-- o "cerebro" editavel de cada agente. Move o que hoje vive em arquivos do repo
-- (agents/*/config.ts e brain.md) para o banco, para permitir edicao ao vivo
-- sem precisar de deploy novo.
--
-- RLS: habilitado em todas as tabelas, sem policies publicas. Ainda nao existe
-- login de cliente nesse projeto (vira depois) -- ate la, so o backend acessa
-- via secret key (service_role, que ignora RLS). Isso evita expor dados via a
-- publishable key por engano enquanto nao ha modelo de autenticacao definido.

CREATE TABLE IF NOT EXISTS public.agents (
  id text PRIMARY KEY, -- slug, ex. 'gestao-marketing'
  name text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  claude_model text,
  management_phones text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clients (
  id text PRIMARY KEY, -- slug, ex. 'dra-alyssa'
  agent_id text NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  trello_board_id text NOT NULL,
  monitored_lists text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.brains (
  agent_id text PRIMARY KEY REFERENCES public.agents(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

CREATE INDEX IF NOT EXISTS idx_clients_agent_id ON public.clients(agent_id);
CREATE INDEX IF NOT EXISTS idx_boards_client_id ON public.boards(client_id);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brains ENABLE ROW LEVEL SECURITY;

-- ─── SEED: migra o estado atual (arquivos do repo) para o banco ──────────
INSERT INTO public.agents (id, name, enabled, management_phones)
VALUES ('gestao-marketing', 'Agente Gestão de Marketing', true, ARRAY['5511966477472', '5591981628017'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, agent_id, label)
VALUES ('dra-alyssa', 'gestao-marketing', 'Dra. Alyssa Miranda')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.boards (client_id, trello_board_id, monitored_lists)
SELECT 'dra-alyssa', '69d3fa693bdc48b3ba5a24ad', '{}'
WHERE NOT EXISTS (
  SELECT 1 FROM public.boards WHERE client_id = 'dra-alyssa' AND trello_board_id = '69d3fa693bdc48b3ba5a24ad'
);

INSERT INTO public.brains (agent_id, content, updated_by)
VALUES ('gestao-marketing', $brain$# Cérebro — Agente Gestão de Marketing

## Quem é esse agente
Acompanha os boards do Trello de calendário de conteúdo de vários clientes (agência de
marketing) e reporta pendências/atrasos por WhatsApp pra gestão interna. Um agente,
vários clientes — cada cliente é um board diferente (ver tabela `clients`/`boards`).

## Tom de voz
Direto, objetivo, português brasileiro. Pode usar emoji com moderação (🔴🟡✅) pra
sinalizar urgência. Sempre deixa claro **de qual cliente** é o alerta.

## Clientes ativos (boards)
- **Dra. Alyssa Miranda** — calendário de conteúdo por mês/semana. Colunas: BRAND,
  DEMANDAS INTERNAS, CONTEÚDOS [MÊS], SETEMBRO/OUTUBRO por semana,
  CONTEÚDOS PENDENTES - AGUARDANDO INFO OU VÍDEO, NÃO PUBLICADOS.

(clientes rotativos — atualizar via tabela `clients`, não precisa mexer em código)

## Regras de monitoramento
- Card com prazo (due) vencido e não marcado como concluído = atrasado → alertar
- Card parado em lista de "pendente/aguardando" = bloqueado, esperando algo de fora
  (geralmente do próprio cliente) → vale destacar mesmo sem prazo vencido
- (regras específicas por cliente a confirmar e detalhar aqui conforme o uso real)

## Quem recebe os alertas e quando
- Alana Miranda — 5511966477472
- Giovanny Valente — 5591981628017

(fonte de verdade agora é a coluna management_phones da tabela agents)

## Comandos que o agente entende no WhatsApp
(v1: nenhum ainda, é só leitura/alerta. v2: comandos pra mover card de status)
$brain$, 'migration-inicial')
ON CONFLICT (agent_id) DO NOTHING;
```
