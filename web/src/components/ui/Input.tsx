import { InputHTMLAttributes, forwardRef, LabelHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full bg-venture-black border border-white/10 rounded-[10px] px-3.5 py-2.5 text-[0.95rem] text-ivory placeholder:text-steel/60 outline-none focus:border-electric-blue transition-colors ${className}`}
      {...props}
    />
  )
);
Input.displayName = "Input";

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className="block text-sm text-steel mb-1.5" {...props} />;
}
