import express, { Request, Response } from "express";
import { getAgent, listEnabledAgents } from "../agents/index.js";
import { handleIncomingWhatsApp, handleIncomingTrelloEvent, runMonitorCycle } from "../lib/runtime.js";
import type { ZApiPayload } from "../lib/zapi.js";

const app = express();
app.use(express.json());

// ─── DEDUPLICAÇÃO DE MENSAGENS (evita reprocessar retries da Z-API) ──
const processedMsgIds = new Map<string, number>(); // `${agentId}:${messageId}` → timestamp
const DEDUP_TTL_MS = 60_000;

function isDuplicate(key: string): boolean {
  const now = Date.now();
  for (const [id, ts] of processedMsgIds) {
    if (now - ts > DEDUP_TTL_MS) processedMsgIds.delete(id);
  }
  if (processedMsgIds.has(key)) return true;
  processedMsgIds.set(key, now);
  return false;
}

// ─── WHATSAPP (Z-API) — um webhook por agente ─────────────────────
// Na Z-API de cada instância, configure a URL de webhook como:
// https://SEU-DEPLOY.vercel.app/api/webhook/whatsapp/<agentId>
app.post("/api/webhook/whatsapp/:agentId", async (req: Request, res: Response) => {
  const agent = getAgent(req.params.agentId as string);
  if (!agent) {
    res.status(404).json({ ok: false, error: "agente não encontrado" });
    return;
  }

  const payload = req.body as ZApiPayload;
  if (payload.messageId && isDuplicate(`${agent.id}:${payload.messageId}`)) {
    res.status(200).json({ ok: true });
    return;
  }

  res.status(200).json({ ok: true }); // responde rápido; processamento segue em background

  try {
    await handleIncomingWhatsApp(agent, payload);
  } catch (err) {
    console.error(`[${agent.id}] erro no webhook WhatsApp:`, (err as Error).message);
  }
});

// ─── TRELLO — um webhook por agente ───────────────────────────────
// Ao criar o webhook via API do Trello, use como callbackURL:
// https://SEU-DEPLOY.vercel.app/api/webhook/trello/<agentId>
// (o Trello exige que HEAD e GET respondam 200 para validar o endpoint)
app.head("/api/webhook/trello/:agentId", (_req, res) => res.status(200).end());
app.get("/api/webhook/trello/:agentId", (_req, res) => res.status(200).end());
app.post("/api/webhook/trello/:agentId", async (req: Request, res: Response) => {
  const agent = getAgent(req.params.agentId as string);
  res.status(200).json({ ok: true }); // Trello exige resposta rápida (<10s)
  if (!agent) return;

  try {
    await handleIncomingTrelloEvent(agent, req.body);
  } catch (err) {
    console.error(`[${agent.id}] erro no webhook Trello:`, (err as Error).message);
  }
});

// ─── CRON — roda o ciclo de monitoramento de todos os agentes ativos ──
app.get("/api/cron/monitor", async (req: Request, res: Response) => {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ ok: false });
    return;
  }

  const agents = listEnabledAgents();
  const results = await Promise.allSettled(agents.map((agent) => runMonitorCycle(agent)));
  results.forEach((r, i) => {
    if (r.status === "rejected") console.error(`[Cron] falha em ${agents[i].id}:`, (r.reason as Error).message);
  });

  res.status(200).json({ ok: true, agents: agents.length, failed: results.filter((r) => r.status === "rejected").length });
});

// ─── HEALTH ────────────────────────────────────────────────────────
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    agents: listEnabledAgents().map((a) => a.id),
  });
});

export default app;
