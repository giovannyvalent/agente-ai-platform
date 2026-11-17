// Config do agente de monitoramento da Anser — ver agents/anser-ops/briefing.md
// pra regra completa. Roster e telefones de alerta portados do cérebro antigo
// (supabase/migrations/20260930000006_anser_brain_config.sql), que ainda serve
// como fonte factual mesmo com o comportamento substituído pelo briefing novo.

export const ANSER_FELIPE_PHONE = "5591993866999";
export const ANSER_REBECA_PHONE = "5591984186284"; // Rebeka Vaz, confirmada em 2026-11-14
export const ANSER_GIOVANNY_PHONE = "559181628017";

// Fixado em Felipe + Giovanny por pedido explícito do usuário em 2026-11-17
// (fase de testes do agente) -- Rebeca fica de fora por enquanto.
export const ANSER_ALERT_RECIPIENTS = [ANSER_FELIPE_PHONE, ANSER_GIOVANNY_PHONE];

export interface AnserTeamMember {
  name: string;
  phone: string;
}

export const ANSER_TEAM: AnserTeamMember[] = [
  { name: "Felipe Cardoso", phone: "5591993866999" },
  { name: "Giovanny Valente", phone: "559181628017" },
  { name: "Joao Tenorio", phone: "5591981798280" },
  { name: "Ana Carolina", phone: "5591982695419" },
  { name: "Rebeka Vaz", phone: "5591984186284" },
  { name: "Ana Tereza", phone: "5591991652819" },
  { name: "Gabriel Cunha", phone: "5591987262775" },
  { name: "Laysa Tenorio", phone: "5591984926188" },
  { name: "Rayane Vulcao", phone: "5591998334669" },
  { name: "Alef Farias", phone: "5591981673976" },
  { name: "Guidion Dantas", phone: "5591989069411" },
  { name: "Jonatas Brandao", phone: "5591988643332" },
  { name: "Ana Larissa", phone: "5591980631975" },
  { name: "Amanda Carneiro", phone: "5591988886003" },
  { name: "Gabriel Bastos", phone: "5591981222999" },
  { name: "Armando Lobato", phone: "5591984944115" },
  { name: "Atendimento Anser", phone: "5591996266226" },
];

export function findAnserTeamMember(phone: string): AnserTeamMember | undefined {
  const normalized = phone.replace(/\D/g, "");
  return ANSER_TEAM.find((m) => m.phone.replace(/\D/g, "") === normalized);
}

export function anserZapiCreds() {
  return {
    instanceId: process.env.ANSER_ZAPI_INSTANCE_ID,
    token: process.env.ANSER_ZAPI_TOKEN,
    clientToken: process.env.ANSER_ZAPI_CLIENT_TOKEN,
  };
}

// SLA de primeira resposta (briefing seção 3.2/3.3) — genérico, substitui a
// divisão BPO/Consultoria do cérebro antigo.
export const ANSER_SLA_ALERT_30_MIN = 30;
export const ANSER_SLA_ALERT_60_MIN = 60;
