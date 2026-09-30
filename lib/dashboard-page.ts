/**
 * Página única de login + dashboard, servida direto pelo Express (sem build step,
 * sem framework). Usa o cliente JS do Supabase via CDN. Login é usuário/senha —
 * por baixo dos panos vira um e-mail sintético (<usuario>@login.agente-ai-platform.internal)
 * porque o Supabase Auth só fala e-mail nativamente; RLS no banco garante que cada
 * usuário só vê/edita os agentes do(s) tenant(s) dele.
 */
export function renderDashboardPage(supabaseUrl: string, publishableKey: string): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Agente AI Platform</title>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; font-family: -apple-system, system-ui, "Segoe UI", sans-serif;
    background: #0f1115; color: #e6e6e6; min-height: 100vh;
  }
  .wrap { max-width: 720px; margin: 0 auto; padding: 24px 16px 80px; }
  h1 { font-size: 1.3rem; font-weight: 700; margin: 0 0 4px; }
  .sub { color: #9aa0ab; font-size: 0.9rem; margin: 0 0 28px; }
  .card {
    background: #171a21; border: 1px solid #262b35; border-radius: 12px;
    padding: 20px; margin-bottom: 16px;
  }
  label { display: block; font-size: 0.85rem; color: #9aa0ab; margin-bottom: 6px; }
  input, textarea {
    width: 100%; background: #0f1115; border: 1px solid #2c323e; border-radius: 8px;
    color: #e6e6e6; padding: 10px 12px; font-size: 0.95rem; font-family: inherit;
  }
  textarea { min-height: 260px; line-height: 1.5; resize: vertical; }
  input:focus, textarea:focus { outline: none; border-color: #4f7cff; }
  button {
    background: #4f7cff; color: #fff; border: none; border-radius: 8px;
    padding: 10px 18px; font-size: 0.95rem; font-weight: 600; cursor: pointer;
  }
  button:hover { background: #3d68ea; }
  button.ghost { background: transparent; border: 1px solid #2c323e; color: #9aa0ab; }
  button:disabled { opacity: 0.5; cursor: default; }
  .row { display: flex; gap: 10px; align-items: center; margin-top: 12px; }
  .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .badge {
    display: inline-block; font-size: 0.72rem; padding: 2px 8px; border-radius: 999px;
    background: #1f2937; color: #9aa0ab; margin-left: 8px;
  }
  .badge.on { background: #16331f; color: #4ade80; }
  .msg { font-size: 0.85rem; margin-top: 8px; min-height: 1.2em; }
  .msg.ok { color: #4ade80; } .msg.err { color: #f87171; }
  .clients { font-size: 0.85rem; color: #9aa0ab; margin-top: 10px; }
  .clients b { color: #c8ccd4; }
  a.logout { color: #9aa0ab; font-size: 0.85rem; cursor: pointer; text-decoration: underline; }
  .hidden { display: none; }
</style>
</head>
<body>
  <div class="wrap">

    <div id="login-view">
      <h1>Agente AI Platform</h1>
      <p class="sub">Entrar</p>
      <div class="card">
        <form id="login-form">
          <label for="username">Usuário</label>
          <input id="username" autocomplete="username" />
          <div style="height:12px"></div>
          <label for="password">Senha</label>
          <input id="password" type="password" autocomplete="current-password" />
          <div class="row">
            <button id="btn-login" type="submit">Entrar</button>
          </div>
          <div id="login-msg" class="msg"></div>
        </form>
      </div>
    </div>

    <div id="dash-view" class="hidden">
      <div class="top">
        <div>
          <h1 id="tenant-name">—</h1>
          <p class="sub">Agentes e cérebro</p>
        </div>
        <a class="logout" id="btn-logout">sair</a>
      </div>
      <div id="agents-list"></div>
    </div>

  </div>

<script>
const supabase = window.supabase.createClient(${JSON.stringify(supabaseUrl)}, ${JSON.stringify(publishableKey)});
const EMAIL_SUFFIX = "@login.agente-ai-platform.internal";

const loginView = document.getElementById("login-view");
const dashView = document.getElementById("dash-view");
const loginMsg = document.getElementById("login-msg");

function showMsg(el, text, ok) {
  el.textContent = text;
  el.className = "msg " + (ok ? "ok" : "err");
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("btn-login");
  const username = document.getElementById("username").value.trim().toLowerCase();
  const password = document.getElementById("password").value;
  if (!username || !password) return showMsg(loginMsg, "Preenche usuário e senha.", false);

  btn.disabled = true;
  showMsg(loginMsg, "Entrando...", true);
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: username + EMAIL_SUFFIX,
      password,
    });
    if (error) {
      showMsg(loginMsg, "Usuário ou senha inválidos.", false);
      return;
    }
    await loadDashboard();
  } catch (err) {
    showMsg(loginMsg, "Erro inesperado: " + (err && err.message ? err.message : err), false);
  } finally {
    btn.disabled = false;
  }
});

document.getElementById("btn-logout").addEventListener("click", async () => {
  await supabase.auth.signOut();
  dashView.classList.add("hidden");
  loginView.classList.remove("hidden");
});

async function loadDashboard() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: memberships } = await supabase.from("tenant_users").select("tenant_id").eq("user_id", user.id);
  const tenantIds = (memberships || []).map((m) => m.tenant_id);
  if (tenantIds.length === 0) {
    document.getElementById("tenant-name").textContent = "Sem acesso a nenhum tenant";
  } else {
    const { data: tenants } = await supabase.from("tenants").select("id,name").in("id", tenantIds);
    document.getElementById("tenant-name").textContent = (tenants || []).map((t) => t.name).join(", ") || "—";
  }

  const { data: agents } = await supabase.from("agents").select("*").order("name");
  const { data: boards } = await supabase.from("boards").select("agent_id,trello_board_id,clients(label)");
  const agentIds = (agents || []).map((a) => a.id);
  const { data: brains } = agentIds.length
    ? await supabase.from("brains").select("agent_id,content,updated_at,updated_by").in("agent_id", agentIds)
    : { data: [] };

  const brainByAgent = new Map((brains || []).map((b) => [b.agent_id, b]));
  const clientsByAgent = new Map();
  (boards || []).forEach((b) => {
    const list = clientsByAgent.get(b.agent_id) || [];
    if (b.clients) list.push(b.clients.label);
    clientsByAgent.set(b.agent_id, list);
  });

  const list = document.getElementById("agents-list");
  list.innerHTML = "";

  if (!agents || agents.length === 0) {
    list.innerHTML = '<div class="card">Nenhum agente cadastrado ainda pra esse acesso.</div>';
  }

  (agents || []).forEach((agent) => {
    const brain = brainByAgent.get(agent.id);
    const clients = clientsByAgent.get(agent.id) || [];

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;">' +
        '<strong>' + agent.name + '</strong>' +
        '<span class="badge ' + (agent.enabled ? "on" : "") + '">' + (agent.enabled ? "ativo" : "inativo") + '</span>' +
      '</div>' +
      '<div class="clients">' +
        (clients.length ? '<b>Clientes:</b> ' + clients.join(", ") : "Nenhum cliente vinculado") +
      '</div>' +
      '<div style="height:14px"></div>' +
      '<label>Cérebro (regras que o agente segue)</label>' +
      '<textarea data-agent="' + agent.id + '">' + (brain ? escapeHtml(brain.content) : "") + '</textarea>' +
      '<div class="row">' +
        '<button data-save="' + agent.id + '">Salvar</button>' +
        '<span class="msg" data-status="' + agent.id + '"></span>' +
      '</div>';
    list.appendChild(card);
  });

  list.querySelectorAll("[data-save]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const agentId = btn.getAttribute("data-save");
      const textarea = list.querySelector('textarea[data-agent="' + agentId + '"]');
      const statusEl = list.querySelector('[data-status="' + agentId + '"]');
      btn.disabled = true;
      const { error } = await supabase.from("brains").update({
        content: textarea.value,
        updated_by: user.email,
        updated_at: new Date().toISOString(),
      }).eq("agent_id", agentId);
      btn.disabled = false;
      if (error) showMsg(statusEl, "Erro ao salvar.", false);
      else showMsg(statusEl, "Salvo.", true);
    });
  });

  loginView.classList.add("hidden");
  dashView.classList.remove("hidden");
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) await loadDashboard();
})();
</script>
</body>
</html>`;
}
