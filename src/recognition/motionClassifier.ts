// Trajectory-based recognition for motion signs (currently J and Z), built as
// a small extensible template registry rather than one-off J/Z-specific glue,
// so a future word sign can register its own scorer here without touching
// the frame loop in useSignRecognition.ts.
//
// A motion sign is: hold a specific static handshape (motionCandidateShape
// below decides which one, reusing computeHandFrame from signClassifier.ts)
// while tracing a trajectory. useSignRecognition.ts buffers the tracked
// fingertip's position each frame while the candidate handshape holds, and
// calls classifyMotion() on that buffer.
//
// Like signClassifier.ts's rule-match scores, this is uncalibrated geometric
// evidence, not a trained gesture model, and it has had NO live-camera
// validation — J and Z's caps in signClassifier's CONFIDENCE_CAP table start
// at the same untested 0.5 tier as any other never-tested letter. Promote
// them the same way: test live, then raise their cap there.
import type { SignResult } from '../lib/contracts';
import type { HandFrame } from './signClassifier';
import { CONFIDENCE_CAP, DEFAULT_CAP, ramp } from './signClassifier';

export type MotionSample = { x: number; y: number; t: number; scale: number };

const MIN_SAMPLES = 5;
const MIN_DURATION_MS = 200;
const MAX_DURATION_MS = 1800;

/** Which motion sign's starting handshape (if any) this frame matches. Reuses
 * the same finger-extension evidence classifySign uses for its own static 'I'
 * and ambiguous bare-index-point cases. */
export function motionCandidateShape(frame: HandFrame): 'J' | 'Z' | null {
  const [index, middle, ring, pinky] = frame.straight;
  if (!index && !middle && !ring && pinky) return 'J'; // I handshape
  if (index && !middle && !ring && !pinky && !frame.thumbOut && !frame.contact[1]) return 'Z'; // bare index point
  return null;
}

function normalizedPath(samples: readonly MotionSample[]) {
  const avgScale = samples.reduce((sum, s) => sum + s.scale, 0) / samples.length;
  const x0 = samples[0].x, y0 = samples[0].y;
  const nx = samples.map(s => (s.x - x0) / avgScale);
  const ny = samples.map(s => (s.y - y0) / avgScale);
  let pathLength = 0;
  for (let i = 1; i < nx.length; i++) pathLength += Math.hypot(nx[i] - nx[i-1], ny[i] - ny[i-1]);
  return { nx, ny, avgScale, pathLength };
}

function leg(nx: number[], ny: number[], from: number, to: number) {
  const v = { x: nx[to] - nx[from], y: ny[to] - ny[from] };
  return { ...v, len: Math.hypot(v.x, v.y) };
}

/** J: traced from the I handshape, roughly straight down then hooking —
 * direction-agnostic so it doesn't assume a right-handed signer or a
 * particular camera-mirroring convention. */
function scoreJ(samples: readonly MotionSample[]): number {
  const { nx, ny, pathLength } = normalizedPath(samples);
  if (pathLength < 1.0) return 0; // not enough motion; let the static classifier own a held I/Y
  const mid = Math.floor((nx.length - 1) / 2);
  const first = leg(nx, ny, 0, mid);
  const second = leg(nx, ny, mid, nx.length - 1);
  if (first.len < 0.3 || second.len < 0.2) return 0;
  if (Math.abs(first.y) <= Math.abs(first.x)) return 0; // first leg must be predominantly vertical, not diagonal
  const downward = ramp(first.y / first.len, 0.3, 0.85);
  const cos = (first.x*second.x + first.y*second.y) / (first.len*second.len);
  const turnAngle = Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI;
  const hooks = ramp(turnAngle, 30, 90); // a real turn, not a straight continuation or a shallow drift
  return Math.min(downward, hooks);
}

/** Z: traced from a bare index point, a horizontal-diagonal-horizontal
 * zigzag. Checked as relative direction changes between legs (not an
 * absolute left/right), so it doesn't depend on which way the camera
 * happens to mirror the image. */
function scoreZ(samples: readonly MotionSample[]): number {
  const { nx, ny, pathLength } = normalizedPath(samples);
  if (pathLength < 1.4) return 0;
  const n = nx.length;
  const t1 = Math.floor(n / 3), t2 = Math.floor((2 * n) / 3);
  const legs = [leg(nx, ny, 0, t1), leg(nx, ny, t1, t2), leg(nx, ny, t2, n - 1)];
  if (legs.some(l => l.len < 0.25)) return 0;
  const horiz = legs.map(l => l.x / l.len);
  const outerHoriz = Math.min(ramp(Math.abs(horiz[0]), 0.3, 0.85), ramp(Math.abs(horiz[2]), 0.3, 0.85));
  const outerAgree = ramp(horiz[0] * horiz[2], 0.05, 0.4); // outer legs point the same way
  const reversal = ramp(-(horiz[0] * horiz[1]), 0.05, 0.4); // middle leg reverses that direction
  const vertical = ramp(Math.abs(legs[1].y / legs[1].len), 0.1, 0.7); // and drifts vertically, unlike the outer legs
  return Math.min(outerHoriz, outerAgree, reversal, vertical);
}

const TEMPLATES: Record<string, (samples: readonly MotionSample[]) => number> = { J: scoreJ, Z: scoreZ };

export function classifyMotion(samples: readonly MotionSample[], candidate: string): SignResult | null {
  const scorer = TEMPLATES[candidate];
  if (!scorer || samples.length < MIN_SAMPLES) return null;
  const duration = samples[samples.length - 1].t - samples[0].t;
  if (duration < MIN_DURATION_MS || duration > MAX_DURATION_MS) return null;
  if (!samples.every(s => Number.isFinite(s.x) && Number.isFinite(s.y) && s.scale > 0)) return null;
  const evidence = scorer(samples);
  if (evidence <= 0) return null;
  const cap = CONFIDENCE_CAP[candidate] ?? DEFAULT_CAP;
  return { label: candidate, confidence: Math.min(cap, 0.45 + 0.53 * evidence) };
}
