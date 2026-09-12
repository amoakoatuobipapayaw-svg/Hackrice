import type { HTMLAttributes } from "react";

/** Shared dumb container. Agree in team chat before adding more `components/ui`. */
export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface p-6 shadow-lg shadow-black/20 ${className}`}
      {...props}
    />
  );
}
