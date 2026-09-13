// Scratch page for eyeballing SignSkeleton — not a deployed game route.
// Open with `npm run dev` at /src/games/index.html (Vite's printed port).
import { useState } from "react";
import { SignSkeleton } from "./SignSkeleton";

// I, L, V, W, Y, 9: verified against the real classifier (see handPoses.ts).
// A: unverified placeholder. C: shows the "no demo yet" fallback.
const SAMPLES = ["I", "L", "V", "W", "Y", "9", "A", "C"];

export function SignSkeletonDemo() {
  const [mirror, setMirror] = useState(true);
  const [animate, setAnimate] = useState(true);
  const [cycle, setCycle] = useState(0);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-extrabold">SignSkeleton scratch page</h1>
      <p className="mt-2 text-sm text-muted">
        Standalone demo, no recognition dependency — see src/games/handPoses.ts for the
        pose data and the TODO list of letters/numbers still needed.
      </p>

      <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} />
          Mirror (webcam view)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={animate} onChange={(e) => setAnimate(e.target.checked)} />
          Animate
        </label>
        <button
          type="button"
          className="rounded-lg border-2 border-line px-3 py-1 hover:bg-soft"
          onClick={() => setCycle((c) => c + 1)}
        >
          Replay tween (cycle {cycle})
        </button>
      </div>

      <div key={cycle} className="mt-8 flex flex-wrap gap-8">
        {SAMPLES.map((sign) => (
          <div key={sign} className="flex flex-col items-center gap-2 rounded-2xl border-2 border-line bg-surface p-4">
            <SignSkeleton sign={sign} mirror={mirror} animate={animate} size={200} />
            <p className="font-extrabold">{sign}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
