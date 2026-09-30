import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "text";
type Size = "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed rounded-[10px] whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-electric-blue text-white hover:bg-[#2f49e0] active:bg-[#2740c9]",
  secondary:
    "bg-transparent border border-white/15 text-ivory hover:border-white/30 hover:bg-white/5",
  text: "bg-transparent text-electric-blue hover:text-[#6b82ff] px-0",
};

const sizes: Record<Size, string> = {
  md: "text-[0.95rem] px-5 py-2.5",
  sm: "text-sm px-3.5 py-1.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${variant !== "text" ? sizes[size] : ""} ${className}`}
      {...props}
    />
  )
);
Button.displayName = "Button";
