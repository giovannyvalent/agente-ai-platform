export interface ZApiCreds {
  instanceId?: string;
  token?: string;
  clientToken?: string;
  baseUrl?: string;
}

function requireCreds(creds: ZApiCreds): void {
  if (!creds.instanceId || !creds.token) {
    throw new Error("Credenciais Z-API ausentes (instanceId/token) para este agente");
  }
}

async function zapiPost(creds: ZApiCreds, endpoint: string, body: object): Promise<unknown> {
  requireCreds(creds);
  const base = creds.baseUrl ?? "https://api.z-api.io";
  const res = await fetch(`${base}/instances/${creds.instanceId}/token/${creds.token}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Token": creds.clientToken ?? "",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Z-API error (${endpoint}): ${await res.text()}`);
  return res.json();
}

export async function sendTextMessage(creds: ZApiCreds, phone: string, message: string): Promise<void> {
  if (!phone) return;
  await zapiPost(creds, "send-text", { phone, message });
}

// ─── Payload recebido no webhook da Z-API ─────────────────────────
export interface ZApiPayload {
  isGroup: boolean;
  isNewsletter?: boolean;
  isStatusReply?: boolean;
  isEdit?: boolean;
  fromMe: boolean;
  broadcast?: boolean;
  notification?: string;
  phone: string;
  chatName?: string;
  senderName?: string;
  participantPhone?: string;
  messageId?: string;
  text?: { message: string };
  image?: { caption?: string; imageUrl?: string; mimeType?: string };
  video?: { caption?: string };
  document?: { title?: string };
  audio?: object;
  location?: { address?: string };
}

export function extractText(payload: ZApiPayload): string | null {
  if (payload.text?.message) return payload.text.message;
  if (payload.image) return payload.image.caption ?? "(imagem sem legenda)";
  if (payload.video?.caption) return payload.video.caption;
  if (payload.document?.title) return `[Documento: ${payload.document.title}]`;
  if (payload.audio) return "[Áudio recebido]";
  if (payload.location) return "[Localização compartilhada]";
  return null;
}

export function isValidIncoming(payload: ZApiPayload): boolean {
  if (payload.fromMe) return false;
  if (payload.notification) return false;
  if (payload.isStatusReply) return false;
  if (payload.broadcast) return false;
  return extractText(payload) !== null;
}
