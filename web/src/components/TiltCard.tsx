import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import type { ReactNode, MouseEvent } from "react";

// Tilt 3D sutil que segue o cursor — só ativa em dispositivos com mouse de
// verdade (hover: hover), não atrapalha touch.
export function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const springConfig = { damping: 22, stiffness: 220 };
  const rotateX = useSpring(useTransform(py, [0, 1], [7, -7]), springConfig);
  const rotateY = useSpring(useTransform(px, [0, 1], [-7, 7]), springConfig);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  }

  function handleMouseLeave() {
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <motion.div
      className={className}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
}
