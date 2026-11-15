-- Schema de estado persistente pro agente de monitoramento da Anser (briefing
-- de 23 secoes em agents/anser-ops/briefing.md). Cobre a parte que bloqueava
-- tudo: SLA de primeira resposta (secao 3) e alertas com dedup (secao 18).
-- Pendencias, promessas, satisfacao, saude de cliente e relatorios periodicos
-- (demais secoes) entram em migrations seguintes conforme o agente avanca.

-- Grupos monitorados (os 12 confirmados com o cliente em 2026-11-14/15,
-- prefixo "Anser | Controle/Gestao/Entradas/Saidas/Vendas e NFs/Fornecedores/
-- Caixa Fisico" -- excluidos grupos sem prefixo Anser e o grupo interno
-- "Anser | Sete - Projeto: Anser Hub").
CREATE TABLE IF NOT EXISTS public.anser_groups (
  id text PRIMARY KEY, -- group id do Z-API, ex: 120363410596686960-group
  name text NOT NULL,
  client_name text, -- nome comercial do cliente (derivado do nome do grupo, editavel)
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Log bruto das mensagens dos grupos monitorados. Base pra reclassificar
-- depois (satisfacao, erros, baseline de demanda) sem depender de reprocessar
-- o Z-API, e evidencia obrigatoria em todo alerta (secao 20: "sempre
-- apresentar a mensagem original que fundamentou o alerta").
CREATE TABLE IF NOT EXISTS public.anser_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text NOT NULL REFERENCES public.anser_groups(id) ON DELETE CASCADE,
  message_id text, -- messageId do Z-API, pra dedup de webhook retry
  sender_phone text NOT NULL,
  sender_name text,
  is_team boolean NOT NULL, -- true = colaborador Anser (roster), false = cliente
  text text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anser_messages_group_id ON public.anser_messages(group_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_anser_messages_message_id ON public.anser_messages(message_id) WHERE message_id IS NOT NULL;

-- Solicitacoes do cliente que abrem SLA de primeira resposta (secao 3).
-- Classificacao "isso demanda resposta" e feita por IA na ingestao.
CREATE TABLE IF NOT EXISTS public.anser_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text NOT NULL REFERENCES public.anser_groups(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.anser_messages(id) ON DELETE CASCADE,
  client_phone text NOT NULL,
  client_name text,
  summary text NOT NULL, -- descricao resumida da solicitacao (secao 3.2)
  requested_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'aberta', -- aberta | respondida | encerrada
  first_response_at timestamptz,
  first_response_by text, -- nome do colaborador que deu a resposta valida
  alert_30_sent_at timestamptz,
  alert_60_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anser_requests_group_id ON public.anser_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_anser_requests_status ON public.anser_requests(status) WHERE status = 'aberta';

-- Log de todo alerta disparado -- garante a deduplicacao exigida na secao 20
-- ("nao gerar notificacoes duplicadas para a mesma ocorrencia").
CREATE TABLE IF NOT EXISTS public.anser_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text NOT NULL REFERENCES public.anser_groups(id) ON DELETE CASCADE,
  request_id uuid REFERENCES public.anser_requests(id) ON DELETE CASCADE,
  priority text NOT NULL, -- P0 | P1 | P2 | P3
  kind text NOT NULL, -- sla_30 | sla_60 | insatisfacao | promessa_vencida | ...
  message text NOT NULL, -- texto exatamente como foi enviado pro Felipe/Rebeca
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anser_alerts_group_id ON public.anser_alerts(group_id);

ALTER TABLE public.anser_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anser_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anser_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anser_alerts ENABLE ROW LEVEL SECURITY;

-- Essas tabelas sao operadas só pelo backend (service role, via lib/supabase
-- com a secret key) -- nao tem acesso de painel ainda, então a única policy
-- necessária é liberar leitura pros membros do tenant "anser" (dashboard
-- futuro), sem policy de insert/update/delete via client (isso continua
-- restrito ao service role, que ignora RLS).
DROP POLICY IF EXISTS "anser_groups_select" ON public.anser_groups;
CREATE POLICY "anser_groups_select" ON public.anser_groups
  FOR SELECT USING (public.is_tenant_member(auth.uid(), 'anser'));

DROP POLICY IF EXISTS "anser_messages_select" ON public.anser_messages;
CREATE POLICY "anser_messages_select" ON public.anser_messages
  FOR SELECT USING (public.is_tenant_member(auth.uid(), 'anser'));

DROP POLICY IF EXISTS "anser_requests_select" ON public.anser_requests;
CREATE POLICY "anser_requests_select" ON public.anser_requests
  FOR SELECT USING (public.is_tenant_member(auth.uid(), 'anser'));

DROP POLICY IF EXISTS "anser_alerts_select" ON public.anser_alerts;
CREATE POLICY "anser_alerts_select" ON public.anser_alerts
  FOR SELECT USING (public.is_tenant_member(auth.uid(), 'anser'));

INSERT INTO public.anser_groups (id, name, client_name) VALUES
  ('120363410596686960-group', 'Anser | Caixa Físico - Naras Padaria', 'Naras Padaria'),
  ('120363427062772077-group', 'Anser | Fornecedores - Mana Poke', 'Mana Poke'),
  ('120363372320507566-group', 'Anser | Controle - ASSOBIO', 'ASSOBIO'),
  ('120363427179526160-group', 'Anser | Controle - Evodream', 'Evodream'),
  ('120363041409075493-group', 'Anser | Controle - Cauí', 'Cauí'),
  ('120363431258438820-group', 'Anser | Gestão - Prolife', 'Prolife'),
  ('120363430846478162-group', 'Anser | Controle - Prolife', 'Prolife'),
  ('120363408879443161-group', 'Anser | Controle - BEL 01', 'BEL 01'),
  ('120363412254185908-group', 'Anser | Entradas - S.O.S.', 'S.O.S.'),
  ('120363411562401464-group', 'Anser | Saídas - S.O.S.', 'S.O.S.'),
  ('120363429970762965-group', 'Anser | Vendas e NFs de Compra - Cássia Andrade', 'Cássia Andrade'),
  ('120363431059278719-group', 'Anser | Controle - Cássia Andrade', 'Cássia Andrade')
ON CONFLICT (id) DO NOTHING;
