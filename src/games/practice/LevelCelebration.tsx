// The "Practice level N successfully completed" graphic. It sits over the
// results screen and goes away the moment the learner clicks anywhere else,
// fading rather than snapping — so it is a moment, not a dialog to dismiss.
// The backdrop is the button (the card above it is inert), which keeps
// "click any other part of the screen" true for pointer and keyboard alike.
import { useEffect, useRef, useState } from "react";
import { Icon } from "../../components/ui/Icon";

const FADE_MS = 260;

export function LevelCelebration({ level, title, confirmed, total, unlockedNext, onDismiss }: {
  level: number;
  title: string;
  confirmed: number;
  total: number;
  unlockedNext?: string;
  onDismiss: () => void;
}) {
  const [leaving, setLeaving] = useState(false);
  const [entered, setEntered] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => { cancelAnimationFrame(frame); if (timer.current) clearTimeout(timer.current); };
  }, []);

  function dismiss() {
    if (leaving) return;
    setLeaving(true);
    timer.current = setTimeout(onDismiss, FADE_MS);
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") dismiss(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const visible = entered && !leaving;

  return (
    <div className={`fixed inset-0 z-50 transition-opacity duration-200 motion-reduce:transition-none ${visible ? "opacity-100" : "opacity-0"}`}>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss the level celebration"
        className="absolute inset-0 h-full w-full cursor-default bg-ink/50 backdrop-blur-[2px] focus-visible:outline-none"
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
        <div
          role="status"
          className={`relative w-full max-w-sm rounded-3xl border-2 border-b-8 border-brand-hover bg-surface px-6 py-9 text-center shadow-2xl transition-transform duration-300 motion-reduce:transition-none ${visible ? "scale-100" : "scale-95"}`}
        >
          <Burst />
          <span aria-hidden="true" className="relative mx-auto flex h-24 w-24 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-accent/40 motion-safe:animate-ping" />
            <span className="relative flex h-20 w-20 -rotate-3 items-center justify-center rounded-2xl border-b-4 border-accent-ink/40 bg-accent text-accent-ink">
              <Icon name="check" size={40} strokeWidth={3} />
            </span>
          </span>
          <p className="mt-6 text-xs font-extrabold tracking-widest text-brand uppercase">Level {level} complete</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">
            Practice level {level} <span className="marker-underline">successfully completed</span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {title} — {confirmed} of {total} shapes confirmed.
            {unlockedNext ? ` You've unlocked ${unlockedNext}.` : " That's the last level — the whole alphabet and every digit."}
          </p>
          <p className="mt-5 text-xs font-bold text-muted">Click anywhere to keep going</p>
        </div>
      </div>
    </div>
  );
}

/** Purely decorative rays behind the badge — no text, no meaning to convey. */
function Burst() {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 200" className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-44 w-44 opacity-70">
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const inner = i % 2 === 0 ? 52 : 46;
        const outer = i % 2 === 0 ? 78 : 66;
        const color = i % 3 === 0 ? "var(--color-brand)" : i % 3 === 1 ? "var(--color-accent)" : "var(--color-success)";
        return (
          <line
            key={i}
            x1={100 + Math.cos(angle) * inner}
            y1={100 + Math.sin(angle) * inner}
            x2={100 + Math.cos(angle) * outer}
            y2={100 + Math.sin(angle) * outer}
            stroke={color}
            strokeWidth={6}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}
