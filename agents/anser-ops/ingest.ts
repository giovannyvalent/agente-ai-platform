import { askOpenAI } from "../../lib/openai.js";
import { sendTextMessage } from "../../lib/zapi.js";
import { extractText, isValidIncoming, type ZApiPayload } from "../../lib/zapi.js";
import {
  getMonitoredGroup,
  logAnserMessage,
  getOpenRequestForGroup,
  createAnserRequest,
  closeAnserRequestFirstResponse,
  getOpenAnserRequests,
  markAnserAlertSent,
  logAnserAlert,
} from "../../lib/anser-db.js";
import { ANSER_ALERT_RECIPIENTS, ANSER_SLA_ALERT_30_MIN, ANSER_SLA_ALERT_60_MIN, anserZapiCreds, findAnserTeamMember } from "./config.js";
import { SISTEMA_CLASSIFICA_RESPOSTA, SISTEMA_CLASSIFICA_SOLICITACAO } from "./prompts.js";

function parseJson<T>(raw: string): T | undefined {
  try {
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return undefined;
  }
}

async function classifyRequest(text: string): Promise<{ isRequest: boolean; summary: string }> {
  const raw = await askOpenAI({ system: SISTEMA_CLASSIFICA_SOLICITACAO, prompt: text, maxTokens: 200 });
  const parsed = parseJson<{ is_request: boolean; summary: string }>(raw);
  if (!parsed) return { isRequest: false, summary: "" };
  return { isRequest: parsed.is_request, summary: parsed.summary ?? "" };
}

async function classifyResponse(requestSummary: string, replyText: string): Promise<boolean> {
  const raw = await askOpenAI({
    system: SISTEMA_CLASSIFICA_RESPOSTA,
    prompt: `Solicitação pendente: "${requestSummary}"\n\nResposta do colaborador: "${replyText}"`,
    maxTokens: 100,
  });
  const parsed = parseJson<{ is_effective_response: boolean }>(raw);
  return parsed?.is_effective_response ?? false;
}

// Processa uma mensagem recebida via webhook Z-API da instância Anser. Só age
// se o grupo estiver na lista de monitorados (agents/anser-ops/config + tabela
// anser_groups); mensagens de grupos fora da lista são ignoradas.
export async function processAnserIncoming(payload: ZApiPayload): Promise<void> {
  if (!payload.isGroup || !isValidIncoming(payload)) return;

  const group = await getMonitoredGroup(payload.phone);
  if (!group) return;

  const text = extractText(payload);
  if (!text) return;

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
    const existingOpen = await getOpenRequestForGroup(group.id);
    if (existingOpen) return; // já tem SLA em andamento pra esse grupo, não duplica

    const { isRequest, summary } = await classifyRequest(text);
    if (isRequest) {
      await createAnserRequest({
        groupId: group.id,
        messageId,
        clientPhone: senderPhone,
        clientName: payload.senderName ?? group.client_name ?? undefined,
        summary,
        requestedAt: sentAt,
      });
    }
    return;
  }

  const openRequest = await getOpenRequestForGroup(group.id);
  if (!openRequest) return;

  const effective = await classifyResponse(openRequest.summary, text);
  if (effective) {
    await closeAnserRequestFirstResponse(openRequest.id, sentAt, team!.name);
  }
}

// Varredura de SLA (seções 3.2/3.3) — chamada periodicamente (ver endpoint de
// cron/debug) porque não existe outro gatilho: sem resposta nova no grupo, não
// tem webhook pra acionar o alerta de tempo vencido.
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

  return { checked: openRequests.length, alertsSent };
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
