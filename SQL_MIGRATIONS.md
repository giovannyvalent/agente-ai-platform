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

---

## [2026-09-30] Tenant ANSER + agente de monitoramento (cérebro documentado)

```sql
-- Novo tenant: ANSER. Agente de monitoramento de atendimento (semaforo por
-- grupo de WhatsApp + relatorios periodicos), portado de C:\projetos\wpp-ai-platform.
-- Cerebro documentado na integra -- a logica de execucao (tempo + analise de IA)
-- ainda nao foi portada, ver decisoes pendentes na conversa.

INSERT INTO public.tenants (id, name)
VALUES ('anser', 'ANSER')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.agents (id, name, tenant_id, enabled)
VALUES ('anser-monitor', 'Agente Monitoramento de Atendimento', 'anser', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tenant_users (user_id, tenant_id)
VALUES ('f06e34ce-c864-4957-9b0d-636b80b60eab', 'anser')
ON CONFLICT DO NOTHING;

INSERT INTO public.brains (agent_id, content, updated_by)
VALUES ('anser-monitor', $brain$# Cérebro — Agente Monitoramento de Atendimento (ANSER)

(conteúdo completo — ver supabase/migrations/20260930000005_anser_tenant.sql —
regras de semáforo, alertas por tempo, alertas por IA, roteamento de alertas,
reports periódicos 4x/dia, Oráculo, e pendências de implementação)
$brain$, 'migration-anser')
ON CONFLICT (agent_id) DO NOTHING;
```

---

## [2026-09-30] Enriquece cérebro do anser-monitor com dado real parseável

```sql
-- Enriquece o cerebro do anser-monitor com dado real e parseavel: equipe (pra
-- identificar quem e quem nas mensagens do grupo), roteamento de alerta (quem
-- recebe em cada cenario) e limiares de tempo. Convencao de parsing (ver
-- lib/anser/brain-config.ts):
--   - linhas "Nome | telefone | Area" sob "## Equipe" = roster
--   - linhas "chave: valor" = config (numeros e listas separadas por virgula)
-- Mantem "tudo no cerebro" (sem coluna nova) mas de um jeito que o codigo
-- consegue ler de forma confiavel, nao regex solto em prosa livre.
-- (conteúdo completo — ver supabase/migrations/20260930000006_anser_brain_config.sql)
```

---

## [2026-09-30] Disparos — gatilhos com link para cron externo

```sql
-- "Disparos": gatilhos criados pelo usuario (regras em texto livre, seguindo a
-- mesma convencao chave:valor usada no cerebro) que geram um link com token.
-- Colar esse link num cron externo (cron-job.org, EasyCron, etc.) dispara a
-- execucao -- resolve a necessidade de rodar mais de 1x/dia sem depender do
-- cron nativo da Vercel (limitado no plano Hobby).

CREATE TABLE IF NOT EXISTS public.dispatches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  name text NOT NULL,
  rules text NOT NULL DEFAULT '',
  token text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_dispatches_token ON public.dispatches(token);
CREATE INDEX IF NOT EXISTS idx_dispatches_agent_id ON public.dispatches(agent_id);

ALTER TABLE public.dispatches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dispatches_select" ON public.dispatches;
CREATE POLICY "dispatches_select" ON public.dispatches
  FOR SELECT USING (public.is_tenant_member(auth.uid(), public.agent_tenant_id(agent_id)));

DROP POLICY IF EXISTS "dispatches_insert" ON public.dispatches;
CREATE POLICY "dispatches_insert" ON public.dispatches
  FOR INSERT WITH CHECK (public.is_tenant_member(auth.uid(), public.agent_tenant_id(agent_id)));

DROP POLICY IF EXISTS "dispatches_update" ON public.dispatches;
CREATE POLICY "dispatches_update" ON public.dispatches
  FOR UPDATE USING (public.is_tenant_member(auth.uid(), public.agent_tenant_id(agent_id)))
  WITH CHECK (public.is_tenant_member(auth.uid(), public.agent_tenant_id(agent_id)));

DROP POLICY IF EXISTS "dispatches_delete" ON public.dispatches;
CREATE POLICY "dispatches_delete" ON public.dispatches
  FOR DELETE USING (public.is_tenant_member(auth.uid(), public.agent_tenant_id(agent_id)));
```

