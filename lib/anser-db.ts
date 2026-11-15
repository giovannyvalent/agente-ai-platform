// Acesso ao estado persistente do agente Anser (grupos, mensagens, requests
// de SLA, alertas). Mesmo padrão isolado de lib/interactions.ts e
// lib/dispatches.ts — fetch direto no PostgREST, sem depender de agents/index.ts.
const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? "";

function headers() {
  return {
    apikey: SUPABASE_SECRET_KEY,
    Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
  };
}

export interface AnserGroup {
  id: string;
  name: string;
  client_name: string | null;
  active: boolean;
}

export async function getMonitoredGroup(groupId: string): Promise<AnserGroup | undefined> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/anser_groups?id=eq.${encodeURIComponent(groupId)}&active=eq.true&select=*`,
    { headers: headers() }
  );
  if (!res.ok) throw new Error(`Supabase error (anser_groups): ${res.status} ${await res.text()}`);
  const rows = (await res.json()) as AnserGroup[];
  return rows[0];
}

export async function logAnserMessage(params: {
  groupId: string;
  messageId?: string;
  senderPhone: string;
  senderName?: string;
  isTeam: boolean;
  text: string;
  sentAt: string;
}): Promise<string | undefined> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/anser_messages`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json", Prefer: "return=representation,resolution=ignore-duplicates" },
    body: JSON.stringify({
      group_id: params.groupId,
      message_id: params.messageId,
      sender_phone: params.senderPhone,
      sender_name: params.senderName,
      is_team: params.isTeam,
      text: params.text,
      sent_at: params.sentAt,
    }),
  });
  if (!res.ok) throw new Error(`Supabase error (anser_messages insert): ${res.status} ${await res.text()}`);
  const rows = (await res.json()) as { id: string }[];
  return rows[0]?.id;
}

export interface AnserRequest {
  id: string;
  group_id: string;
  client_phone: string;
  client_name: string | null;
  summary: string;
  requested_at: string;
  status: "aberta" | "respondida" | "encerrada";
  alert_30_sent_at: string | null;
  alert_60_sent_at: string | null;
}

export async function getOpenRequestForGroup(groupId: string): Promise<AnserRequest | undefined> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/anser_requests?group_id=eq.${encodeURIComponent(groupId)}&status=eq.aberta&order=requested_at.desc&limit=1&select=*`,
    { headers: headers() }
  );
  if (!res.ok) throw new Error(`Supabase error (anser_requests query): ${res.status} ${await res.text()}`);
  const rows = (await res.json()) as AnserRequest[];
  return rows[0];
}

export async function createAnserRequest(params: {
  groupId: string;
  messageId: string;
  clientPhone: string;
  clientName?: string;
  summary: string;
  requestedAt: string;
}): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/anser_requests`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      group_id: params.groupId,
      message_id: params.messageId,
      client_phone: params.clientPhone,
      client_name: params.clientName,
      summary: params.summary,
      requested_at: params.requestedAt,
    }),
  });
  if (!res.ok) throw new Error(`Supabase error (anser_requests insert): ${res.status} ${await res.text()}`);
}

export async function closeAnserRequestFirstResponse(
  requestId: string,
  respondedAt: string,
  respondedBy: string
): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/anser_requests?id=eq.${encodeURIComponent(requestId)}`, {
    method: "PATCH",
    headers: { ...headers(), "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      status: "respondida",
      first_response_at: respondedAt,
      first_response_by: respondedBy,
    }),
  });
  if (!res.ok) throw new Error(`Supabase error (anser_requests update): ${res.status} ${await res.text()}`);
}

export async function getOpenAnserRequests(): Promise<AnserRequest[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/anser_requests?status=eq.aberta&select=*`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Supabase error (anser_requests sweep): ${res.status} ${await res.text()}`);
  return res.json();
}

export async function markAnserAlertSent(requestId: string, field: "alert_30_sent_at" | "alert_60_sent_at"): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/anser_requests?id=eq.${encodeURIComponent(requestId)}`, {
    method: "PATCH",
    headers: { ...headers(), "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ [field]: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`Supabase error (anser_requests alert mark): ${res.status} ${await res.text()}`);
}

export async function logAnserAlert(params: {
  groupId: string;
  requestId?: string;
  priority: "P0" | "P1" | "P2" | "P3";
  kind: string;
  message: string;
}): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/anser_alerts`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      group_id: params.groupId,
      request_id: params.requestId,
      priority: params.priority,
      kind: params.kind,
      message: params.message,
    }),
  });
  if (!res.ok) throw new Error(`Supabase error (anser_alerts insert): ${res.status} ${await res.text()}`);
}
