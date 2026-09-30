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
