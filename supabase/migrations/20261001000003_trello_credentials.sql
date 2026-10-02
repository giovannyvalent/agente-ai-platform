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
