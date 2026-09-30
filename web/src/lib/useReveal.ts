import { useEffect, useRef, useState } from "react";

// Ativa a classe de fade-up quando o elemento entra na viewport — equivalente
// simples ao efeito ".v-reveal" da referência, sem dependência externa.
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, className: visible ? "animate-fade-up" : "opacity-0" };
}
