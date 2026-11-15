-- Correcao de escopo: o agente nao deve ficar restrito a uma lista fixa de
-- grupos (allowlist). Tem que monitorar TUDO que o numero da Anser participa
-- -- grupos e conversas individuais (DM) -- com a possibilidade de desativar
-- uma conversa especifica depois (active=false vira denylist pontual, nao o
-- contrario). anser_groups vira anser_conversations (mesmo id, so passa a
-- aceitar tambem telefone de contato individual, nao so group id do Z-API).

ALTER TABLE public.anser_groups RENAME TO anser_conversations;

ALTER TABLE public.anser_conversations ADD COLUMN IF NOT EXISTS is_group boolean NOT NULL DEFAULT true;

-- Linhas ja existentes (os 12 grupos confirmados) continuam validas -- so
-- deixam de ser a UNICA fonte de verdade. Conversas novas (grupo ou DM) sao
-- auto-registradas na ingestao (ver lib/anser-db.ts getOrCreateConversation),
-- em vez de precisarem de INSERT manual aqui.

DROP POLICY IF EXISTS "anser_groups_select" ON public.anser_conversations;
DROP POLICY IF EXISTS "anser_conversations_select" ON public.anser_conversations;
CREATE POLICY "anser_conversations_select" ON public.anser_conversations
  FOR SELECT USING (public.is_tenant_member(auth.uid(), 'anser'));
