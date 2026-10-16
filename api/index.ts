import express, { Request, Response } from "express";
import { getAgent, listEnabledAgents } from "../agents/index.js";
import { handleIncomingWhatsApp, handleIncomingTrelloEvent, runMonitorCycle } from "../lib/runtime.js";
import { isValidIncoming } from "../lib/zapi.js";
import type { ZApiPayload } from "../lib/zapi.js";
import { getDispatchByToken, touchDispatch } from "../lib/dispatches.js";
import { runDispatch } from "../lib/dispatch-runner.js";
import { listMyBoards, getLists, getBoardMembers } from "../lib/trello.js";
import {
  generateGerenteReport,
  generateRondaReport,
  generatePlanejamentoReport,
  sendAmOpsMessage,
  type GerenteRun,
} from "../agents/am-ops/report.js";
import { AM_OPS_ALLOWED_SENDERS } from "../agents/am-ops/config.js";

const app = express();
app.use(express.json());

// Landing/login/dashboard agora são o frontend estático em web/ (build em dist/),
// servido diretamente pela Vercel — ver vercel.json. Esta função só cuida de /api/*.

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
  const agent = await getAgent(req.params.agentId as string);
  if (!agent) {
    res.status(404).json({ ok: false, error: "agente não encontrado" });
    return;
  }

  const payload = req.body as ZApiPayload;
  if (payload.messageId && isDuplicate(`${agent.id}:${payload.messageId}`)) {
    res.status(200).json({ ok: true });
    return;
  }

  // Aguarda processar antes de responder — em serverless não há garantia de que o
  // código após res.json() continue rodando depois da resposta ser enviada.
  try {
    await handleIncomingWhatsApp(agent, payload);
  } catch (err) {
    console.error(`[${agent.id}] erro no webhook WhatsApp:`, (err as Error).message);
  }

  res.status(200).json({ ok: true });
});

// ─── TRELLO — um webhook por agente ───────────────────────────────
// Ao criar o webhook via API do Trello, use como callbackURL:
// https://SEU-DEPLOY.vercel.app/api/webhook/trello/<agentId>
// (o Trello exige que HEAD e GET respondam 200 para validar o endpoint)
app.head("/api/webhook/trello/:agentId", (_req, res) => res.status(200).end());
app.get("/api/webhook/trello/:agentId", (_req, res) => res.status(200).end());
app.post("/api/webhook/trello/:agentId", async (req: Request, res: Response) => {
  const agent = await getAgent(req.params.agentId as string);
  if (agent) {
    try {
      await handleIncomingTrelloEvent(agent, req.body);
    } catch (err) {
      console.error(`[${agent.id}] erro no webhook Trello:`, (err as Error).message);
    }
  }
  res.status(200).json({ ok: true }); // Trello exige resposta rápida (<10s) — nossas chamadas são leves
});

// ─── CRON — roda o ciclo de monitoramento de todos os agentes ativos ──
app.get("/api/cron/monitor", async (req: Request, res: Response) => {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ ok: false });
    return;
  }

  const agents = await listEnabledAgents();
  const results = await Promise.allSettled(agents.map((agent) => runMonitorCycle(agent)));
  results.forEach((r, i) => {
    if (r.status === "rejected") console.error(`[Cron] falha em ${agents[i].id}:`, (r.reason as Error).message);
  });

  res.status(200).json({ ok: true, agents: agents.length, failed: results.filter((r) => r.status === "rejected").length });
});

