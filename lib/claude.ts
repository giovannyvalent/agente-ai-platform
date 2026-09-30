export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

export async function askClaude(
  system: string,
  history: ChatMessage[],
  userMessage: string,
  model = DEFAULT_MODEL
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system,
      messages: [...history, { role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) throw new Error(`Claude error: ${await res.text()}`);
  const data = await res.json();
  return data.content[0].text as string;
}
