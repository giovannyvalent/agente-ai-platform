import { askOpenAI } from "../../lib/openai.js";
import { sendTextMessage } from "../../lib/zapi.js";
import { extractText, isValidIncoming, type ZApiPayload } from "../../lib/zapi.js";
import {
  getOrCreateConversation,
  logAnserMessage,
  getOpenRequestForGroup,
  createAnserRequest,
  closeAnserRequestFirstResponse,
  getOpenAnserRequests,
  markAnserAlertSent,
  logAnserAlert,
  logSatisfactionEvent,
  createPendency,
  logOpportunity,
  logError,
  createPromise,
  getOverduePromises,
  markPromiseOverdue,
} from "../../lib/anser-db.js";
import { ANSER_ALERT_RECIPIENTS, ANSER_SLA_ALERT_30_MIN, ANSER_SLA_ALERT_60_MIN, anserZapiCreds, findAnserTeamMember } from "./config.js";
import { SISTEMA_CLASSIFICA_MENSAGEM_EQUIPE, SISTEMA_CLASSIFICA_MENSAGEM_CLIENTE } from "./prompts.js";

function parseJson<T>(raw: string): T | undefined {
  try {
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return undefined;
  }
}

interface ClientClassification {
  is_request: boolean;
  summary: string;
  satisfaction: "positivo" | "neutro" | "atencao" | "critico";
  satisfaction_reason: string;
  is_pendency: boolean;
  pendency_description: string;
  is_financial_critical: boolean;
  financial_critical_reason: string;
  is_opportunity: boolean;
  opportunity_description: string;
  requires_director: boolean;
  director_reason: string;
}

async function classifyClientMessage(text: string): Promise<ClientClassification | undefined> {
  const raw = await askOpenAI({ system: SISTEMA_CLASSIFICA_MENSAGEM_CLIENTE, prompt: text, maxTokens: 500 });
  return parseJson<ClientClassification>(raw);
}

interface TeamClassification {
  is_effective_response: boolean;
  is_promise: boolean;
  promise_content: string;
  promise_deadline_iso: string | null;
  is_error_admission: boolean;
  error_description: string;
  error_severity: "normal" | "alto_impacto";
}

async function classifyTeamMessage(requestSummary: string | undefined, text: string): Promise<TeamClassification | undefined> {
  const nowIso = new Date().toLocaleString("sv-SE", { timeZone: "America/Belem" }).replace(" ", "T");
  const contexto = requestSummary
    ? `Solicitação pendente do cliente: "${requestSummary}"`
    : "Não há solicitação de cliente em aberto nesta conversa no momento.";
  const raw = await askOpenAI({
    system: SISTEMA_CLASSIFICA_MENSAGEM_EQUIPE,
    prompt: `Horário de referência (America/Belem): ${nowIso}\n\n${contexto}\n\nMensagem do colaborador: "${text}"`,
    maxTokens: 300,
  });
  return parseJson<TeamClassification>(raw);
}

// Processa uma mensagem recebida via webhook Z-API da instância Anser.
// Monitora TUDO por padrão -- grupo ou conversa individual (DM) -- e
// registra a conversa automaticamente no primeiro contato (sem lista fixa de
// permitidos). "active=false" em anser_conversations é a única forma de
// excluir algo manualmente depois.
export async function processAnserIncoming(payload: ZApiPayload): Promise<void> {
  if (!isValidIncoming(payload)) return;

  const text = extractText(payload);
  if (!text) return;

  const group = await getOrCreateConversation({
    id: payload.phone,
    name: payload.chatName ?? payload.senderName,
    isGroup: payload.isGroup,
  });
  if (!group) return; // conversa desativada manualmente

  const senderPhone = payload.participantPhone ?? payload.phone;
  const team = findAnserTeamMember(senderPhone);
  const isTeam = team !== undefined;
  const sentAt = new Date().toISOString();

  const messageId = await logAnserMessage({
    groupId: group.id,
    messageId: payload.messageId,
    senderPhone,
    senderName: team?.name ?? payload.senderName,
    isTeam,
    text,
    sentAt,
  });
  if (!messageId) return; // mensagem duplicada (retry de webhook), já logada antes

  if (!isTeam) {
    await handleClientMessage({ group, messageId, text, senderPhone, senderName: payload.senderName, sentAt });
    return;
  }

  await handleTeamMessage({ group, messageId, text, collaboratorName: team!.name, sentAt });
}

