import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "border-2 border-b-4 border-brand-hover bg-brand text-white hover:bg-brand-hover focus-visible:outline-brand",
  secondary:
    "border-2 border-b-4 border-line bg-surface text-ink hover:bg-line focus-visible:outline-brand",
  ghost:
    "bg-transparent text-ink hover:bg-soft focus-visible:outline-brand",
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
      className={`rounded-xl px-5 py-3 text-sm font-extrabold tracking-wide uppercase transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
