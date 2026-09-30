import { HTMLAttributes } from "react";

type Tone = "neutral" | "success" | "warning";

const tones: Record<Tone, string> = {
  neutral: "bg-white/[0.06] text-steel",
  success: "bg-[#12301f] text-[#4ade80]",
  warning: "bg-[#33270f] text-[#facc15]",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = "neutral", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${tones[tone]} ${className}`}
      {...props}
    />
  );
}
