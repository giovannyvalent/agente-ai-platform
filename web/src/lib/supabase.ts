import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

// Mesmo domínio sintético já usado para os usuários existentes (ex.: alana) —
// não mudar isso quebraria o login deles.
export const EMAIL_SUFFIX = "@login.agente-ai-platform.internal";
