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

export interface AnserConversation {
  id: string;
  name: string;
  client_name: string | null;
  is_group: boolean;
  active: boolean;
}

// Monitora TUDO por padrão (grupo ou DM) -- não existe mais lista fixa de
// permitidos. Na primeira mensagem de uma conversa nova, registra
// automaticamente; "active=false" é a única forma de excluir algo
// manualmente depois (ex.: um grupo interno que não deveria ter sido criado
// na mesma instância). Retorna undefined só quando alguém desativou
// explicitamente essa conversa.
export async function getOrCreateConversation(params: {
  id: string;
  name?: string;
  isGroup: boolean;
}): Promise<AnserConversation | undefined> {
  const existing = await fetch(
    `${SUPABASE_URL}/rest/v1/anser_conversations?id=eq.${encodeURIComponent(params.id)}&select=*`,
    { headers: headers() }
  );
  if (!existing.ok) throw new Error(`Supabase error (anser_conversations select): ${existing.status} ${await existing.text()}`);
  const rows = (await existing.json()) as AnserConversation[];
  if (rows[0]) return rows[0].active ? rows[0] : undefined;

  const created = await fetch(`${SUPABASE_URL}/rest/v1/anser_conversations`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json", Prefer: "return=representation,resolution=ignore-duplicates" },
    body: JSON.stringify({ id: params.id, name: params.name ?? params.id, is_group: params.isGroup }),
  });
  if (!created.ok) throw new Error(`Supabase error (anser_conversations insert): ${created.status} ${await created.text()}`);
  const createdRows = (await created.json()) as AnserConversation[];
  return createdRows[0];
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
