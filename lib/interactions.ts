// Log de cada mensagem processada — fonte de dado real da tela de Relatórios.
// Fica isolado (não depende de agents/index.ts) pra evitar import circular.
const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? "";

export async function logInteraction(params: {
  agentId: string;
  phone: string;
  messageIn: string;
  messageOut: string;
  durationMs: number;
}): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) return;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/interactions`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SECRET_KEY,
        Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        agent_id: params.agentId,
        phone: params.phone,
        message_in: params.messageIn,
        message_out: params.messageOut,
        duration_ms: params.durationMs,
      }),
    });
    if (!res.ok) console.error("[interactions] erro ao registrar:", res.status, await res.text());
  } catch (err) {
    console.error("[interactions] falha ao registrar:", (err as Error).message);
  }
}
