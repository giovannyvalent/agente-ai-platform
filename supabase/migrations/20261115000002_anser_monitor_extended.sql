-- Segundo lote de tabelas do agente Anser (primeiro lote: SLA/alertas em
-- 20261115000001). Cobre as secoes 4 (satisfacao), 5 (pendencias), 6
-- (promessas/compromissos), 7 (erros operacionais), 13 (oportunidades
-- comerciais) do briefing. Financeiro critico (9) e intervencao da direcao
-- (17) nao tem tabela propria -- sao sinalizados na classificacao e viram
-- alerta imediato combinado, sem precisar de estado persistente proprio.

CREATE TABLE IF NOT EXISTS public.anser_satisfaction_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text NOT NULL REFERENCES public.anser_groups(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.anser_messages(id) ON DELETE CASCADE,
  classification text NOT NULL, -- positivo | atencao | critico (neutro nao e logado)
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anser_satisfaction_group_id ON public.anser_satisfaction_events(group_id);

CREATE TABLE IF NOT EXISTS public.anser_pendencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text NOT NULL REFERENCES public.anser_groups(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.anser_messages(id) ON DELETE CASCADE,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'aberta', -- aberta | concluida
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anser_pendencies_group_id ON public.anser_pendencies(group_id);
CREATE INDEX IF NOT EXISTS idx_anser_pendencies_status ON public.anser_pendencies(status) WHERE status = 'aberta';

CREATE TABLE IF NOT EXISTS public.anser_promises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text NOT NULL REFERENCES public.anser_groups(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.anser_messages(id) ON DELETE CASCADE,
  collaborator_name text NOT NULL,
  content text NOT NULL,
  deadline timestamptz, -- resolvido pela IA a partir do texto; null se nao deu pra resolver
  status text NOT NULL DEFAULT 'pendente', -- pendente | vencida | encerrada
  alert_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anser_promises_group_id ON public.anser_promises(group_id);
CREATE INDEX IF NOT EXISTS idx_anser_promises_status ON public.anser_promises(status) WHERE status = 'pendente';

CREATE TABLE IF NOT EXISTS public.anser_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text NOT NULL REFERENCES public.anser_groups(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.anser_messages(id) ON DELETE CASCADE,
  description text NOT NULL,
  severity text NOT NULL, -- normal | alto_impacto
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anser_errors_group_id ON public.anser_errors(group_id);

CREATE TABLE IF NOT EXISTS public.anser_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text NOT NULL REFERENCES public.anser_groups(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.anser_messages(id) ON DELETE CASCADE,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anser_opportunities_group_id ON public.anser_opportunities(group_id);

ALTER TABLE public.anser_satisfaction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anser_pendencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anser_promises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anser_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anser_opportunities ENABLE ROW LEVEL SECURITY;

-- Mesma lógica das tabelas do primeiro lote: só o backend (service role)
-- escreve; policy de select existe só pro painel futuro.
DROP POLICY IF EXISTS "anser_satisfaction_events_select" ON public.anser_satisfaction_events;
CREATE POLICY "anser_satisfaction_events_select" ON public.anser_satisfaction_events
  FOR SELECT USING (public.is_tenant_member(auth.uid(), 'anser'));

DROP POLICY IF EXISTS "anser_pendencies_select" ON public.anser_pendencies;
CREATE POLICY "anser_pendencies_select" ON public.anser_pendencies
  FOR SELECT USING (public.is_tenant_member(auth.uid(), 'anser'));

DROP POLICY IF EXISTS "anser_promises_select" ON public.anser_promises;
CREATE POLICY "anser_promises_select" ON public.anser_promises
  FOR SELECT USING (public.is_tenant_member(auth.uid(), 'anser'));

DROP POLICY IF EXISTS "anser_errors_select" ON public.anser_errors;
CREATE POLICY "anser_errors_select" ON public.anser_errors
  FOR SELECT USING (public.is_tenant_member(auth.uid(), 'anser'));

DROP POLICY IF EXISTS "anser_opportunities_select" ON public.anser_opportunities;
CREATE POLICY "anser_opportunities_select" ON public.anser_opportunities
  FOR SELECT USING (public.is_tenant_member(auth.uid(), 'anser'));