async function handleClientMessage(params: {
  group: { id: string; client_name: string | null };
  messageId: string;
  text: string;
  senderPhone: string;
  senderName?: string;
  sentAt: string;
}): Promise<void> {
  const { group, messageId, text, senderPhone, senderName, sentAt } = params;

  const existingOpen = await getOpenRequestForGroup(group.id);
  const classification = await classifyClientMessage(text);
  if (!classification) return;

  if (classification.is_request && !existingOpen) {
    await createAnserRequest({
      groupId: group.id,
      messageId,
      clientPhone: senderPhone,
      clientName: senderName ?? group.client_name ?? undefined,
      summary: classification.summary,
      requestedAt: sentAt,
    });
  }

  if (classification.is_pendency) {
    await createPendency({ groupId: group.id, messageId, description: classification.pendency_description });
  }

  if (classification.is_opportunity) {
    await logOpportunity({ groupId: group.id, messageId, description: classification.opportunity_description });
  }

  if (classification.satisfaction !== "neutro") {
    await logSatisfactionEvent({
      groupId: group.id,
      messageId,
      classification: classification.satisfaction,
      reason: classification.satisfaction_reason,
    });
  }

  // Seções 4.2 (crítico), 9 (financeiro crítico) e 17 (intervenção da
  // direção) descrevem ângulos diferentes do MESMO tipo de ocorrência grave.
  // Consolida num único alerta P0 pra não disparar 2-3 mensagens pra mesma
  // mensagem do cliente (regra anti-duplicação da seção 20).
  const criticalReasons: string[] = [];
  if (classification.satisfaction === "critico") criticalReasons.push(`Insatisfação crítica: ${classification.satisfaction_reason}`);
  if (classification.is_financial_critical) criticalReasons.push(`Financeiro crítico: ${classification.financial_critical_reason}`);
  if (classification.requires_director) criticalReasons.push(`Intervenção da direção: ${classification.director_reason}`);

  if (criticalReasons.length > 0) {
    const message = buildCriticalAlertMessage({
      clientName: senderName ?? group.client_name,
      originalText: text,
      reasons: criticalReasons,
    });
    await sendAlertToManagement(message);
    await logAnserAlert({ groupId: group.id, priority: "P0", kind: "critico", message });
  } else if (classification.satisfaction === "atencao") {
    const message = buildAttentionAlertMessage({
      clientName: senderName ?? group.client_name,
      originalText: text,
      reason: classification.satisfaction_reason,
    });
    await sendAlertToManagement(message);
    await logAnserAlert({ groupId: group.id, priority: "P2", kind: "insatisfacao_atencao", message });
  }
}

async function handleTeamMessage(params: {
  group: { id: string };
  messageId: string;
  text: string;
  collaboratorName: string;
  sentAt: string;
}): Promise<void> {
  const { group, messageId, text, collaboratorName, sentAt } = params;

  const openRequest = await getOpenRequestForGroup(group.id);
  const classification = await classifyTeamMessage(openRequest?.summary, text);
  if (!classification) return;

  if (openRequest && classification.is_effective_response) {
    await closeAnserRequestFirstResponse(openRequest.id, sentAt, collaboratorName);
  }

  if (classification.is_promise) {
    await createPromise({
      groupId: group.id,
      messageId,
      collaboratorName,
      content: classification.promise_content,
      deadlineIso: classification.promise_deadline_iso,
    });
  }

  if (classification.is_error_admission) {
    await logError({
      groupId: group.id,
      messageId,
      description: classification.error_description,
      severity: classification.error_severity,
    });

    if (classification.error_severity === "alto_impacto") {
      const message = `*ALERTA - ERRO OPERACIONAL DE ALTO IMPACTO*\n\nColaborador: ${collaboratorName}\nDescrição: ${classification.error_description}\nMensagem original: "${text}"\n\nAção recomendada: avaliar impacto financeiro/jurídico/contratual e providenciar correção.`;
      await sendAlertToManagement(message);
      await logAnserAlert({ groupId: group.id, priority: "P1", kind: "erro_alto_impacto", message });
    }
  }
}