---

## [2026-09-30] RLS de tenants (select/update) + renomeia ANSER

```sql
-- tenants nunca ganhou policy de SELECT/UPDATE (so tinha RLS habilitado, sem
-- regra nenhuma) -- o nome da empresa no painel provavelmente nao carregava
-- pra usuario comum, e nao dava pra editar de jeito nenhum. Corrige os dois.

DROP POLICY IF EXISTS "tenants_select" ON public.tenants;
CREATE POLICY "tenants_select" ON public.tenants
  FOR SELECT USING (public.is_tenant_member(auth.uid(), id));

DROP POLICY IF EXISTS "tenants_update" ON public.tenants;
CREATE POLICY "tenants_update" ON public.tenants
  FOR UPDATE USING (public.is_tenant_member(auth.uid(), id))
  WITH CHECK (public.is_tenant_member(auth.uid(), id));

-- Nome de exibicao correto do tenant da Anser
UPDATE public.tenants SET name = 'Grupo Anser' WHERE id = 'anser';
```

---

## [2026-10-01] Instâncias Z-API por tenant + policy de INSERT em agents/brains

```sql
-- Credenciais Z-API deixam de depender só de env var (configurada por mim
-- via Vercel) e passam a poder ser cadastradas pelo próprio tenant no painel,
-- em Configurações. Um tenant pode ter mais de uma instância (ex.: um número
-- por agente/departamento), e cada agente vincula a uma instância ao ser
-- criado. Env var continua funcionando como fallback pros agentes antigos
-- (AM, ANSER) até serem migrados pro banco também.

CREATE TABLE IF NOT EXISTS public.zapi_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  label text NOT NULL,
  instance_id text NOT NULL,
  token text NOT NULL,
  client_token text,
  base_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_zapi_instances_tenant_id ON public.zapi_instances(tenant_id);

ALTER TABLE public.zapi_instances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zapi_instances_select" ON public.zapi_instances;
CREATE POLICY "zapi_instances_select" ON public.zapi_instances
  FOR SELECT USING (public.is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "zapi_instances_insert" ON public.zapi_instances;
CREATE POLICY "zapi_instances_insert" ON public.zapi_instances
  FOR INSERT WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "zapi_instances_update" ON public.zapi_instances;
CREATE POLICY "zapi_instances_update" ON public.zapi_instances
  FOR UPDATE USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "zapi_instances_delete" ON public.zapi_instances;
CREATE POLICY "zapi_instances_delete" ON public.zapi_instances
  FOR DELETE USING (public.is_tenant_member(auth.uid(), tenant_id));

-- agents passa a poder linkar numa instância (nullable -- um agente pode
-- existir ainda sem WhatsApp configurado, ou continuar usando env var).
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS zapi_instance_id uuid REFERENCES public.zapi_instances(id) ON DELETE SET NULL;

-- Faltava policy de INSERT em agents e brains -- até aqui só dava pra editar
-- o que a migration/seed já tinha criado, nunca criar agente novo pelo painel.
DROP POLICY IF EXISTS "agents_insert" ON public.agents;
CREATE POLICY "agents_insert" ON public.agents
  FOR INSERT WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "brains_insert" ON public.brains;
CREATE POLICY "brains_insert" ON public.brains
  FOR INSERT WITH CHECK (public.is_tenant_member(auth.uid(), public.agent_tenant_id(agent_id)));
```

---

## [2026-10-01] Integração genérica "API externa" (catálogo de rotas)

