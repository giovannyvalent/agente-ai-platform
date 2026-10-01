import { motion } from "framer-motion";
import { MessageSquare, Workflow, ShieldCheck, BarChart3, type LucideIcon } from "lucide-react";

interface Node {
  icon: LucideIcon;
  label: string;
  sub: string;
}

const nodes: Node[] = [
  { icon: MessageSquare, label: "Atendimento", sub: "entende a mensagem" },
  { icon: Workflow, label: "Orquestração", sub: "decide o fluxo certo" },
  { icon: ShieldCheck, label: "Regras & limites", sub: "aplica o que pode/não pode" },
  { icon: BarChart3, label: "Métricas", sub: "mede o resultado" },
];

// Visualização de um "time de agentes" trabalhando em pipeline — substitui o
// mock de terminal estático por algo que de fato parece fluxo em execução
// (pulso por nó + partícula viajando pelos conectores, em loop e com stagger).
export function AgentWorkflowViz() {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center min-w-[560px] sm:min-w-0 px-2 py-6">
        {nodes.map((node, i) => (
          <div key={node.label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center shrink-0 w-[120px]">
              <motion.div
                className="relative w-14 h-14 rounded-2xl bg-electric-blue/10 border border-electric-blue/30 flex items-center justify-center"
                animate={{
                  boxShadow: [
                    "0 0 0px 0px rgba(61,90,254,0)",
                    "0 0 0px 0px rgba(61,90,254,0)",
                    "0 0 22px 4px rgba(61,90,254,0.45)",
                    "0 0 0px 0px rgba(61,90,254,0)",
                  ],
                }}
                transition={{ duration: 3.2, repeat: Infinity, delay: i * 0.8, ease: "easeInOut" }}
              >
                <node.icon size={22} className="text-electric-blue" strokeWidth={1.75} />
              </motion.div>
              <p className="text-ivory text-xs font-medium mt-3 text-center">{node.label}</p>
              <p className="text-steel text-[0.7rem] mt-0.5 text-center leading-snug">{node.sub}</p>
            </div>

            {i < nodes.length - 1 && (
              <div className="relative flex-1 h-px bg-white/[0.08] mx-1 overflow-visible">
                <motion.span
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-electric-blue"
                  style={{ boxShadow: "0 0 8px 2px rgba(61,90,254,0.7)" }}
                  animate={{ left: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.8, ease: "easeInOut" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
