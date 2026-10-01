import { motion } from "framer-motion";
import {
  MessageSquare,
  Workflow,
  ShieldCheck,
  BarChart3,
  ChevronRight,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

interface Step {
  icon: LucideIcon;
  label: string;
  sub: string;
}

const steps: Step[] = [
  { icon: MessageSquare, label: "Atendimento", sub: "entende a mensagem" },
  { icon: Workflow, label: "Orquestração", sub: "decide o fluxo certo" },
  { icon: ShieldCheck, label: "Regras & limites", sub: "aplica o que pode e o que não pode" },
  { icon: BarChart3, label: "Métricas", sub: "mede e realimenta o ciclo" },
];

function StepNode({ step, i }: { step: Step; i: number }) {
  return (
    <div className="flex flex-col items-center text-center gap-2 px-1">
      <div className="relative">
        <span className="absolute -top-1 -left-1 z-10 w-5 h-5 rounded-full bg-electric-blue text-venture-black text-[0.6rem] font-bold flex items-center justify-center">
          0{i + 1}
        </span>
        <motion.div
          className="w-14 h-14 rounded-2xl bg-electric-blue/10 border border-electric-blue/30 flex items-center justify-center"
          animate={{
            boxShadow: [
              "0 0 0px 0px rgba(61,90,254,0)",
              "0 0 20px 4px rgba(61,90,254,0.45)",
              "0 0 0px 0px rgba(61,90,254,0)",
            ],
          }}
          transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
        >
          <step.icon size={22} className="text-electric-blue" strokeWidth={1.75} />
        </motion.div>
      </div>
      <p className="text-ivory text-sm font-medium leading-tight">{step.label}</p>
      <p className="text-steel text-xs leading-snug max-w-[120px]">{step.sub}</p>
    </div>
  );
}

function ConnectorRow({ i }: { i: number }) {
  return (
    <div className="relative flex items-center justify-center h-14 px-1 min-w-[32px] sm:min-w-[48px]">
      <div className="absolute inset-x-0 top-7 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <motion.span
        className="absolute top-7 -translate-y-1/2 h-1.5 w-10 rounded-full"
        style={{ background: "linear-gradient(90deg, transparent, #3D5AFE, transparent)", filter: "blur(0.5px)" }}
        animate={{ left: ["-30%", "110%"] }}
        transition={{ duration: 1.3, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
      />
      <ChevronRight size={14} className="relative z-10 top-7 text-electric-blue/80 bg-black rounded-full" />
    </div>
  );
}

function ConnectorCol({ i }: { i: number }) {
  return (
    <div className="relative flex items-center justify-center w-14 h-8">
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
      <motion.span
        className="absolute left-1/2 -translate-x-1/2 w-1.5 h-10 rounded-full"
        style={{ background: "linear-gradient(180deg, transparent, #3D5AFE, transparent)", filter: "blur(0.5px)" }}
        animate={{ top: ["-30%", "110%"] }}
        transition={{ duration: 1.3, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
      />
      <ChevronDown size={14} className="relative z-10 text-electric-blue/80 bg-black rounded-full" />
    </div>
  );
}

// Fluxo direcional em 4 etapas (sentido único, esquerda->direita / cima->baixo)
// com seta explícita e partícula viajando sempre na mesma direção a cada
// conector, pra deixar claro que é uma sequência e não um vai-e-volta.
// Colunas de largura igual (grid 1fr/auto) garantem distribuição simétrica.
export function AgentWorkflowViz() {
  return (
    <div className="w-full">
      <div className="hidden sm:grid items-start" style={{ gridTemplateColumns: "1fr auto 1fr auto 1fr auto 1fr" }}>
        {steps.flatMap((step, i) =>
          i < steps.length - 1
            ? [<StepNode key={step.label} step={step} i={i} />, <ConnectorRow key={`c-${i}`} i={i} />]
            : [<StepNode key={step.label} step={step} i={i} />]
        )}
      </div>

      <div className="flex sm:hidden flex-col items-center">
        {steps.flatMap((step, i) =>
          i < steps.length - 1
            ? [<StepNode key={step.label} step={step} i={i} />, <ConnectorCol key={`c-${i}`} i={i} />]
            : [<StepNode key={step.label} step={step} i={i} />]
        )}
      </div>
    </div>
  );
}
