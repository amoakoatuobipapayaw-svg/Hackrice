// The answer line under a problem: one slot per digit. Confirmed digits
// fill in; the slot the camera is waiting for pulses. Single-digit games get
// a single slot, so the mechanic reads the same everywhere.
//
// On a miss we reveal the answer AND how to sign it — a wrong answer is the
// best moment to teach the hand shape.
import { HandHint } from "./HandHint";

type AnswerSlotsProps = {
  digitCount: number;
  entered: number[];
  state: "open" | "success" | "miss";
  /** A wrong answer is red; an answer the learner asked to see is amber. */
  tone?: "wrong" | "taught";
  /** Full answer, revealed on a miss. */
  reveal?: number[];
};

export function AnswerSlots({ digitCount, entered, state, tone = "taught", reveal }: AnswerSlotsProps) {
  const slots = Array.from({ length: digitCount }, (_, i) => entered[i] ?? (state === "miss" ? reveal?.[i] : undefined));
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs font-extrabold tracking-widest text-muted uppercase">
        {state === "success" ? "Answer confirmed" : state === "miss" ? "The answer was" : digitCount > 1 ? "Sign each digit, left to right" : "Your answer"}
      </p>
      <ol className="flex items-center gap-3" aria-label="Answer digits">
        {slots.map((digit, i) => {
          const active = state === "open" && i === entered.length;
          const filled = digit !== undefined;
          const style =
            state === "success"
              ? "border-success bg-success-soft text-success"
              : state === "miss"
                ? tone === "wrong"
                  ? "border-danger bg-danger-soft text-danger"
                  : "border-accent bg-accent/15 text-accent-ink"
                : filled
                  ? "border-brand bg-brand-soft text-brand"
                  : active
                    ? "animate-pulse border-brand border-dashed bg-surface text-brand motion-reduce:animate-none"
                    : "border-line border-dashed bg-surface text-muted";
          return (
            <li key={i} aria-current={active ? "step" : undefined} className={`flex h-20 w-16 items-center justify-center rounded-2xl border-2 text-4xl font-black transition-colors ${style}`}>
              {filled ? digit : active ? "?" : ""}
            </li>
          );
        })}
      </ol>
      {state === "miss" && reveal && (
        <figure className="mt-1 rounded-2xl border-2 border-line bg-soft px-4 py-3">
          <figcaption className="mb-1 text-center text-[11px] font-extrabold tracking-widest text-muted uppercase">
            How to sign {reveal.join("")}
          </figcaption>
          <div className="flex items-end justify-center gap-2">
            {reveal.map((d, i) => (
              <div key={i} className="flex flex-col items-center">
                <HandHint digit={String(d)} size={108} />
                <span className="text-sm font-black text-brand">{d}</span>
              </div>
            ))}
          </div>
        </figure>
      )}
    </div>
  );
}
