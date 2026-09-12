// Webcam + landmark overlay + everything the player needs to know about the
// recognizer right now: start button, loading/error state, the live guess,
// and the hold-to-confirm ring. Shared by all three modes so the camera
// experience is identical everywhere.
import { Button } from "../components/ui/Button";
import type { Recognition } from "../recognition/types";
import { RecognitionCamera } from "./RecognitionCamera";

type CameraPanelProps = {
  recognition: Recognition;
  /** What we're waiting for; used to colour the live guess. */
  target?: string;
  /** Brief overlay after a confirmed rep. */
  flash?: "success" | "miss" | null;
  startLabel?: string;
};

export function CameraPanel({ recognition, target, flash, startLabel = "Start camera" }: CameraPanelProps) {
  const { status, error, current, holdProgress } = recognition;
  const guess = current?.label ?? null;
  const matches = guess !== null && guess === target;
  const pct = Math.round(holdProgress * 100);

  return (
    <div className="relative">
      <RecognitionCamera videoRef={recognition.videoRef} canvasRef={recognition.canvasRef} />

      {status === "idle" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-slate-950/80 px-4 text-center">
          <p className="text-sm text-slate-300">Your camera stays in the browser — nothing is uploaded.</p>
          <Button onClick={recognition.start}>{startLabel}</Button>
        </div>
      )}
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-950/70">
          <p className="animate-pulse text-slate-200" role="status">
            Starting camera and hand tracker…
          </p>
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-slate-950/85 px-6 text-center">
          <p className="text-red-300" role="alert">
            {error}
          </p>
          <Button variant="secondary" onClick={recognition.start}>
            Try again
          </Button>
        </div>
      )}

      {flash && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 rounded-xl ring-8 ring-inset transition-opacity ${
            flash === "success" ? "ring-emerald-400/80" : "ring-red-400/70"
          }`}
        />
      )}

      {status === "running" && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 rounded-b-xl bg-gradient-to-t from-slate-950/90 to-transparent px-4 pb-3 pt-8">
          <p className="text-sm text-slate-300">
            Seeing:{" "}
            <span
              className={`font-mono text-lg font-bold ${matches ? "text-emerald-300" : guess ? "text-amber-200" : "text-slate-500"}`}
              aria-live="polite"
            >
              {guess ?? "no hand"}
            </span>
          </p>
          <HoldRing pct={pct} active={matches} />
        </div>
      )}
    </div>
  );
}

/** Circular hold-to-confirm indicator; fills while the target sign is stable. */
function HoldRing({ pct, active }: { pct: number; active: boolean }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Hold to confirm">
      <span className="text-xs text-slate-400">{active ? "Hold it…" : "Hold to confirm"}</span>
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r={r} fill="none" stroke="rgb(51 65 85)" strokeWidth="4" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={active ? "rgb(52 211 153)" : "rgb(167 139 250)"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          transform="rotate(-90 20 20)"
          style={{ transition: "stroke-dashoffset 80ms linear" }}
        />
      </svg>
    </div>
  );
}
