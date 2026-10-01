import { Bot, Workflow, Plug, ArrowRight, Play } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Logo } from "../components/Logo";
import { HeroStage } from "../components/HeroStage";
import { LogoMarquee } from "../components/LogoMarquee";
import { MultiLineChart } from "../components/ui/MultiLineChart";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useReveal } from "../lib/useReveal";

const solutions = [
  {
    icon: Bot,
    eyebrow: "01",
    title: "Agentes de IA",
    desc: "Agentes desenhados para executar tarefas reais de vendas, atendimento, agenda, suporte, financeiro e operação.",
  },
  {
    icon: Workflow,
    eyebrow: "02",
    title: "Automação de processos",
    desc: "Fluxos inteligentes para eliminar trabalho manual e conectar decisões com execução.",
  },
  {
    icon: Plug,
    eyebrow: "03",
    title: "Integrações",
    desc: "CRM, ERP, agenda, APIs, bancos de dados e sistemas internos conversando em um mesmo fluxo.",
  },
];

const methodSteps = [
  { n: "01", title: "Diagnóstico", desc: "Mapeamos tarefas, gargalos, dados e sistemas." },
  { n: "02", title: "Arquitetura", desc: "Definimos agentes, integrações, regras e métricas." },
  { n: "03", title: "Implementação", desc: "Construímos, integramos, testamos e colocamos em produção." },
  { n: "04", title: "Evolução", desc: "Acompanhamos desempenho e ampliamos o que funciona." },
];

const results = [
  { value: "12.840", label: "interações automatizadas", note: "operação contínua" },
  { value: "94,8%", label: "taxa de resolução", note: "sem intervenção humana" },
  { value: "2,4s", label: "tempo de resposta", note: "média dos agentes" },
  { value: "04", label: "agentes ativos", note: "monitorados em produção" },
];

// IMPORTANTE: este <div> é quem vira o item de grid de verdade quando usado
// dentro de um container `grid` — classes de col-span/row-span precisam ir
// AQUI (via `className`), nunca só no filho (Card), senão não tem efeito.
function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, className: revealClassName } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`${revealClassName} ${className}`}>
      {children}
    </div>
  );
}

