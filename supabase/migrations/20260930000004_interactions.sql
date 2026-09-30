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
