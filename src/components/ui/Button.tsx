import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

// All colors come from semantic tokens (brand, brand-hover, line, surface,
// soft, ink). The actual hex values — including the blue brand color and the
// high-contrast overrides — live in globals.css, so this file never changes
// when the palette does.
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
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`select-none rounded-xl px-5 py-3 text-sm font-extrabold tracking-wide uppercase transition-[background-color,transform] active:translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
