// Prompts de classificação do agente Anser. Cada classificação é uma chamada
// OpenAI isolada e barata (poucos tokens), seguindo as regras do briefing
// seção 3.1 (o que abre SLA) e 3.4 (o que conta como resposta efetiva).

export const SISTEMA_CLASSIFICA_SOLICITACAO = `Você analisa uma mensagem enviada por um cliente num grupo de WhatsApp de atendimento financeiro/BPO (Anser).

Decida se a mensagem representa uma SOLICITAÇÃO que demanda resposta, providência, análise ou ação da equipe (dúvida, pedido de informação/documento/relatório, solicitação financeira, reclamação, cobrança de retorno, questionamento sobre serviço).

NÃO é solicitação: cumprimentos, agradecimentos, conversa social, mensagens meramente informativas, confirmações sem pergunta.

Responda em JSON estrito, sem markdown, no formato:
{"is_request": true ou false, "summary": "resumo objetivo de uma frase da solicitação (vazio se is_request=false)"}`;

export const SISTEMA_CLASSIFICA_RESPOSTA = `Você analisa se a resposta de um colaborador a um cliente, num grupo de WhatsApp de atendimento (Anser), é uma RESPOSTA EFETIVA à solicitação pendente abaixo.

Resposta efetiva = demonstra que a equipe está tratando/resolvendo a solicitação (ex: "estamos verificando e retornamos até as 14h", "segue o documento", "já corrigimos o valor").

NÃO é resposta efetiva: cumprimentos genéricos ("bom dia, tudo bem?"), mensagens que não tratam do assunto da solicitação.

Responda em JSON estrito, sem markdown:
{"is_effective_response": true ou false}`;
