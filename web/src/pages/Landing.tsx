import {
  Bot,
  Workflow,
  Plug,
  Compass,
  Wrench,
  LifeBuoy,
  ArrowRight,
  Play,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Logo } from "../components/Logo";
import { AbstractVisual } from "../components/AbstractVisual";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

const trustedBy = ["Ambev", "Itaú", "TOTVS", "Stone", "Rappi", "Localiza"];

const solutions = [
  { icon: Bot, title: "Agentes de IA", desc: "Atendimento, vendas, suporte, financeiro e operação." },
  { icon: Workflow, title: "Automação de processos", desc: "Fluxos inteligentes e integrados aos processos da empresa." },
  { icon: Plug, title: "Integrações", desc: "ERP, CRM, APIs, WhatsApp e sistemas internos." },
  { icon: Compass, title: "Diagnóstico e estratégia", desc: "Mapeamento de oportunidades e plano de implementação." },
  { icon: Wrench, title: "Implementação", desc: "Desenvolvimento, configuração, integração e entrada em produção." },
  { icon: LifeBuoy, title: "Operação e suporte", desc: "Acompanhamento, otimizações e evolução contínua." },
];

const results = [
  { value: "+40%", label: "produtividade operacional" },
  { value: "-30%", label: "redução de custos operacionais" },
  { value: "+25%", label: "conversão de vendas e atendimento" },
  { value: "+50%", label: "agilidade em processos internos" },
];

const steps = [
  { n: "01", title: "Diagnóstico", desc: "Entendemos sua operação e identificamos oportunidades." },
  { n: "02", title: "Projeto", desc: "Desenhamos a solução ideal para o seu negócio." },
  { n: "03", title: "Implementação", desc: "Integramos, configuramos e colocamos em produção." },
  { n: "04", title: "Evolução", desc: "Acompanhamos, otimizamos e expandimos." },
];

export function Landing() {
  return (
    <div className="bg-venture-black min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-up">
            <p className="text-electric-blue text-xs font-semibold tracking-[0.15em] mb-4">
              INTELIGÊNCIA APLICADA AO SEU NEGÓCIO
            </p>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-ivory leading-[1.1] text-balance">
              Implementamos IA que gera <span className="text-electric-blue">resultado real.</span>
            </h1>
            <p className="mt-6 text-steel text-lg leading-relaxed max-w-lg">
              Agentes, automações e integrações de IA personalizadas para a operação da sua
              empresa. Menos teoria. Mais execução.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-6">
              <Button>
                Falar com especialista <ArrowRight size={16} />
              </Button>
              <button className="inline-flex items-center gap-2 text-ivory text-[0.95rem] hover:text-electric-blue transition-colors">
                <Play size={16} /> Ver como funciona
              </button>
            </div>

            <div className="mt-20">
              <p className="text-xs text-steel tracking-widest mb-5">EMPRESAS QUE CONFIAM</p>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4 opacity-60">
                {trustedBy.map((name) => (
                  <span key={name} className="text-steel font-medium text-lg">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="relative h-[420px] hidden lg:block animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <AbstractVisual className="absolute right-[-40px] top-1/2 -translate-y-1/2 w-[440px] h-[440px]" />
          </div>
        </div>
      </section>

      {/* SOLUÇÕES */}
      <section id="solucoes" className="max-w-7xl mx-auto px-6 lg:px-8 py-24 border-t border-white/[0.06]">
        <p className="text-electric-blue text-xs font-semibold tracking-[0.15em] mb-3">SOLUÇÕES</p>
        <h2 className="text-3xl sm:text-4xl font-semibold text-ivory tracking-tight max-w-xl">
          Da estratégia à implementação.
        </h2>
        <p className="mt-4 text-steel max-w-lg">
          Implementamos soluções de IA que se conectam aos seus sistemas, processos e pessoas.
        </p>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {solutions.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="p-6">
              <div className="w-9 h-9 rounded-md bg-electric-blue/10 flex items-center justify-center mb-4">
                <Icon size={18} className="text-electric-blue" strokeWidth={1.75} />
              </div>
              <h3 className="text-ivory font-medium mb-1.5">{title}</h3>
              <p className="text-steel text-sm leading-relaxed">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* RESULTADOS */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24 border-t border-white/[0.06]">
        <p className="text-electric-blue text-xs font-semibold tracking-[0.15em] mb-3">RESULTADOS</p>
        <h2 className="text-3xl sm:text-4xl font-semibold text-ivory tracking-tight max-w-xl">
          IA aplicada em processos reais.
        </h2>

        <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {results.map((r) => (
            <div key={r.label}>
              <div className="text-4xl sm:text-5xl font-semibold text-ivory tracking-tight">{r.value}</div>
              <p className="mt-2 text-steel text-sm">{r.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="max-w-7xl mx-auto px-6 lg:px-8 py-24 border-t border-white/[0.06]">
        <p className="text-electric-blue text-xs font-semibold tracking-[0.15em] mb-3">COMO FUNCIONA</p>
        <h2 className="text-3xl sm:text-4xl font-semibold text-ivory tracking-tight max-w-xl mb-14">
          Um processo simples e eficiente.
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((s, i) => (
            <div key={s.n} className="relative">
              <div className="w-11 h-11 rounded-full border border-electric-blue/40 text-electric-blue flex items-center justify-center font-medium mb-5">
                {s.n}
              </div>
              <h3 className="text-ivory font-medium mb-1.5">{s.title}</h3>
              <p className="text-steel text-sm leading-relaxed">{s.desc}</p>
              {i < steps.length - 1 && (
                <ArrowRight size={16} className="hidden lg:block absolute top-4 -right-4 text-steel/30" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section id="contato" className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div
          className="rounded-lg border border-electric-blue/20 p-12 sm:p-16 text-center"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, rgba(61,90,254,0.12), rgba(26,27,30,0.4) 60%)",
          }}
        >
          <h2 className="text-3xl sm:text-4xl font-semibold text-ivory tracking-tight text-balance">
            Pronto para implementar IA na sua empresa?
          </h2>
          <p className="mt-4 text-steel max-w-md mx-auto">
            Fale com um especialista e descubra as oportunidades para o seu negócio.
          </p>
          <div className="mt-8">
            <Button>
              Falar com especialista <ArrowRight size={16} />
            </Button>
          </div>
        </div>
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
            <a href="#como-funciona" className="hover:text-ivory transition-colors">Casos</a>
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
