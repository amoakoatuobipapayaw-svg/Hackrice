// Collapsible reference strip of the nine ASL number hand shapes, drawn
// from the same verified poses the classifier was tuned against. It never
// highlights the answer — it's a cheat sheet for the signing, not the math.
import { useState } from "react";
import { Icon } from "../../components/ui/Icon";
import { HandHint } from "./HandHint";

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
const TIP: Record<string, string> = {
  "1": "index up",
  "2": "index + middle",
  "3": "index + middle + thumb",
  "4": "four fingers, thumb in",
  "5": "open hand",
  "6": "thumb to pinky",
  "7": "thumb to ring",
  "8": "thumb to middle",
  "9": "thumb to index",
};

export function NumberSigns() {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-2xl border-2 border-line bg-surface" aria-label="ASL number reference">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left hover:bg-soft focus-visible:outline-2 focus-visible:outline-offset-[-4px]"
      >
        <span className="flex items-center gap-3">
          <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <Icon name="hand" size={18} />
          </span>
          <span>
            <span className="block text-sm font-extrabold">ASL numbers 1–9</span>
            <span className="block text-xs text-muted">{open ? "Hide the hand shapes" : "Need a reminder? Show the hand shapes"}</span>
          </span>
        </span>
        <Icon name="chevronRight" size={18} className={`text-muted transition-transform motion-reduce:transition-none ${open ? "-rotate-90" : "rotate-90"}`} />
      </button>
      {open && (
        <ol className="grid grid-cols-3 gap-2 border-t-2 border-line p-4 sm:grid-cols-5" aria-label="Number hand shapes">
          {DIGITS.map((d) => (
            <li key={d} className="flex flex-col items-center rounded-xl bg-soft px-1 py-2 text-center">
              <span className="text-lg font-black text-brand">{d}</span>
              <HandHint digit={d} size={64} />
              <span className="text-[10px] leading-tight text-muted">{TIP[d]}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
