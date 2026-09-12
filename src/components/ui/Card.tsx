import type { HTMLAttributes } from "react";

/** Shared dumb container. Agree in team chat before adding more `components/ui`. */
export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border-2 border-line bg-surface p-6 ${className}`}
      {...props}
    />
  );
}
