import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface AgentRow {
  id: string;
  name: string;
  enabled: boolean;
  management_phones: string[];
  zapi_instance_id: string | null;
}

export interface ZapiInstanceRow {
  id: string;
  label: string;
  instance_id: string;
  token: string;
  client_token: string | null;
  base_url: string | null;
  created_at: string;
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
  const [zapiInstances, setZapiInstances] = useState<ZapiInstanceRow[]>([]);
  const [tenantId, setTenantId] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: memberships } = await supabase.from("tenant_users").select("tenant_id").eq("user_id", user.id);
    const tenantIds = (memberships ?? []).map((m) => m.tenant_id);
    if (tenantIds.length > 0) {
      const { data: tenants } = await supabase.from("tenants").select("id,name").in("id", tenantIds);
      setTenantId(tenantIds[0] ?? "");
      setTenantName((tenants ?? []).map((t) => t.name).join(", "));
    }

    const { data: agentRows } = await supabase.from("agents").select("*").order("name");
    const { data: boardRows } = await supabase.from("boards").select("agent_id,trello_board_id,clients(label)");
    const { data: zapiRows } = await supabase
      .from("zapi_instances")
      .select("id,label,instance_id,token,client_token,base_url,created_at")
      .order("created_at");

    const agentIds = (agentRows ?? []).map((a) => a.id);
    const { data: brainRows } = agentIds.length
      ? await supabase.from("brains").select("agent_id,content,updated_at,updated_by").in("agent_id", agentIds)
      : { data: [] as BrainRow[] };

    setAgents(agentRows ?? []);
    setZapiInstances(zapiRows ?? []);
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
  }, []);

  useEffect(() => {
    let cancelled = false;
    load().catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  return { agents, brains, clientsByAgent, zapiInstances, tenantId, tenantName, loading, refetch: load };
}
