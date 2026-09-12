// Pure presentational hand diagram: 21 dots connected by lines, posed into
// an ASL letter/number for the learner to copy. No webcam, no data
// fetching, no dependency on recognition being done — see handPoses.ts.
import { useEffect, useRef, useState } from "react";
import { HAND_CONNECTIONS, NEUTRAL_POSE, TARGET_POSES, type HandPose } from "./handPoses";

const FINGERTIPS = new Set([4, 8, 12, 16, 20]);
const TWEEN_MS = 450;

function lerpPose(from: HandPose, to: HandPose, t: number): HandPose {
  return from.map((point, i) => ({
    x: point.x + (to[i].x - point.x) * t,
    y: point.y + (to[i].y - point.y) * t,
  }));
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

type SignSkeletonProps = {
  sign: string;
  mirror?: boolean;
  size?: number;
  animate?: boolean;
};

export function SignSkeleton({ sign, mirror = true, size = 240, animate = true }: SignSkeletonProps) {
  const target = TARGET_POSES[sign.toUpperCase()] ?? NEUTRAL_POSE;
  const hasPose = sign.toUpperCase() in TARGET_POSES;

  const [points, setPoints] = useState<HandPose>(target);
  const fromPoseRef = useRef<HandPose>(target);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const from = fromPoseRef.current;

    if (!animate || prefersReducedMotion()) {
      setPoints(target);
      fromPoseRef.current = target;
      return;
    }

    const start = performance.now();
    function tick(now: number) {
      const t = Math.min(1, (now - start) / TWEEN_MS);
      setPoints(lerpPose(from, target, t));
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromPoseRef.current = target;
      }
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fromPoseRef intentionally not a dependency
  }, [sign, animate]);

  const project = (p: { x: number; y: number }) => ({
    x: (mirror ? 1 - p.x : p.x) * size,
    y: p.y * size,
  });

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Hand shape for ${sign}`}>
        <g className="text-line">
          {HAND_CONNECTIONS.map(([a, b]) => {
            const pa = project(points[a]);
            const pb = project(points[b]);
            return <line key={`${a}-${b}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="currentColor" strokeWidth={2} strokeLinecap="round" />;
          })}
        </g>
        {points.map((point, i) => {
          const p = project(point);
          const isTip = FINGERTIPS.has(i);
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={isTip ? 6 : 4}
              fill="currentColor"
              className={isTip ? "text-accent" : "text-muted"}
            />
          );
        })}
      </svg>
      {!hasPose && <p className="text-xs text-muted">No demo yet for "{sign}"</p>}
    </div>
  );
}
