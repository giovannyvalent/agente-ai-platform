import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface AgentRow {
  id: string;
  name: string;
  enabled: boolean;
  management_phones: string[];
}

export interface BrainRow {
  agent_id: string;
  content: string;
  updated_at: string;
  updated_by: string | null;
}

export interface BoardRow {
  agent_id: string;
  trello_board_id: string;
  clients: { label: string } | null;
}

export function useAgentsData() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [brains, setBrains] = useState<Record<string, BrainRow>>({});
  const [clientsByAgent, setClientsByAgent] = useState<Record<string, string[]>>({});
  const [tenantId, setTenantId] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: memberships } = await supabase.from("tenant_users").select("tenant_id").eq("user_id", user.id);
      const tenantIds = (memberships ?? []).map((m) => m.tenant_id);
      if (tenantIds.length > 0) {
        const { data: tenants } = await supabase.from("tenants").select("id,name").in("id", tenantIds);
        if (!cancelled) {
          setTenantId(tenantIds[0] ?? "");
          setTenantName((tenants ?? []).map((t) => t.name).join(", "));
        }
      }

      const { data: agentRows } = await supabase.from("agents").select("*").order("name");
      const { data: boardRows } = await supabase
        .from("boards")
        .select("agent_id,trello_board_id,clients(label)");

      const agentIds = (agentRows ?? []).map((a) => a.id);
      const { data: brainRows } = agentIds.length
        ? await supabase.from("brains").select("agent_id,content,updated_at,updated_by").in("agent_id", agentIds)
        : { data: [] as BrainRow[] };

      if (cancelled) return;

      setAgents(agentRows ?? []);
      setBrains(Object.fromEntries((brainRows ?? []).map((b) => [b.agent_id, b])));

      const byAgent: Record<string, string[]> = {};
      (boardRows ?? []).forEach((b) => {
        const row = b as unknown as BoardRow;
        const list = byAgent[row.agent_id] ?? [];
        if (row.clients) list.push(row.clients.label);
        byAgent[row.agent_id] = list;
      });
      setClientsByAgent(byAgent);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { agents, brains, clientsByAgent, tenantId, tenantName, loading };
}
