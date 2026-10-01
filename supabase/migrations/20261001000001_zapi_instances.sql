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
