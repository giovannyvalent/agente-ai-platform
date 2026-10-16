// Wrapper fino sobre a API da OpenAI (Chat Completions) — usado pelos agentes
// que precisam de IA de verdade pra interpretar dado bruto (ex.: classificar
// cards do Trello segundo um briefing), diferente do lib/commands.ts (que é
// 100% determinístico). Modelo configurável via env var pra não depender de eu
// acertar o nome exato do modelo mais recente.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o";

export async function askOpenAI(params: {
  system: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
}): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY não configurada");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: params.model ?? DEFAULT_MODEL,
      max_tokens: params.maxTokens ?? 3000,
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.prompt },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return (data.choices[0]?.message.content ?? "").trim();
}
