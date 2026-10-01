import { motion } from "framer-motion";
import { MessageSquare, Workflow, ShieldCheck, BarChart3, Bot, type LucideIcon } from "lucide-react";

interface Node {
  icon: LucideIcon;
  label: string;
  sub: string;
  col: 1 | 3;
  row: 1 | 3;
}

const nodes: Node[] = [
  { icon: MessageSquare, label: "Atendimento", sub: "entende a mensagem", col: 1, row: 1 },
  { icon: Workflow, label: "Orquestração", sub: "decide o fluxo certo", col: 3, row: 1 },
  { icon: ShieldCheck, label: "Regras & limites", sub: "aplica o que pode/não pode", col: 1, row: 3 },
  { icon: BarChart3, label: "Métricas", sub: "mede e realimenta o ciclo", col: 3, row: 3 },
];

// Coordenadas (0-100) das 4 pontas e do núcleo, usadas só pelas linhas/partículas
// do SVG — tem que bater com as células do grid 3x3 abaixo (colunas/linhas em
// terços: 16.67%, 50%, 83.33%).
const coord = (col: 1 | 2 | 3, row: 1 | 2 | 3) => ({
  x: col === 1 ? 16.67 : col === 2 ? 50 : 83.33,
  y: row === 1 ? 16.67 : row === 2 ? 50 : 83.33,
});
const HUB = coord(2, 2);

// Visualização do "ciclo do agente" — núcleo central (o agente) com 4 etapas
// nas pontas de um grid 3x3, conectadas por partículas que viajam do núcleo
// até cada etapa, em loop contínuo. Distribuição simétrica por construção
// (resolve o desbalanceamento do layout linear anterior) + anel de energia
// girando ao redor do núcleo pra dar o efeito de "algo rodando ao vivo".
export function AgentWorkflowViz() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[360px] py-4">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden="true">
        {nodes.map((n) => {
          const p = coord(n.col, n.row);
          return (
            <line
              key={n.label}
              x1={HUB.x}
              y1={HUB.y}
              x2={p.x}
              y2={p.y}
              stroke="#ffffff"
              strokeOpacity={0.08}
              strokeWidth={0.6}
            />
          );
        })}
        {nodes.map((n, i) => {
          const p = coord(n.col, n.row);
          return (
            <motion.circle
              key={n.label}
              r={1.6}
              fill="#3D5AFE"
              initial={false}
              animate={{ cx: [HUB.x, p.x], cy: [HUB.y, p.y], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
              style={{ filter: "drop-shadow(0 0 3px #3D5AFE)" }}
            />
          );
        })}
      </svg>

      {/* Anel de energia girando ao redor do núcleo */}
      <motion.div
        className="absolute left-1/2 top-1/2 w-24 h-24 sm:w-28 sm:h-28 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          background: "conic-gradient(from 0deg, transparent 0%, rgba(61,90,254,0.7) 12%, transparent 28%)",
          WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
          mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative grid grid-cols-3 grid-rows-3 w-full h-full">
        {nodes.map((n, i) => (
          <div
            key={n.label}
            className={`flex flex-col items-center justify-center text-center gap-1 ${
              n.col === 1 ? "col-start-1" : "col-start-3"
            } ${n.row === 1 ? "row-start-1" : "row-start-3"}`}
          >
            <motion.div
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-electric-blue/10 border border-electric-blue/30 flex items-center justify-center"
              animate={{
                boxShadow: [
                  "0 0 0px 0px rgba(61,90,254,0)",
                  "0 0 18px 3px rgba(61,90,254,0.4)",
                  "0 0 0px 0px rgba(61,90,254,0)",
                ],
              }}
              transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
            >
              <n.icon size={19} className="text-electric-blue" strokeWidth={1.75} />
            </motion.div>
            <p className="text-ivory text-xs font-medium leading-tight w-24">{n.label}</p>
            <p className="text-steel text-[0.65rem] leading-snug w-24">{n.sub}</p>
          </div>
        ))}

        <div className="col-start-2 row-start-2 flex items-center justify-center">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-venture-black border border-electric-blue/40 flex items-center justify-center">
            <Bot size={24} className="text-electric-blue" strokeWidth={1.75} />
          </div>
        </div>
      </div>
    </div>
  );
}
