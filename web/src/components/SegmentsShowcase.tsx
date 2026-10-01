import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TiltCard } from "./TiltCard";
import {
  Stethoscope,
  Scale,
  Building2,
  Landmark,
  ShoppingBag,
  GraduationCap,
  Truck,
  BedDouble,
  ShieldCheck,
  Calculator,
  Dumbbell,
  Sparkles,
  Car,
  HardHat,
  Users,
  ArrowRight,
} from "lucide-react";

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
  {
    icon: Truck,
    segment: "Logística & Transporte",
    pain: "Cliente ligando pra saber onde tá a carga, e o time sem tempo de rastrear cada entrega.",
    agent: "Agente de Rastreamento & Status",
    desc: "Informa posição e previsão de entrega na hora, e avisa proativamente qualquer atraso.",
  },
  {
    icon: BedDouble,
    segment: "Hotelaria & Turismo",
    pain: "Reserva indo e voltando por vários canais, e recepção sem tempo pra responder todo mundo rápido.",
    agent: "Agente de Reservas & Concierge",
    desc: "Confirma disponibilidade, fecha reserva e tira dúvida de hóspede 24h, sem fila de espera.",
  },
  {
    icon: ShieldCheck,
    segment: "Seguros",
    pain: "Sinistro e renovação de apólice gerando volume de mensagem que trava o corretor.",
    agent: "Agente de Sinistro & Renovação",
    desc: "Abre chamado, acompanha status do sinistro e avisa renovação antes do vencimento.",
  },
  {
    icon: Calculator,
    segment: "Contabilidade",
    pain: "Cliente mandando documento e dúvida de guia/imposto o tempo todo pelo WhatsApp do escritório.",
    agent: "Agente de Documentos & Obrigações",
    desc: "Coleta documento, lembra prazo de guia e obrigação, e organiza tudo antes de chegar no contador.",
  },
  {
    icon: Dumbbell,
    segment: "Academias & Fitness",
    pain: "Aluno sumindo sem aviso e recepção sem tempo de ligar pra reativar matrícula.",
    agent: "Agente de Retenção & Matrícula",
    desc: "Identifica aluno inativo, reengaja por WhatsApp e já oferece renovação ou novo plano.",
  },
  {
    icon: Sparkles,
    segment: "Beleza & Estética",
    pain: "Agenda de salão/clínica lotada de mensagem de horário e cliente que esquece o compromisso.",
    agent: "Agente de Agendamento & Lembrete",
    desc: "Marca horário, confirma véspera e reagenda sozinho quando o cliente não pode comparecer.",
  },
  {
    icon: Car,
    segment: "Serviços Automotivos",
    pain: "Oficina lotada de pergunta sobre orçamento e status do carro, atrasando o atendimento no balcão.",
    agent: "Agente de Orçamento & Status de Serviço",
    desc: "Responde orçamento padrão, atualiza status do veículo e avisa quando ficar pronto.",
  },
  {
    icon: HardHat,
    segment: "Construção Civil",
    pain: "Orçamento de obra e acompanhamento de etapa espalhado entre planilha, ligação e visita.",
    agent: "Agente de Orçamento & Acompanhamento de Obra",
    desc: "Qualifica lead de obra, organiza etapa do projeto e mantém cliente informado do andamento.",
  },
  {
    icon: Users,
    segment: "RH & Recrutamento",
    pain: "Triagem de currículo e dúvida de candidato tomando o tempo que o RH devia usar pra entrevistar.",
    agent: "Agente de Triagem & Comunicação com Candidato",
    desc: "Faz a triagem inicial, agenda entrevista e mantém candidato informado em cada etapa do processo.",
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
          className="mt-12 flex flex-nowrap sm:flex-wrap sm:justify-center gap-2 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 px-6 -mx-6 sm:px-0 sm:mx-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {segments.map((s, i) => (
            <button
              key={s.segment}
              onClick={() => setActive(i)}
              className={`relative px-4 py-2.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 shrink-0 ${
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
            >
              <TiltCard className="relative overflow-hidden rounded-lg border border-electric-blue/20 bg-graphite/60 backdrop-blur-sm">
                <div
                  className="relative p-8 sm:p-10"
                  style={{ boxShadow: "0 0 60px -20px rgba(61,90,254,0.25)" }}
                >
                  <current.icon
                    size={180}
                    strokeWidth={1}
                    className="absolute -right-6 -bottom-10 text-white/[0.04] pointer-events-none select-none"
                    aria-hidden="true"
                  />

                  <div className="relative grid sm:grid-cols-2 gap-8 sm:gap-6">
                    <div className="flex items-start gap-4 sm:pr-6 sm:border-r sm:border-white/[0.07]">
                      <div className="w-12 h-12 shrink-0 rounded-md bg-electric-blue/10 flex items-center justify-center">
                        <current.icon size={22} className="text-electric-blue" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-steel text-xs tracking-[0.1em]">DOR COMUM · {current.segment.toUpperCase()}</p>
                        <p className="text-ivory text-lg sm:text-xl font-medium mt-1.5 leading-snug text-balance">
                          "{current.pain}"
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <ArrowRight size={18} className="text-electric-blue shrink-0 mt-0.5" />
                      <div>
                        <p className="text-steel text-xs tracking-[0.1em]">AGENTE RECOMENDADO</p>
                        <p className="text-electric-blue font-medium text-sm mt-1.5">{current.agent}</p>
                        <p className="text-steel text-sm mt-1 leading-relaxed">{current.desc}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
