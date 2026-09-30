import { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-graphite/60 border border-white/[0.07] rounded-lg shadow-subtle ${className}`}
      {...props}
    />
  );
}
