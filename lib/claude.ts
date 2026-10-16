// Wrapper fino sobre a API da Anthropic — usado pelos agentes que precisam de
// IA de verdade pra interpretar dado bruto (ex.: classificar cards do Trello
// segundo um briefing), diferente do lib/commands.ts (que é 100% determinístico).
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const DEFAULT_MODEL = "claude-sonnet-5";

export async function askClaude(params: {
  system: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
}): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY não configurada");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: params.model ?? DEFAULT_MODEL,
      max_tokens: params.maxTokens ?? 3000,
      system: params.system,
      messages: [{ role: "user", content: params.prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Claude API error: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  return data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("\n")
    .trim();
}
