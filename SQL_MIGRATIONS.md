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

---

## [2026-09-30] Camada de tenant (cliente nosso) — isolamento AM / ANSER / etc.

```sql
-- Adiciona a camada de "tenant" (cliente nosso, ex.: AM, ANSER) acima de agents.
-- Isolamento: cada tenant tera seu proprio login (futuro) e RLS vai garantir que um
-- nunca enxerga dado do outro. Um tenant tem varios agentes (marketing, financeiro...)
-- e varios clientes proprios (ex.: Dra. Alyssa); um cliente pode ser acompanhado por
-- mais de um agente do mesmo tenant, entao `clients` passa a pertencer ao tenant
-- (nao mais a um agent especifico), e `boards` passa a linkar client + agent.
--
-- Quebra dado existente (clients.agent_id vira tenant_id; boards ganha agent_id
-- obrigatorio) -- backfill incluso no mesmo bloco, migration idempotente.

CREATE TABLE IF NOT EXISTS public.tenants (
  id text PRIMARY KEY, -- slug, ex. 'am', 'anser'
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- agents passa a pertencer a um tenant
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS tenant_id text;

-- clients: troca agent_id por tenant_id (cliente pertence ao tenant, nao a 1 agente)
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS tenant_id text;

-- boards: precisa saber qual agent esta acompanhando aquele client ali
ALTER TABLE public.boards ADD COLUMN IF NOT EXISTS agent_id text;

-- ─── BACKFILL: estado atual vira tenant 'am' ──────────────────────────────
INSERT INTO public.tenants (id, name)
VALUES ('am', 'AM - Gestão e Estratégia')
ON CONFLICT (id) DO NOTHING;

UPDATE public.agents SET tenant_id = 'am' WHERE id = 'gestao-marketing' AND tenant_id IS NULL;

UPDATE public.clients c
SET tenant_id = a.tenant_id
FROM public.agents a
WHERE c.agent_id = a.id AND c.tenant_id IS NULL;

UPDATE public.boards b
SET agent_id = c.agent_id
FROM public.clients c
WHERE b.client_id = c.id AND b.agent_id IS NULL;

-- ─── Agora que o backfill rodou, torna as colunas obrigatorias + FKs ──────
ALTER TABLE public.agents ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.agents
  DROP CONSTRAINT IF EXISTS agents_tenant_id_fkey,
  ADD CONSTRAINT agents_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.clients ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS clients_tenant_id_fkey,
  ADD CONSTRAINT clients_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.clients DROP COLUMN IF EXISTS agent_id;

ALTER TABLE public.boards ALTER COLUMN agent_id SET NOT NULL;
ALTER TABLE public.boards
  DROP CONSTRAINT IF EXISTS boards_agent_id_fkey,
  ADD CONSTRAINT boards_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_agents_tenant_id ON public.agents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON public.clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_boards_agent_id ON public.boards(agent_id);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
-- sem policies publicas ainda (mesmo motivo das outras tabelas: nao ha login/auth
-- implementado nesse projeto por enquanto, so a secret key do backend acessa)
```

---

## [2026-09-30] Auth por tenant — policies de RLS de verdade

```sql
-- Liga usuarios do Supabase Auth a um tenant, e finalmente da conteudo as policies
-- de RLS (ate aqui elas existiam vazias, so o backend com a secret key acessava).
-- Login e por usuario/senha; usamos um e-mail interno sintetico por baixo dos panos
-- (ex.: 'alana' -> alana@login.agente-ai-platform.internal) porque o Supabase Auth
-- so trabalha com e-mail nativamente -- o frontend monta esse e-mail a partir do
-- usuario digitado, sem precisar de lookup antes do login.

CREATE TABLE IF NOT EXISTS public.tenant_users (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id text NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tenant_id)
);

-- SECURITY DEFINER: precisa ignorar a RLS das tabelas que consulta por dentro,
-- senao vira recursivo/inconsistente (ex.: checar agents.tenant_id exigiria que
-- agents ja fosse visivel, que e exatamente o que essa funcao decide).
CREATE OR REPLACE FUNCTION public.is_tenant_member(uid uuid, tid text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_users WHERE user_id = uid AND tenant_id = tid
  );
$$;

CREATE OR REPLACE FUNCTION public.agent_tenant_id(aid text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT tenant_id FROM public.agents WHERE id = aid;
$$;

ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_users_select_own" ON public.tenant_users;
CREATE POLICY "tenant_users_select_own" ON public.tenant_users
  FOR SELECT USING (user_id = auth.uid());

-- ─── agents ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "agents_select" ON public.agents;
CREATE POLICY "agents_select" ON public.agents
  FOR SELECT USING (public.is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "agents_update" ON public.agents;
CREATE POLICY "agents_update" ON public.agents
  FOR UPDATE USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

-- ─── clients ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "clients_select" ON public.clients;
CREATE POLICY "clients_select" ON public.clients
  FOR SELECT USING (public.is_tenant_member(auth.uid(), tenant_id));

-- ─── boards (join por agent_id -> agents.tenant_id) ──────────────
DROP POLICY IF EXISTS "boards_select" ON public.boards;
CREATE POLICY "boards_select" ON public.boards
  FOR SELECT USING (public.is_tenant_member(auth.uid(), public.agent_tenant_id(agent_id)));

-- ─── brains (o que o cliente efetivamente edita) ─────────────────
DROP POLICY IF EXISTS "brains_select" ON public.brains;
CREATE POLICY "brains_select" ON public.brains
  FOR SELECT USING (public.is_tenant_member(auth.uid(), public.agent_tenant_id(agent_id)));

DROP POLICY IF EXISTS "brains_update" ON public.brains;
CREATE POLICY "brains_update" ON public.brains
  FOR UPDATE USING (public.is_tenant_member(auth.uid(), public.agent_tenant_id(agent_id)))
  WITH CHECK (public.is_tenant_member(auth.uid(), public.agent_tenant_id(agent_id)));
```

---

## [2026-09-30] Log de interações (dado real pra Relatórios)

```sql
-- Log de interacoes do WhatsApp — cada mensagem processada por um agente vira
-- uma linha aqui. E a fonte de dado real da tela de Relatorios (antes so tinha
-- placeholder "-", sem nada registrado de verdade).

CREATE TABLE IF NOT EXISTS public.interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  phone text NOT NULL,
  message_in text,
  message_out text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interactions_agent_created ON public.interactions(agent_id, created_at DESC);

ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "interactions_select" ON public.interactions;
CREATE POLICY "interactions_select" ON public.interactions
  FOR SELECT USING (public.is_tenant_member(auth.uid(), public.agent_tenant_id(agent_id)));
```
