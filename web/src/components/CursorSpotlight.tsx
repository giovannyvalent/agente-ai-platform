import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

// Glow sutil que segue o cursor pela página inteira (efeito usado em sites
// como Linear) — puramente decorativo, ignora cliques.
export function CursorSpotlight() {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { damping: 34, stiffness: 180 });
  const sy = useSpring(y, { damping: 34, stiffness: 180 });

  useEffect(() => {
    function onMove(e: MouseEvent) {
      x.set(e.clientX);
      y.set(e.clientY);
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [x, y]);

  const background = useTransform([sx, sy], ([cx, cy]: number[]) => {
    return `radial-gradient(600px circle at ${cx}px ${cy}px, rgba(61,90,254,0.10), transparent 40%)`;
  });

  return (
    <motion.div
      className="fixed inset-0 z-30 pointer-events-none hidden md:block"
      style={{ background }}
      aria-hidden="true"
    />
  );
}
