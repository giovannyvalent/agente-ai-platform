-- Novo tenant: ANSER. Agente de monitoramento de atendimento (semaforo por
-- grupo de WhatsApp + relatorios periodicos), portado de C:\projetos\wpp-ai-platform.
-- Cerebro documentado na integra -- a logica de execucao (tempo + analise de IA)
-- ainda nao foi portada, ver decisoes pendentes na conversa.

INSERT INTO public.tenants (id, name)
VALUES ('anser', 'ANSER')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.agents (id, name, tenant_id, enabled)
VALUES ('anser-monitor', 'Agente Monitoramento de Atendimento', 'anser', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tenant_users (user_id, tenant_id)
VALUES ('f06e34ce-c864-4957-9b0d-636b80b60eab', 'anser')
ON CONFLICT DO NOTHING;

INSERT INTO public.brains (agent_id, content, updated_by)
VALUES ('anser-monitor', $brain$# Cérebro — Agente Monitoramento de Atendimento (ANSER)

Portado de C:\projetos\wpp-ai-platform (sistema original da Anser). Ainda não
está com a lógica de execução ligada nessa plataforma — isso é o "cérebro" com
as regras documentadas, servindo de referência pra implementação.

## O que é o sistema
Monitora automaticamente os grupos de WhatsApp dos clientes da Anser, avaliando
qualidade e tempo de resposta do atendimento em tempo real. Quando identifica
problemas, dispara alertas imediatos para os responsáveis via WhatsApp. Ao final
de cada período do dia, envia relatório consolidado de desempenho por atendente
e grupo.

## Semáforo de atendimento
Cada grupo de cliente tem um farol atualizado continuamente:
- 🟢 Verde — atendimento dentro do prazo, cliente satisfeito
- 🟡 Amarelo — atenção, prazo próximo do limite ou qualidade abaixo do esperado
- 🔴 Vermelho — ação imediata, prazo estourado ou cliente insatisfeito

## Alertas por tempo de resposta
Só gera alerta quando o CLIENTE está aguardando resposta da equipe (nunca o
contrário — equipe aguardando cliente não é problema de atendimento).

BPO:
- Cliente aguardando resposta: 30min amarelo, 1h vermelho
- Grupo sem atividade nenhuma: 12h amarelo, 1 dia vermelho

Consultoria:
- Cliente aguardando resposta: 1h amarelo, 2h vermelho
- Grupo sem atividade nenhuma: 2 dias amarelo, 3 dias vermelho

## Alertas por análise de IA
A cada janela de conversa encerrada, a IA analisa o conteúdo e classifica:
- 🔴 Vermelho — tom frustrado/conflito, ou mesma dúvida repetida mais de uma vez
- 🟡 Amarelo — conversa encerrada sem confirmação de resolução do cliente, ou
  erros ortográficos do atendente
- 🟢 Verde — resposta em até 30min + cliente confirmou + tom cordial

## Quem recebe os alertas
- BPO, horário comercial (seg-sex 8h-20h): Felipe, Giovanny, Rebeka
- Consultoria, horário comercial: João, Guidion, Giovanny
- Fora do horário comercial (qualquer área): Felipe, João, Giovanny

Deduplicação: o mesmo alerta não dispara duas vezes pro mesmo problema. Quando
a equipe responde o cliente, os alertas ativos daquele grupo são encerrados.

## Reports periódicos (4x ao dia, horário de Belém)
- 06h — janela 00h→06h — Felipe, João, Giovanny
- 12h — janela 06h→12h — Felipe (grupos Controle), João (grupos Gestão), Giovanny
- 18h — janela 12h→18h — Felipe (grupos Controle), João (grupos Gestão), Giovanny
- 22h — janela 18h→22h — Felipe, João, Giovanny

Cada report lista os grupos organizados por farol (Vermelho → Amarelo → Verde),
agrupados por atendente, com os motivos identificados pela IA.

## Grupos não monitorados
Grupos internos da Anser não entram no monitoramento — só grupos de clientes.

## Oráculo — assistente pessoal do Felipe
Ativado via mensagem direta no WhatsApp (não em grupo). Responde perguntas,
analisa documentos/imagens, mantém histórico de contexto da conversa.

## Pendências pra essa lógica funcionar nessa plataforma
1. Depende de IA (Claude) pra classificar tom/qualidade da conversa — essa
   plataforma está propositalmente sem IA ligada ainda.
2. Reports 4x/dia em horários fixos — a Vercel no plano Hobby só permite cron
   1x/dia; precisa de upgrade de plano ou outro mecanismo de disparo.
3. Precisa de tabelas novas (janelas de conversa por grupo, estado do semáforo
   por grupo, histórico de KPI) — schema bem diferente do modelo Trello atual.
$brain$, 'migration-anser')
ON CONFLICT (agent_id) DO NOTHING;