export function Landing() {
  return (
    <div className="bg-venture-black min-h-screen overflow-x-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.4] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(circle at 30% 20%, black, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute -top-1/3 left-1/4 w-[600px] h-[600px] rounded-full pointer-events-none animate-drift"
          style={{ background: "radial-gradient(circle, rgba(61,90,254,0.16), transparent 70%)", filter: "blur(40px)" }}
          aria-hidden="true"
        />
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="h-full w-1/3 animate-scan-beam"
            style={{ background: "linear-gradient(90deg, transparent, rgba(61,90,254,0.8), transparent)" }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-24 grid lg:grid-cols-2 gap-16 items-center relative">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 text-electric-blue text-xs font-semibold tracking-[0.15em] mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-electric-blue animate-pulse-glow" />
              INTELIGÊNCIA APLICADA AO NEGÓCIO
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-ivory leading-[1.12] text-balance">
              IA que entra na <span className="text-electric-blue">operação.</span>
              <br />
              Não só na apresentação.
            </h1>
            <p className="mt-6 text-steel text-lg leading-relaxed max-w-lg">
              Desenhamos, implementamos e operamos agentes, automações e integrações de IA
              conectados aos processos reais da sua empresa.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-6">
              <a href="#contato">
                <Button className="animate-cta-glow rounded-full">
                  Falar com especialista <ArrowRight size={16} />
                </Button>
              </a>
              <a href="#solucoes" className="inline-flex items-center gap-2 text-ivory text-[0.95rem] hover:text-electric-blue transition-colors">
                <Play size={16} /> Ver o que implementamos
              </a>
            </div>

            <div className="mt-14 grid grid-cols-3 gap-6 max-w-md">
              {[
                ["Estratégia", "Diagnóstico e arquitetura"],
                ["Implementação", "Integração e produção"],
                ["Evolução", "Otimização contínua"],
              ].map(([title, sub]) => (
                <div key={title} className="border-t border-white/10 pt-3">
                  <strong className="text-ivory text-sm">{title}</strong>
                  <p className="text-steel text-xs mt-1">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <HeroStage />
          </div>
        </div>
      </section>

      <LogoMarquee />

      {/* SOLUÇÕES */}
      <section id="solucoes" className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <Reveal>
          <p className="text-electric-blue text-xs font-semibold tracking-[0.15em] mb-3">O QUE IMPLEMENTAMOS</p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-ivory tracking-tight max-w-xl text-balance">
            Inteligência que conversa com a <span className="text-electric-blue">operação inteira.</span>
          </h2>
          <p className="mt-4 text-steel max-w-lg">
            Da primeira automação ao ecossistema completo de agentes. A arquitetura nasce do
            problema do negócio, não de uma ferramenta pronta.
          </p>
        </Reveal>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {solutions.map(({ icon: Icon, eyebrow, title, desc }) => (
            <Reveal key={title}>
              <Card className="p-7 h-full overflow-hidden">
                <div className="w-10 h-10 rounded-md bg-electric-blue/10 flex items-center justify-center mb-5">
                  <Icon size={19} className="text-electric-blue" strokeWidth={1.75} />
                </div>
                <span className="text-steel text-xs">{eyebrow}</span>
                <h3 className="text-ivory font-medium mt-1 mb-2">{title}</h3>
                <p className="text-steel text-sm leading-relaxed">{desc}</p>
              </Card>
            </Reveal>
          ))}

          <Reveal className="sm:col-span-2 lg:col-span-3">
            <Card className="p-7 sm:p-9 overflow-hidden h-full">
              <div className="flex flex-col md:flex-row gap-10 md:items-center">
                <div className="md:max-w-sm shrink-0">
                  <span className="text-steel text-xs">04</span>
                  <h3 className="text-ivory font-medium text-lg mt-1 mb-2">Engenharia aplicada</h3>
                  <p className="text-steel text-sm leading-relaxed">
                    Não entregamos apenas um bot. Modelamos regras, contexto, segurança,
                    integrações e comportamento para colocar IA em produção.
                  </p>
                </div>
                <div className="flex-1 min-w-0 bg-venture-black rounded-[10px] border border-white/[0.06] overflow-hidden">
                  <div className="flex items-center gap-1.5 px-4 h-9 border-b border-white/[0.06]">
                    <span className="w-2 h-2 rounded-full bg-white/15" />
                    <span className="w-2 h-2 rounded-full bg-white/15" />
                    <span className="w-2 h-2 rounded-full bg-white/15" />
                  </div>
                  <div className="p-4 font-mono text-[0.78rem] leading-loose">
                    <div className="flex gap-3 text-steel"><span className="text-steel/50 shrink-0">01</span><span className="truncate">context.load(memory)</span></div>
                    <div className="flex gap-3 text-steel"><span className="text-steel/50 shrink-0">02</span><span className="truncate">agent.reason(request)</span></div>
                    <div className="flex gap-3 text-electric-blue"><span className="text-electric-blue/60 shrink-0">03</span><span className="truncate">workflow.execute(action)</span></div>
                    <div className="flex gap-3 text-steel"><span className="text-steel/50 shrink-0">04</span><span className="truncate">metrics.observe(result)</span></div>
                  </div>
                </div>
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* MÉTODO */}
      <section id="metodo" className="bg-graphite/40 border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 grid lg:grid-cols-[1fr_1.4fr] gap-14">
          <Reveal>
            <p className="text-electric-blue text-xs font-semibold tracking-[0.15em] mb-3">MÉTODO VENTURE</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-ivory tracking-tight text-balance">
              Da ideia ao ambiente <span className="text-electric-blue">de produção.</span>
            </h2>
            <p className="mt-4 text-steel max-w-sm">
              Um processo enxuto para descobrir onde a IA realmente cria vantagem, construir
              rápido e evoluir com dados reais.
            </p>
            <a href="#contato" className="mt-6 inline-flex items-center gap-1.5 text-electric-blue text-sm hover:text-[#6b82ff]">
              Desenhar uma implementação <ArrowRight size={14} />
            </a>
          </Reveal>

          <div className="grid sm:grid-cols-2 gap-8">
            {methodSteps.map((s) => (
              <Reveal key={s.n}>
                <div className="border-l-2 border-electric-blue/30 pl-5">
                  <b className="text-electric-blue text-sm">{s.n}</b>
                  <h3 className="text-ivory font-medium mt-1.5">{s.title}</h3>
                  <p className="text-steel text-sm mt-1.5 leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* RESULTADOS */}
      <section id="resultados" className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <Reveal>
          <p className="text-electric-blue text-xs font-semibold tracking-[0.15em] mb-3">VISIBILIDADE OPERACIONAL</p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-ivory tracking-tight max-w-xl text-balance">
            Cada agente com <span className="text-electric-blue">resultado mensurável.</span>
          </h2>
          <p className="mt-4 text-steel max-w-lg">
            Acompanhamento simples pra saber o que está em produção, o que foi resolvido e onde
            a operação pode melhorar.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {results.map((r) => (
            <Reveal key={r.label}>
              <div>
                <div className="text-4xl sm:text-5xl font-semibold text-ivory tracking-tight">{r.value}</div>
                <p className="mt-2 text-ivory/80 text-sm">{r.label}</p>
                <p className="text-steel text-xs mt-1">{r.note}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <Card className="mt-14 p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <p className="text-steel text-xs tracking-[0.1em]">MONITORAMENTO</p>
                <h3 className="text-ivory font-medium mt-1">Visão por agente</h3>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-steel">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-electric-blue" />Comercial</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#22D3EE]" />Agenda</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#A78BFA]" />Suporte</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-steel" />Qualificação</span>
              </div>
            </div>
            <MultiLineChart
              series={[
                { label: "Comercial", color: "#3D5AFE", data: [30, 42, 35, 55, 40, 62, 48, 70, 58, 80] },
                { label: "Agenda", color: "#22D3EE", data: [20, 32, 28, 40, 35, 48, 38, 55, 45, 60] },
                { label: "Suporte", color: "#A78BFA", data: [15, 20, 25, 22, 30, 28, 35, 32, 40, 38] },
                { label: "Qualificação", color: "#92969D", data: [8, 12, 10, 15, 13, 18, 16, 22, 20, 25] },
              ]}
            />
          </Card>
        </Reveal>

        <Reveal>
          <div className="mt-10 flex justify-center">
            <a href="#contato">
              <Button variant="secondary">
                Ver isso rodando na minha empresa <ArrowRight size={16} />
              </Button>
            </a>
          </div>
        </Reveal>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="max-w-7xl mx-auto px-6 lg:px-8 py-24 border-t border-white/[0.06]">
        <div className="grid lg:grid-cols-[auto_1fr] gap-12 items-center">
          <Reveal>
            <div className="text-[7rem] sm:text-[9rem] font-semibold text-white/[0.05] leading-none select-none">
              AI
            </div>
          </Reveal>
          <Reveal>
            <p className="text-electric-blue text-xs font-semibold tracking-[0.15em] mb-3">VENTURE</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-ivory tracking-tight max-w-lg text-balance">
              Implementação de IA com visão de negócio.
            </h2>
            <p className="mt-4 text-steel max-w-lg leading-relaxed">
              A Venture nasce para reduzir a distância entre o potencial da inteligência
              artificial e a execução dentro das empresas. Engenharia, estratégia e operação em
              um mesmo time.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Agentes", "Automação", "Integrações", "IA aplicada"].map((tag) => (
                <span key={tag} className="text-xs text-steel border border-white/10 rounded-full px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA FINAL */}
      <section id="contato" className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <Reveal>
          <div
            className="rounded-lg border border-electric-blue/20 p-12 sm:p-16 text-center"
            style={{ background: "radial-gradient(circle at 50% 0%, rgba(61,90,254,0.14), rgba(26,27,30,0.4) 60%)" }}
          >
            <p className="text-electric-blue text-xs font-semibold tracking-[0.15em] mb-3">
              COMECE PELO PROBLEMA CERTO
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-ivory tracking-tight text-balance">
              Onde a IA pode gerar <span className="text-electric-blue">resultado na sua operação?</span>
            </h2>
            <p className="mt-4 text-steel max-w-md mx-auto">
              Converse com a Venture e transforme um processo real em uma implementação de IA.
            </p>
            <div className="mt-8">
              <a href="mailto:contato@venture.ai">
                <Button>
                  Falar com especialista <ArrowRight size={16} />
                </Button>
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 flex flex-col sm:flex-row justify-between gap-8">
          <div>
            <Logo />
            <p className="text-steel text-sm mt-2">Inteligência aplicada.</p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-steel">
            <a href="#solucoes" className="hover:text-ivory transition-colors">Soluções</a>
            <a href="#metodo" className="hover:text-ivory transition-colors">Método</a>
            <a href="#sobre" className="hover:text-ivory transition-colors">Sobre</a>
            <a href="#contato" className="hover:text-ivory transition-colors">Contato</a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-8 text-xs text-steel/60">
          © 2026 Venture. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
