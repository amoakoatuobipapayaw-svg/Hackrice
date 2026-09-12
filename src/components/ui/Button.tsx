import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-violet-500 text-white hover:bg-violet-400 focus-visible:outline-violet-300",
  secondary:
    "bg-slate-800 text-slate-100 hover:bg-slate-700 focus-visible:outline-slate-400",
  ghost:
    "bg-transparent text-slate-200 hover:bg-slate-800 focus-visible:outline-slate-400",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

/** Shared dumb button. Agree in team chat before adding more `components/ui`. */
export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-xl px-5 py-3 text-base font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
