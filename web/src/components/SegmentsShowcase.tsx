import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Stethoscope, Scale, Building2, Landmark, ShoppingBag, GraduationCap, ArrowRight } from "lucide-react";

const segments = [
  {
    icon: Stethoscope,
    segment: "Saúde",
    pain: "Agenda lotada, pacientes sem retorno de horário e equipe sobrecarregada no telefone.",
    agent: "Agente de Agendamento & Triagem",
    desc: "Marca, remarca e confirma consultas sozinho, e já triagem o motivo antes de chegar na recepção.",
  },
  {
    icon: Scale,
    segment: "Jurídico",
    pain: "Prazos e processos espalhados entre planilhas, e-mail e WhatsApp — risco de perder prazo.",
    agent: "Agente de Acompanhamento Processual",
    desc: "Monitora andamentos, avisa prazos com antecedência e mantém o cliente informado sem esforço manual.",
  },
  {
    icon: Building2,
    segment: "Imobiliário",
    pain: "Lead esfria em minutos quando ninguém responde rápido o suficiente.",
    agent: "Agente de Qualificação de Leads",
    desc: "Responde na hora, qualifica interesse e orçamento, e já agenda visita com o corretor certo.",
  },
  {
    icon: Landmark,
    segment: "Financeiro",
    pain: "Cobrança, conciliação e relatório consumindo o time que devia estar analisando número.",
    agent: "Agente Financeiro & de Cobrança",
    desc: "Dispara cobrança no momento certo, concilia lançamentos e resume a saúde financeira do dia.",
  },
  {
    icon: ShoppingBag,
    segment: "Varejo & E-commerce",
    pain: "Suporte sobrecarregado e cliente sem saber o status do próprio pedido.",
    agent: "Agente de Atendimento & Pós-venda",
    desc: "Responde status de pedido, troca e devolução direto no WhatsApp, 24 horas por dia.",
  },
  {
    icon: GraduationCap,
    segment: "Educação",
    pain: "Dúvida repetida de matrícula e boleto tomando o tempo da secretaria inteira.",
    agent: "Agente de Admissões & Suporte",
    desc: "Tira dúvida recorrente, acompanha matrícula e escala pro humano só quando precisa de verdade.",
  },
];

// Componente diferente do resto da página de propósito: seletor interativo
// com indicador deslizante (layout shared) + troca de conteúdo animada —
// contraste com os grids/stagger usados nas outras seções.
export function SegmentsShowcase() {
  const [active, setActive] = useState(0);
  const current = segments[active];

  return (
    <section className="relative py-24 overflow-hidden">
      <div
        className="absolute inset-0 opacity-70 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(61,90,254,0.10), transparent 60%)",
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto"
        >
          <p className="text-electric-blue text-xs font-semibold tracking-[0.15em] mb-3">
            SEGMENTOS QUE ATENDEMOS
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-ivory tracking-tight text-balance">
            Um agente pra cada <span className="text-electric-blue">dor específica.</span>
          </h2>
          <p className="mt-4 text-steel">
            Escolha um segmento e veja o tipo de agente que resolve o problema real daquela operação.
          </p>
        </motion.div>

        {/* Seletor de segmentos com indicador deslizante */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-12 flex flex-wrap justify-center gap-2"
        >
          {segments.map((s, i) => (
            <button
              key={s.segment}
              onClick={() => setActive(i)}
              className={`relative px-4 py-2.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                active === i ? "text-venture-black" : "text-steel hover:text-ivory"
              }`}
            >
              {active === i && (
                <motion.span
                  layoutId="segment-pill"
                  className="absolute inset-0 bg-electric-blue rounded-full"
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                />
              )}
              <s.icon size={15} className="relative z-10" strokeWidth={1.75} />
              <span className="relative z-10">{s.segment}</span>
            </button>
          ))}
        </motion.div>

        {/* Painel de conteúdo animado */}
        <div className="mt-10 max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-lg border border-electric-blue/20 bg-graphite/60 backdrop-blur-sm p-8 sm:p-10"
              style={{ boxShadow: "0 0 60px -20px rgba(61,90,254,0.25)" }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 shrink-0 rounded-md bg-electric-blue/10 flex items-center justify-center">
                  <current.icon size={22} className="text-electric-blue" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-steel text-xs tracking-[0.1em]">DOR COMUM NO {current.segment.toUpperCase()}</p>
                  <p className="text-ivory text-lg sm:text-xl font-medium mt-1.5 leading-snug text-balance">
                    "{current.pain}"
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/[0.06] flex items-start gap-3">
                <ArrowRight size={18} className="text-electric-blue shrink-0 mt-0.5" />
                <div>
                  <p className="text-electric-blue font-medium text-sm">{current.agent}</p>
                  <p className="text-steel text-sm mt-1 leading-relaxed">{current.desc}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
