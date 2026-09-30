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
