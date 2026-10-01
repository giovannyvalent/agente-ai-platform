import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "../../components/DashboardLayout";
import { Button } from "../../components/ui/Button";
import { Switch } from "../../components/ui/Switch";
import { supabase } from "../../lib/supabase";

export function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [content, setContent] = useState("");
  const [original, setOriginal] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      const [{ data: agent }, { data: brain }] = await Promise.all([
        supabase.from("agents").select("name,enabled").eq("id", id).maybeSingle(),
        supabase.from("brains").select("content").eq("agent_id", id).maybeSingle(),
      ]);
      if (cancelled) return;
      setName(agent?.name ?? id ?? "Agente");
      setEnabled(agent?.enabled ?? false);
      setContent(brain?.content ?? "");
      setOriginal(brain?.content ?? "");
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleToggleStatus() {
    if (!id) return;
    const next = !enabled;
    setTogglingStatus(true);
    const { error } = await supabase.from("agents").update({ enabled: next }).eq("id", id);
    setTogglingStatus(false);
    if (!error) setEnabled(next);
  }

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("brains")
      .update({ content, updated_by: user?.email, updated_at: new Date().toISOString() })
      .eq("agent_id", id);
    setSaving(false);
    if (!error) {
      setOriginal(content);
      setEditing(false);
    }
  }

  function handleEditToggle() {
    if (editing) {
      setContent(original);
      setEditing(false);
    } else {
      setEditing(true);
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <button
          onClick={() => navigate("/dashboard/agentes")}
          className="text-steel text-sm hover:text-ivory mb-6"
        >
          ← Voltar para agentes
        </button>

        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <p className="text-electric-blue text-xs font-semibold tracking-[0.15em]">REGRAS DO CÉREBRO</p>
            <h1 className="text-2xl font-semibold text-ivory tracking-tight mt-1">{loading ? "…" : name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleEditToggle} disabled={loading}>
              {editing ? "Cancelar" : "Editar"}
            </Button>
            <Button onClick={handleSave} disabled={!editing || saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-[10px] border border-white/[0.06] bg-graphite/40 w-fit">
          <Switch checked={enabled} onChange={handleToggleStatus} disabled={loading || togglingStatus} />
          <span className="text-sm text-ivory">{enabled ? "Agente em produção" : "Agente pausado"}</span>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          readOnly={!editing}
          spellCheck={false}
          className={`w-full min-h-[480px] bg-venture-black border rounded-[10px] px-4 py-3 text-[0.9rem] text-ivory leading-relaxed outline-none font-mono transition-colors ${
            editing ? "border-electric-blue" : "border-white/10"
          }`}
        />
      </div>
    </DashboardLayout>
  );
}