function buildCriticalAlertMessage(params: { clientName?: string | null; originalText: string; reasons: string[] }): string {
  return `*ALERTA CRÍTICO*\n\nCliente: ${params.clientName ?? "não identificado"}\n${params.reasons.join("\n")}\n\nMensagem original: "${params.originalText}"\n\nPrioridade: P0.\nAção recomendada: intervenção imediata da supervisão.`;
}

function buildAttentionAlertMessage(params: { clientName?: string | null; originalText: string; reason: string }): string {
  return `*ALERTA DE ATENÇÃO - INSATISFAÇÃO*\n\nCliente: ${params.clientName ?? "não identificado"}\nMotivo: ${params.reason}\nMensagem original: "${params.originalText}"\n\nAção recomendada: avaliar e tratar com o cliente.`;
}

// Varredura periódica (seções 3.2/3.3 — SLA; seção 6 — promessas vencidas).
// Chamada a cada 5min pelo GitHub Action porque não existe outro gatilho: sem
// mensagem nova, nada aciona esses alertas de tempo sozinho.
export async function sweepAnserSla(): Promise<{ checked: number; alertsSent: number }> {
  const openRequests = await getOpenAnserRequests();
  const now = Date.now();
  let alertsSent = 0;

  for (const req of openRequests) {
    const elapsedMin = (now - new Date(req.requested_at).getTime()) / 60000;

    if (elapsedMin >= ANSER_SLA_ALERT_60_MIN && !req.alert_60_sent_at) {
      const message = buildSlaAlertMessage(req, 60);
      await sendAlertToManagement(message);
      await logAnserAlert({ groupId: req.group_id, requestId: req.id, priority: "P1", kind: "sla_60", message });
      await markAnserAlertSent(req.id, "alert_60_sent_at");
      alertsSent++;
    } else if (elapsedMin >= ANSER_SLA_ALERT_30_MIN && !req.alert_30_sent_at) {
      const message = buildSlaAlertMessage(req, 30);
      await sendAlertToManagement(message);
      await logAnserAlert({ groupId: req.group_id, requestId: req.id, priority: "P2", kind: "sla_30", message });
      await markAnserAlertSent(req.id, "alert_30_sent_at");
      alertsSent++;
    }
  }

  const overduePromises = await getOverduePromises();
  for (const promise of overduePromises) {
    const message = `*ALERTA - COMPROMISSO NÃO CUMPRIDO*\n\nColaborador: ${promise.collaborator_name}\nCompromisso: ${promise.content}\nSituação: prazo vencido sem evidência de cumprimento.\n\nAção recomendada: verificar o cumprimento e atualizar o cliente.`;
    await sendAlertToManagement(message);
    await logAnserAlert({ groupId: promise.group_id, priority: "P1", kind: "promessa_vencida", message });
    await markPromiseOverdue(promise.id);
    alertsSent++;
  }

  return { checked: openRequests.length + overduePromises.length, alertsSent };
}

function buildSlaAlertMessage(req: { client_name: string | null; summary: string; requested_at: string }, threshold: 30 | 60): string {
  const hora = new Date(req.requested_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Belem" });
  const titulo = threshold === 60 ? "*ALERTA DE ATENDIMENTO - ATRASO CRITICO (60min)*" : "*ALERTA DE ATENDIMENTO - 30 MINUTOS*";
  return `${titulo}\n\nCliente: ${req.client_name ?? "não identificado"}\nHorário da solicitação: ${hora}\nTempo sem resposta: ${threshold} minutos\nSolicitação: ${req.summary}\n\nAção recomendada: verificar a solicitação e retornar ao cliente.`;
}

async function sendAlertToManagement(message: string): Promise<void> {
  const creds = anserZapiCreds();
  await Promise.all(ANSER_ALERT_RECIPIENTS.map((phone) => sendTextMessage(creds, phone, message)));
}
