import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Logo } from "../components/Logo";
import { Button } from "../components/ui/Button";
import { Input, Label } from "../components/ui/Input";
import { supabase, EMAIL_SUFFIX } from "../lib/supabase";

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Preenche usuário e senha.");
      return;
    }
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: username.trim().toLowerCase() + EMAIL_SUFFIX,
        password,
      });
      if (authError) {
        setError("Usuário ou senha inválidos.");
        return;
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado ao entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-venture-black">
      {/* ESQUERDA — formulário */}
      <div className="flex flex-col justify-center px-6 sm:px-16 py-16">
        <div className="w-full max-w-sm mx-auto">
          <Logo />
          <h1 className="mt-10 text-2xl font-semibold text-ivory tracking-tight">Bem-vindo de volta</h1>
          <p className="mt-2 text-steel text-sm">Acesse sua conta para continuar.</p>

          <form onSubmit={handleSubmit} className="mt-9 space-y-5">
            <div>
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-steel hover:text-ivory"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-steel cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-white/20 bg-transparent accent-electric-blue"
                />
                Lembrar de mim
              </label>
              <a href="#" className="text-electric-blue hover:text-[#6b82ff]">
                Esqueceu a senha?
              </a>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full justify-center">
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-7 flex items-center gap-3 text-xs text-steel/70">
            <div className="h-px flex-1 bg-white/10" />
            Ou continue com
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button variant="secondary" type="button" disabled className="justify-center">
              Google
            </Button>
            <Button variant="secondary" type="button" disabled className="justify-center">
              Microsoft
            </Button>
          </div>

          <p className="mt-8 text-center text-sm text-steel">
            Não tem uma conta? <span className="text-ivory">Fale com o time.</span>
          </p>
        </div>
      </div>

      {/* DIREITA — visual */}
      <div className="hidden lg:flex relative items-end justify-center overflow-hidden border-l border-white/[0.06]">
        <img
          src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(11,11,12,0.55) 0%, rgba(11,11,12,0.35) 40%, rgba(11,11,12,0.92) 100%)",
          }}
        />
        <div className="relative z-10 text-center px-12 pb-16">
          <p className="text-3xl font-semibold text-ivory tracking-tight leading-snug text-balance">
            Inteligência aplicada
            <br /> à sua operação.
          </p>
          <div className="mt-8">
            <Logo />
          </div>
        </div>
      </div>
    </div>
  );
}
