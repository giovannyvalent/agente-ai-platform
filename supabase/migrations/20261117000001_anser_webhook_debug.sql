-- Tabela temporária de diagnóstico: registra TODA chamada recebida no
-- webhook da Anser, independente do formato do payload, pra confirmar se a
-- Z-API está de fato entregando mensagens reais (investigação 2026-11-17 —
-- anser_messages zerado mesmo com webhook e filtros configurados certo).
CREATE TABLE IF NOT EXISTS public.anser_webhook_debug (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  headers jsonb,
  body jsonb,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.anser_webhook_debug ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anser_webhook_debug_select" ON public.anser_webhook_debug;
CREATE POLICY "anser_webhook_debug_select" ON public.anser_webhook_debug
  FOR SELECT USING (public.is_tenant_member(auth.uid(), 'anser'));
