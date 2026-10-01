import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

interface CounterProps {
  value: number;
  suffix?: string;
  decimals?: number;
}

// Contador que anima de 0 até `value` quando entra na viewport (uma vez só).
export function Counter({ value, suffix = "", decimals = 0 }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { damping: 28, stiffness: 50 });
  const [display, setDisplay] = useState(() => formatValue(0, decimals));

  useEffect(() => {
    if (isInView) motionValue.set(value);
  }, [isInView, value, motionValue]);

  useEffect(() => {
    return spring.on("change", (v) => setDisplay(formatValue(v, decimals)));
  }, [spring, decimals]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

function formatValue(v: number, decimals: number): string {
  if (decimals > 0) return v.toFixed(decimals).replace(".", ",");
  return Math.round(v).toLocaleString("pt-BR");
}
