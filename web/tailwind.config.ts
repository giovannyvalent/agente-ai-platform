import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "venture-black": "#0B0B0C",
        graphite: "#1A1B1E",
        steel: "#92969D",
        ivory: "#F3F1EB",
        "electric-blue": "#3D5AFE",
        "deep-blue": "#18285F",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "system-ui", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(0,0,0,0.4)",
        card: "0 4px 24px rgba(0,0,0,0.35)",
      },
      borderRadius: {
        DEFAULT: "10px",
        lg: "14px",
      },
    },
  },
  plugins: [],
} satisfies Config;
