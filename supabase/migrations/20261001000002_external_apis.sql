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
