import { MultiLineChart } from "./ui/MultiLineChart";

const agents = [
  { code: "A1", name: "Agente Comercial", desc: "Qualificação e conversão", score: "98,4%", active: true },
  { code: "A2", name: "Agente de Agenda", desc: "Agendamentos e disponibilidade", score: "96,1%" },
  { code: "A3", name: "Agente de Suporte", desc: "Triagem e resolução", score: "94,8%" },
];

// Mockup de janela de app mostrando agentes em produção — substitui os clichês
// de robô/cérebro/circuito pedidos pra evitar no briefing.
export function HeroStage() {
  return (
    <div className="relative">
      <div
        className="absolute -inset-16 rounded-full opacity-60"
        style={{ background: "radial-gradient(circle, rgba(61,90,254,0.18), transparent 65%)" }}
        aria-hidden="true"
      />

      <div className="relative rounded-lg border border-white/10 bg-graphite/80 backdrop-blur-sm shadow-card overflow-hidden">
        <div className="flex items-center gap-3 px-4 h-10 border-b border-white/[0.06] bg-black/20">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
          </div>
          <span className="text-steel text-xs flex-1 text-center">venture / operations</span>
          <span className="flex items-center gap-1.5 text-[10px] text-[#4ade80] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse-glow" /> LIVE
          </span>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-electric-blue text-[0.65rem] tracking-[0.15em] font-semibold">OPERAÇÃO DE IA</p>
              <h3 className="text-ivory font-medium mt-0.5">Agentes em produção</h3>
            </div>
            <span className="text-xs text-ivory bg-white/[0.06] px-2.5 py-1 rounded-full">3 online</span>
          </div>

          <div className="flex flex-col gap-2">
            {agents.map((a) => (
              <div
                key={a.code}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] border ${
                  a.active ? "border-electric-blue/30 bg-electric-blue/[0.06]" : "border-white/[0.06]"
                }`}
              >
                <div className="w-8 h-8 shrink-0 rounded-md bg-white/[0.06] text-ivory text-xs font-semibold flex items-center justify-center">
                  {a.code}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-ivory text-sm truncate">{a.name}</p>
                  <p className="text-steel text-xs truncate">{a.desc}</p>
                </div>
                <b className="text-ivory text-sm shrink-0">{a.score}</b>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-steel text-xs">Atividade em tempo real</span>
              <b className="text-[#4ade80] text-xs">+27,8%</b>
            </div>
            <MultiLineChart
              height={90}
              series={[{ label: "atividade", color: "#3D5AFE", data: [40, 44, 36, 48, 30, 46, 34, 52, 28, 54, 20] }]}
            />
          </div>
        </div>
      </div>

      <div className="hidden sm:block absolute -left-8 top-10 bg-graphite border border-white/10 rounded-[10px] px-4 py-2.5 shadow-card">
        <span className="text-steel text-[0.6rem] tracking-widest">AGENTE</span>
        <p className="text-ivory text-sm font-medium">Execução autônoma</p>
      </div>
      <div className="hidden sm:block absolute -right-6 bottom-12 bg-graphite border border-white/10 rounded-[10px] px-4 py-2.5 shadow-card">
        <span className="text-steel text-[0.6rem] tracking-widest">INTEGRAÇÃO</span>
        <p className="text-ivory text-sm font-medium">CRM conectado</p>
      </div>
    </div>
  );
}
