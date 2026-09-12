// The "sign this" prompt: big label, plain-language handshape, and a tip.
// Until we have sign illustrations the description is the reference image.
import { describeSign } from "./signCatalog";

type TargetCardProps = {
  label: string;
  /** Header line above the label, e.g. "Sign 2 of 5". */
  eyebrow?: string;
  /** Hide the description (Speed Challenge shows only the label to keep pace). */
  compact?: boolean;
  /** Briefly restyles the card after a confirmed rep. */
  celebrate?: boolean;
};

export function TargetCard({ label, eyebrow, compact = false, celebrate = false }: TargetCardProps) {
  const sign = describeSign(label);
  return (
    <section
      aria-live="polite"
      className={`rounded-2xl border px-6 py-5 text-center transition-colors ${
        celebrate ? "border-emerald-400 bg-emerald-500/10" : "border-slate-800 bg-slate-900/60"
      }`}
    >
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{eyebrow}</p>}
      <div className="mt-1 flex items-center justify-center gap-4">
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium uppercase text-slate-300">
          {sign.kind}
        </span>
        <h1 className="text-6xl font-black leading-none tracking-tight">{sign.label}</h1>
        {sign.glyph && (
          <span className="text-4xl" aria-hidden="true">
            {sign.glyph}
          </span>
        )}
      </div>
      {!compact && (
        <>
          <p className="mt-4 text-base text-slate-200">{sign.description}</p>
          <p className="mt-1 text-sm text-slate-400">Tip: {sign.tip}</p>
        </>
      )}
    </section>
  );
}
