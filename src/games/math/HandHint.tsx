// A fitted hand diagram for one digit. SignSkeleton draws the same verified
// poses (handPoses.ts) but at their raw normalized coordinates, which leaves
// a narrow hand floating in a mostly-empty square. Here the pose's bounding
// box is scaled to fill the frame, so the shape stays legible at the small
// sizes the Math Lab needs. Pose data is read, never modified.
import { HAND_CONNECTIONS, TARGET_POSES, type HandPose } from "../handPoses";

const FINGERTIPS = new Set([4, 8, 12, 16, 20]);
const PAD = 0.1; // fraction of the frame kept clear around the hand

/** Scales a pose to fill `size`, mirrored so it reads like your own hand. */
function fit(pose: HandPose, size: number): { x: number; y: number }[] {
  const xs = pose.map((p) => 1 - p.x); // mirror first, then fit
  const ys = pose.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const span = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY, 0.01);
  const scale = (size * (1 - 2 * PAD)) / span;
  // Centre the (possibly narrower) axis inside the frame.
  const offX = (size - (Math.max(...xs) - minX) * scale) / 2;
  const offY = (size - (Math.max(...ys) - minY) * scale) / 2;
  return pose.map((_, i) => ({ x: (xs[i] - minX) * scale + offX, y: (ys[i] - minY) * scale + offY }));
}

export function HandHint({ digit, size = 108 }: { digit: string; size?: number }) {
  const pose = TARGET_POSES[digit];
  if (!pose) {
    // Blank space here reads as a rendering bug, not "no diagram yet" —
    // say so instead, same reasoning as SignSkeleton's fallback.
    return (
      <div style={{ width: size, height: size }} className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line text-center">
        <span className="text-[10px] font-bold leading-tight text-muted">No diagram yet for "{digit}"</span>
      </div>
    );
  }
  const points = fit(pose, size);
  const r = Math.max(2.5, size / 26);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Hand shape for ${digit}`}>
      <g className="text-line">
        {HAND_CONNECTIONS.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={points[a].x} y1={points[a].y} x2={points[b].x} y2={points[b].y} stroke="currentColor" strokeWidth={Math.max(2, size / 40)} strokeLinecap="round" />
        ))}
      </g>
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={FINGERTIPS.has(i) ? r * 1.4 : r} fill="currentColor" className={FINGERTIPS.has(i) ? "text-brand" : "text-muted"} />
      ))}
    </svg>
  );
}
