import type { HTMLAttributes } from "react";

/** Shared dumb container. Agree in team chat before adding more `components/ui`. */
export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-black/20 ${className}`}
      {...props}
    />
  );
}