```sql
-- Integração genérica "API externa": o tenant cadastra a URL base + auth de
-- uma API qualquer que queira consumir (Conta Azul, Nibo, ERP interno, etc.
-- antes de termos um conector dedicado pra ela) e mapeia as rotas que importam,
-- com uma descrição livre do que cada rota retorna. Por enquanto é só o
-- catálogo/config (sem chamada automática ainda) -- fica pronto pra quando o
-- agente ganhar a capacidade de usar isso como ferramenta.

CREATE TABLE IF NOT EXISTS public.external_apis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  base_url text NOT NULL,
  auth_type text NOT NULL DEFAULT 'none', -- 'none' | 'bearer' | 'api_key' | 'basic'
  auth_header text, -- nome do header quando auth_type = 'api_key' (ex.: 'X-API-Key')
  auth_value text, -- token/chave/credencial (texto livre; formato depende do auth_type)
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.external_api_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_id uuid NOT NULL REFERENCES public.external_apis(id) ON DELETE CASCADE,
  method text NOT NULL DEFAULT 'GET',
  path text NOT NULL, -- ex. '/clientes/{id}/faturas'
  label text NOT NULL, -- nome curto, ex. 'Listar faturas do cliente'
  returns text NOT NULL DEFAULT '', -- descrição livre do que a rota retorna
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_external_apis_tenant_id ON public.external_apis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_external_api_routes_api_id ON public.external_api_routes(api_id);

CREATE OR REPLACE FUNCTION public.external_api_tenant_id(aid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT tenant_id FROM public.external_apis WHERE id = aid;
$$;

ALTER TABLE public.external_apis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_api_routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "external_apis_select" ON public.external_apis;
CREATE POLICY "external_apis_select" ON public.external_apis
  FOR SELECT USING (public.is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "external_apis_insert" ON public.external_apis;
CREATE POLICY "external_apis_insert" ON public.external_apis
  FOR INSERT WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "external_apis_update" ON public.external_apis;
CREATE POLICY "external_apis_update" ON public.external_apis
  FOR UPDATE USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "external_apis_delete" ON public.external_apis;
CREATE POLICY "external_apis_delete" ON public.external_apis
  FOR DELETE USING (public.is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "external_api_routes_select" ON public.external_api_routes;
CREATE POLICY "external_api_routes_select" ON public.external_api_routes
  FOR SELECT USING (public.is_tenant_member(auth.uid(), public.external_api_tenant_id(api_id)));

DROP POLICY IF EXISTS "external_api_routes_insert" ON public.external_api_routes;
CREATE POLICY "external_api_routes_insert" ON public.external_api_routes
  FOR INSERT WITH CHECK (public.is_tenant_member(auth.uid(), public.external_api_tenant_id(api_id)));

DROP POLICY IF EXISTS "external_api_routes_delete" ON public.external_api_routes;
CREATE POLICY "external_api_routes_delete" ON public.external_api_routes
  FOR DELETE USING (public.is_tenant_member(auth.uid(), public.external_api_tenant_id(api_id)));
```

---

## [2026-10-01] Credenciais Trello por tenant

```sql
-- Trello já é usado de verdade (AM/Alana), mas a credencial (API key/token)
-- só existia via env var compartilhada, sem o tenant poder ver/trocar pelo
-- painel. Uma linha por tenant (upsert), mesmo padrão de prioridade: DB antes
-- de env var, pra não quebrar quem já está rodando.

CREATE TABLE IF NOT EXISTS public.trello_credentials (
  tenant_id text PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  api_key text NOT NULL,
  api_token text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trello_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trello_credentials_select" ON public.trello_credentials;
CREATE POLICY "trello_credentials_select" ON public.trello_credentials
  FOR SELECT USING (public.is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "trello_credentials_insert" ON public.trello_credentials;
CREATE POLICY "trello_credentials_insert" ON public.trello_credentials
  FOR INSERT WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "trello_credentials_update" ON public.trello_credentials;
CREATE POLICY "trello_credentials_update" ON public.trello_credentials
  FOR UPDATE USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "trello_credentials_delete" ON public.trello_credentials;
CREATE POLICY "trello_credentials_delete" ON public.trello_credentials
  FOR DELETE USING (public.is_tenant_member(auth.uid(), tenant_id));
```