// ─── DISPARO — link gerado no painel, pra colar num cron externo ─────
// O token na URL é o próprio segredo (igual um webhook comum) — sem header
// extra, pra funcionar direto em qualquer serviço de cron externo.
app.all("/api/dispatch/:token", async (req: Request, res: Response) => {
  try {
    const dispatch = await getDispatchByToken(req.params.token as string);
    if (!dispatch || !dispatch.enabled) {
      res.status(404).json({ ok: false });
      return;
    }

    const agent = await getAgent(dispatch.agent_id);
    if (!agent) {
      res.status(404).json({ ok: false, error: "agente não encontrado" });
      return;
    }

    const result = await runDispatch(agent, dispatch.rules);
    await touchDispatch(dispatch.id).catch(() => {});
    res.status(200).json({ ok: true, result });
  } catch (err) {
    console.error("[dispatch] erro:", (err as Error).message);
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ─── DEBUG TEMPORÁRIO — descobrir boards/listas/membros reais do Trello ──
// Usa a credencial global (TRELLO_API_KEY/TRELLO_API_TOKEN, env var, sem
// depender do Supabase) só pra montar a config dos agentes da AM. Remover
// depois que os boards/listas/membros estiverem confirmados e configurados.
function debugTrelloCreds() {
  return { key: process.env.TRELLO_API_KEY, token: process.env.TRELLO_API_TOKEN };
}

function checkDebugSecret(req: Request): boolean {
  return req.headers.authorization === `Bearer ${process.env.DEBUG_TRELLO_SECRET}`;
}

app.get("/api/debug/trello-boards", async (req: Request, res: Response) => {
  if (!checkDebugSecret(req)) {
    res.status(401).json({ ok: false });
    return;
  }
  try {
    const boards = await listMyBoards(debugTrelloCreds());
    res.status(200).json({ ok: true, boards: boards.filter((b) => !b.closed) });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

app.get("/api/debug/trello-boards/:boardId", async (req: Request, res: Response) => {
  if (!checkDebugSecret(req)) {
    res.status(401).json({ ok: false });
    return;
  }
  try {
    const creds = debugTrelloCreds();
    const [lists, members] = await Promise.all([
      getLists(creds, req.params.boardId as string),
      getBoardMembers(creds, req.params.boardId as string),
    ]);
    res.status(200).json({ ok: true, lists, members });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ─── DEBUG TEMPORÁRIO — checar status da instância Z-API da AM ──────
// O client-token é de conta (não por instância) no Z-API — reaproveita o que
// já está configurado pro agente gestao-marketing, já que é a mesma conta.
app.get("/api/debug/zapi-status", async (req: Request, res: Response) => {
  if (!checkDebugSecret(req)) {
    res.status(401).json({ ok: false });
    return;
  }
  const instanceId = process.env.AM_OPS_ZAPI_INSTANCE_ID;
  const token = process.env.AM_OPS_ZAPI_TOKEN;
  const clientToken = process.env.GESTAO_MARKETING_ZAPI_CLIENT_TOKEN;
  try {
    const r = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/status`, {
      headers: { "Client-Token": clientToken ?? "" },
    });
    const body = await r.text();
    res.status(200).json({ ok: true, httpStatus: r.status, body });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ─── AM OPS — agentes da Alana (Gerente/Ronda/Planejamento) ─────────
// Modo dry-run por padrão: só gera e devolve o texto (não envia WhatsApp),
// pra revisar qualidade antes de ativar envio de verdade pra cliente real.
// ?send=true efetivamente manda. Ainda não tem cron automático ligado —
// falta confirmar mapeamento de colaboradoras, definição de "pronto" e os
// números de telefone (ver agents/am-ops/config.ts).
const GERENTE_RUNS: GerenteRun[] = ["abertura", "fechamento", "relatorio-semana", "balanco-semana"];

app.get("/api/debug/am-ops/gerente/:run", async (req: Request, res: Response) => {
  if (!checkDebugSecret(req)) {
    res.status(401).json({ ok: false });
    return;
  }
  const run = req.params.run as GerenteRun;
  if (!GERENTE_RUNS.includes(run)) {
    res.status(400).json({ ok: false, error: `run inválido, use um de: ${GERENTE_RUNS.join(", ")}` });
    return;
  }
  try {
    const report = await generateGerenteReport(run);
    if (req.query.send === "true") await sendAmOpsMessage(report);
    res.status(200).json({ ok: true, sent: req.query.send === "true", report });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

app.get("/api/debug/am-ops/ronda", async (req: Request, res: Response) => {
  if (!checkDebugSecret(req)) {
    res.status(401).json({ ok: false });
    return;
  }
  try {
    const report = await generateRondaReport();
    if (req.query.send === "true") await sendAmOpsMessage(report);
    res.status(200).json({ ok: true, sent: req.query.send === "true", report });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

app.get("/api/debug/am-ops/planejamento", async (req: Request, res: Response) => {
  if (!checkDebugSecret(req)) {
    res.status(401).json({ ok: false });
    return;
  }
  try {
    const report = await generatePlanejamentoReport();
    if (req.query.send === "true") await sendAmOpsMessage(report);
    res.status(200).json({ ok: true, sent: req.query.send === "true", report });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// Webhook de entrada da instância Z-API da AM — só existe pra garantir o
// filtro: esse número só responde/encaminha pra Alana e Giovanny
// (AM_OPS_ALLOWED_SENDERS), qualquer outro remetente é ignorado em silêncio.
// Configurar na Z-API: https://SEU-DEPLOY.vercel.app/api/webhook/whatsapp/am-ops
app.post("/api/webhook/whatsapp/am-ops", async (req: Request, res: Response) => {
  const payload = req.body as ZApiPayload;
  if (!isValidIncoming(payload)) {
    res.status(200).json({ ok: true });
    return;
  }

  const sender = (payload.participantPhone ?? payload.phone).replace(/\D/g, "");
  if (!AM_OPS_ALLOWED_SENDERS.some((p) => p.replace(/\D/g, "") === sender)) {
    res.status(200).json({ ok: true }); // remetente fora da lista — ignora em silêncio
    return;
  }

  // Por ora os agentes da AM são só de entrega (push), sem comando
  // conversacional — mensagem de remetente permitido só é confirmada, sem resposta.
  res.status(200).json({ ok: true });
});

// ─── HEALTH ────────────────────────────────────────────────────────
app.get("/api/health", async (_req: Request, res: Response) => {
  const agents = await listEnabledAgents();
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    agents: agents.map((a) => a.id),
  });
});

export default app;
