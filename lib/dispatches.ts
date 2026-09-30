// Acesso à tabela dispatches — isolado (sem depender de agents/index.ts) pra
// evitar import circular, mesmo padrão de lib/interactions.ts.
const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? "";

function headers() {
  return {
    apikey: SUPABASE_SECRET_KEY,
    Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
  };
}

export interface DispatchRow {
  id: string;
  agent_id: string;
  name: string;
  rules: string;
  token: string;
  enabled: boolean;
}

export async function getDispatchByToken(token: string): Promise<DispatchRow | undefined> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/dispatches?token=eq.${encodeURIComponent(token)}&select=*`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Supabase error (dispatches): ${res.status} ${await res.text()}`);
  const rows = (await res.json()) as DispatchRow[];
  return rows[0];
}

export async function touchDispatch(id: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/dispatches?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...headers(), "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ last_run_at: new Date().toISOString() }),
  });
}
