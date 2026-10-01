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
