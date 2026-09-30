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
