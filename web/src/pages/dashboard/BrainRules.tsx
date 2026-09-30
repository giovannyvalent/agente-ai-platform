import { useState } from "react";
import { DashboardLayout } from "../../components/DashboardLayout";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { useAgentsData } from "../../lib/useAgents";
import { supabase } from "../../lib/supabase";

export function BrainRules() {
  const { agents, brains, clientsByAgent, loading } = useAgentsData();
  const [selected, setSelected] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const activeId = selected ?? agents[0]?.id ?? null;
  const activeAgent = agents.find((a) => a.id === activeId);
  const content = drafts[activeId ?? ""] ?? brains[activeId ?? ""]?.content ?? "";

  async function handleSave() {
    if (!activeId) return;
    setSaving(true);
    setStatus("");
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("brains")
      .update({ content, updated_by: user?.email, updated_at: new Date().toISOString() })
      .eq("agent_id", activeId);
    setSaving(false);
    setStatus(error ? "Erro ao salvar." : "Salvo.");
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <h1 className="text-2xl font-semibold text-ivory tracking-tight">Regras do cérebro</h1>
        <p className="text-steel text-sm mt-1">
          O texto que define como cada agente se comporta e o que ele leva em conta ao responder.
        </p>

        {loading && <p className="text-steel text-sm mt-6">Carregando...</p>}

        {!loading && agents.length > 0 && (
          <>
            <div className="mt-6 flex flex-wrap gap-2">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelected(agent.id)}
                  className={`px-4 py-2 rounded-[8px] text-sm border transition-colors ${
                    activeId === agent.id
                      ? "border-electric-blue text-electric-blue bg-electric-blue/10"
                      : "border-white/10 text-steel hover:text-ivory"
                  }`}
                >
                  {agent.name}
                </button>
              ))}
            </div>

            {activeAgent && (
              <Card className="mt-5 p-6">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-ivory font-medium">{activeAgent.name}</h2>
                  <Badge tone={activeAgent.enabled ? "success" : "neutral"}>
                    {activeAgent.enabled ? "em produção" : "inativo"}
                  </Badge>
                </div>
                <p className="text-steel text-sm mb-5">
                  Clientes: {(clientsByAgent[activeAgent.id] ?? []).join(", ") || "nenhum vinculado"}
                </p>

                <textarea
                  value={content}
                  onChange={(e) => setDrafts((d) => ({ ...d, [activeAgent.id]: e.target.value }))}
                  className="w-full min-h-[360px] bg-venture-black border border-white/10 rounded-[10px] px-4 py-3 text-[0.9rem] text-ivory leading-relaxed outline-none focus:border-electric-blue font-mono"
                  spellCheck={false}
                />

                <div className="mt-4 flex items-center gap-3">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                  {status && <span className="text-sm text-steel">{status}</span>}
                </div>
              </Card>
            )}
          </>
        )}

        {!loading && agents.length === 0 && (
          <Card className="mt-6 p-6 text-steel text-sm">Nenhum agente cadastrado ainda.</Card>
        )}
      </div>
    </DashboardLayout>
  );
}
