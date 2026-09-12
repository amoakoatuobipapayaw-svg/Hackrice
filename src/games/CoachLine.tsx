// The one line of Gemini coaching recognition surfaces every few seconds.
// Keeps its slot on screen even while empty so the layout doesn't jump.
type CoachLineProps = {
  line: string | null;
  /** True while the camera is running, so the empty state can say "watching". */
  active: boolean;
};

export function CoachLine({ line, active }: CoachLineProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-14 items-center gap-3 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3"
    >
      <span className="text-xl" aria-hidden="true">
        🧑‍🏫
      </span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-300">Coach</p>
        <p className="text-sm text-slate-100">
          {line ?? (active ? "Watching your hand — tips arrive every few seconds." : "Start the camera to get live coaching.")}
        </p>
      </div>
    </div>
  );
}
