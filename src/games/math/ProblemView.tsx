// Renders any ProblemDisplay. Generators emit data; this is the only place
// that turns it into markup, so every game shares one visual language.
import type { ProblemDisplay } from "./types";

export function ProblemView({ display }: { display: ProblemDisplay }) {
  switch (display.kind) {
    case "expression":
      return (
        <div className="text-center">
          {display.sub && <p className="mb-3 text-xs font-extrabold tracking-widest text-muted uppercase">{display.sub}</p>}
          <p className="text-5xl font-black tracking-tight sm:text-6xl">{display.text}</p>
          {!display.sub && (
            <p className="mt-5 text-2xl font-bold text-ink">
              = <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl border-2 border-dashed border-line align-middle">?</span>
            </p>
          )}
        </div>
      );

    case "dots":
      return <DotField count={display.count} shape={display.shape ?? "dot"} />;

    case "compare":
      return (
        <div className="text-center">
          <p className="mb-4 text-xs font-extrabold tracking-widest text-muted uppercase">{display.ask}</p>
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <span className="flex min-w-24 items-center justify-center rounded-2xl border-2 border-b-4 border-line bg-surface px-5 py-4 text-4xl font-black sm:text-5xl">{display.left}</span>
            <span className="text-xl font-extrabold text-muted">or</span>
            <span className="flex min-w-24 items-center justify-center rounded-2xl border-2 border-b-4 border-line bg-surface px-5 py-4 text-4xl font-black sm:text-5xl">{display.right}</span>
          </div>
        </div>
      );

    case "sequence":
      return (
        <div className="text-center">
          <p className="mb-4 text-xs font-extrabold tracking-widest text-muted uppercase">What comes in the gap?</p>
          <ol className="flex flex-wrap items-center justify-center gap-2 sm:gap-3" aria-label="Sequence">
            {display.terms.map((term, i) => (
              <li
                key={i}
                className={`flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-black sm:h-16 sm:w-16 sm:text-3xl ${
                  i === display.missingIndex ? "border-2 border-dashed border-brand bg-brand-soft text-brand" : "border-2 border-b-4 border-line bg-surface"
                }`}
              >
                {term}
              </li>
            ))}
          </ol>
        </div>
      );

    case "options":
      return (
        <div>
          <p className="text-xl font-extrabold leading-snug sm:text-2xl">{display.question}</p>
          {display.options.length > 0 && (
            <ol className="mt-5 space-y-2" aria-label="Options">
              {display.options.map((opt, i) => (
                <li key={i} className="flex items-center gap-3 rounded-xl border-2 border-line bg-surface px-4 py-3 text-sm font-bold">
                  {display.numbered === false ? (
                    <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-brand" />
                  ) : (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-xs font-black text-brand">{i + 1}</span>
                  )}
                  {opt}
                </li>
              ))}
            </ol>
          )}
        </div>
      );

    case "calculus":
      return (
        <div className="text-center">
          <p className="mb-3 text-xs font-extrabold tracking-widest text-muted uppercase">{display.instruction}</p>
          <p className="font-serif text-4xl italic tracking-tight sm:text-5xl">{display.expression}</p>
        </div>
      );
  }
}

const SHAPE_CLASS = { dot: "rounded-full", square: "rounded-md rotate-3", star: "rounded-full" } as const;
const TONES = ["bg-brand", "bg-accent", "bg-success"];

function DotField({ count, shape }: { count: number; shape: "dot" | "square" | "star" }) {
  const columns = count <= 4 ? count : count <= 6 ? 3 : 4;
  return (
    <div className="text-center">
      <p className="mb-4 text-xs font-extrabold tracking-widest text-muted uppercase">How many?</p>
      <div className="mx-auto grid w-fit gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }} role="img" aria-label={`${count} ${shape}s`}>
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className={`flex h-12 w-12 items-center justify-center ${shape === "star" ? "" : `${SHAPE_CLASS[shape]} ${TONES[i % TONES.length]}`}`}>
            {shape === "star" && (
              <svg viewBox="0 0 24 24" width={40} height={40} aria-hidden="true" className={i % 2 ? "text-accent" : "text-brand"}>
                <path fill="currentColor" d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
              </svg>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
