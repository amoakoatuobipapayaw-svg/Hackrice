// Pose data for SignSkeleton.tsx — a dot-and-line hand diagram the learner
// copies. Coordinates follow MediaPipe's Hand Landmarker convention:
// normalized [0, 1], origin top-left, y increasing downward, wrist-relative
// hand orientation (fingers pointing up, thumb to the left).
//
// TWO TIERS OF DATA HERE:
//
// 1. VERIFIED poses — every letter A-Y except J, plus every digit 0-9. All
//    of Practice's static pool. These are NOT eyeballed — they're generated
//    by the same synthetic-hand technique src/recognition/tests/core.test.ts
//    uses for its fixtures, then run through the real classifySign() and
//    confirmed it returns that exact label. The classifier only cares about
//    relative joint angles and scale-normalized distances (see
//    computeHandFrame in signClassifier.ts), never absolute pixel positions
//    — that's what makes this generation approach valid instead of needing
//    a real photographed hand. Some of these took real trial and error
//    against the classifier's exact thresholds; see git history on this
//    file for the working generator scripts and the rejected attempts.
//    Notable ones:
//      - O: a moderate ~78° finger curl, not a tight fist.
//      - K/P: a straight thumb chain from the CMC joint, not just a
//        repositioned tip, or thumbOut's own angle check fails.
//      - G/Q: identical to L's handshape (index + out-turned thumb) —
//        only the index finger's direction (sideways vs. downward vs. up)
//        differs, and Q's downward reach has to clear the wrist's own y
//        position or the "straight finger" distance check fails.
//      - R: index and middle need a consistent diagonal chain (not just a
//        repositioned tip) so they stay "straight" while crossing.
//      - X: the hooked index needs roughly a right angle at the PIP joint —
//        much less and it reads as a curled fist, much more and it reads
//        as a straight finger.
//      - E/S/T/N/M: these differ only in exactly where the thumb tip sits
//        relative to the other bases (see the project() axis math in
//        classifySign) and whether it sits in front of or behind the
//        curled fingertips on the z-axis.
//
// 2. APPROXIMATE poses (J, Z) — J and Z are motion signs (see
//    src/recognition/motionClassifier.ts): classifySign only ever returns a
//    static label, so there's nothing to verify a "J" or "Z" result
//    against. These are just J and Z's starting handshape (I, and a bare
//    index point) frozen as a diagram; the guide's text steps carry the
//    actual motion.
//
// HOW TO ADD MORE: for simple shapes (straight-or-curled fingers, thumb
// out-or-in, optional thumb-to-fingertip contact), reuse the `hand()`
// generator pattern from core.test.ts and verify with classifySign() before
// trusting the result. When a point is missing `z`, computeHandFrame
// silently returns null (a bug hit twice writing this file) — always pass
// all three axes. For shapes that generator can't express there's no
// shortcut beyond careful angle math against the classifier, or a real
// captured hand: run MediaPipe on a webcam (src/recognition/index.html),
// freeze a frame making the sign, copy its 21 landmark points in here.

export type Landmark = { x: number; y: number; z?: number };
export type HandPose = Landmark[]; // exactly 21 points, indices 0-20

function pose(points: [number, number, number?][]): HandPose {
  // z defaults to 0, but is NOT omitted — signClassifier's computeHandFrame
  // requires every point's z to be a finite number, or it abstains entirely.
  // The verified poses below carry real (small) z offsets: curled and
  // thumb-touching fingers are geometrically distinguished partly on the
  // z-axis (depth), and dropping that would silently break the "verified
  // against classifySign()" claim in the header above.
  return points.map(([x, y, z = 0]) => ({ x, y, z }));
}

/** Relaxed open hand, gently curled — the animation's resting start state. */
export const NEUTRAL_POSE: HandPose = pose([
  [0.5, 0.85], // 0 wrist
  [0.4, 0.78], [0.34, 0.72], [0.31, 0.66], [0.3, 0.6], // 1-4 thumb
  [0.38, 0.55], [0.37, 0.45], [0.38, 0.37], [0.4, 0.31], // 5-8 index
  [0.46, 0.53], [0.46, 0.42], [0.47, 0.33], [0.49, 0.27], // 9-12 middle
  [0.54, 0.54], [0.55, 0.44], [0.56, 0.36], [0.58, 0.31], // 13-16 ring
  [0.62, 0.57], [0.63, 0.49], [0.65, 0.43], [0.67, 0.39], // 17-20 pinky
]);

export const TARGET_POSES: Record<string, HandPose> = {
  // Verified against classifySign() — see the file header.
  A: pose([
    [0.5, 0.9], [0.36, 0.79], [0.32, 0.68], [0.26, 0.62],
    [0.22, 0.56], [0.36, 0.6], [0.36, 0.46], [0.36, 0.56, -0.03],
    [0.36, 0.67, -0.03], [0.48, 0.6], [0.48, 0.46], [0.48, 0.56, -0.03],
    [0.48, 0.67, -0.03], [0.6, 0.6], [0.6, 0.46], [0.6, 0.56, -0.03],
    [0.6, 0.67, -0.03], [0.72, 0.6], [0.72, 0.46], [0.72, 0.56, -0.03],
    [0.72, 0.67, -0.03],
  ]),
  // Verified against classifySign() — see the file header.
  B: pose([
    [0.5, 0.9], [0.36, 0.79], [0.29, 0.71], [0.37, 0.66],
    [0.43, 0.7], [0.36, 0.6], [0.36, 0.46], [0.36, 0.32],
    [0.36, 0.18], [0.48, 0.6], [0.48, 0.46], [0.48, 0.32],
    [0.48, 0.18], [0.6, 0.6], [0.6, 0.46], [0.6, 0.32],
    [0.6, 0.18], [0.72, 0.6], [0.72, 0.46], [0.72, 0.32],
    [0.72, 0.18],
  ]),
  // Verified against classifySign() — see the file header.
  C: pose([
    [0.5, 0.9], [0.4, 0.6], [0.34, 0.55], [0.3, 0.52],
    [0.26, 0.5], [0.36, 0.6], [0.3, 0.46], [0.32, 0.4, -0.03],
    [0.36, 0.36, -0.03], [0.48, 0.6], [0.42, 0.44], [0.44, 0.38, -0.03],
    [0.48, 0.33, -0.03], [0.6, 0.6], [0.54, 0.44], [0.56, 0.38, -0.03],
    [0.6, 0.33, -0.03], [0.72, 0.6], [0.66, 0.46], [0.68, 0.41, -0.03],
    [0.72, 0.37, -0.03],
  ]),
  // Verified against classifySign() — see the file header.
  D: pose([
    [0.5, 0.9], [0.36, 0.79], [0.29, 0.71], [0.37, 0.66],
    [0.48, 0.67, -0.05], [0.36, 0.6], [0.36, 0.46], [0.36, 0.32],
    [0.36, 0.18], [0.48, 0.6], [0.48, 0.46], [0.48, 0.56, -0.03],
    [0.48, 0.67, -0.03], [0.6, 0.6], [0.6, 0.46], [0.6, 0.56, -0.03],
    [0.6, 0.67, -0.03], [0.72, 0.6], [0.72, 0.46], [0.72, 0.56, -0.03],
    [0.72, 0.67, -0.03],
  ]),
  // Verified against classifySign() — see the file header.
  E: pose([
    [0.5, 0.9], [0.36, 0.79], [0.32, 0.58], [0.4, 0.55],
    [0.46, 0.55, -0.03], [0.36, 0.6], [0.34, 0.5], [0.4, 0.52, -0.02],
    [0.44, 0.56, -0.02], [0.48, 0.6], [0.44, 0.48], [0.46, 0.52, -0.02],
    [0.47, 0.56, -0.02], [0.6, 0.6], [0.56, 0.48], [0.53, 0.52, -0.02],
    [0.51, 0.56, -0.02], [0.72, 0.6], [0.66, 0.5], [0.6, 0.53, -0.02],
    [0.55, 0.56, -0.02],
  ]),
  // Verified against classifySign() — see the file header.
  F: pose([
    [0.5, 0.9], [0.36, 0.79], [0.29, 0.71], [0.37, 0.66],
    [0.36, 0.67, -0.05], [0.36, 0.6], [0.36, 0.46], [0.36, 0.56, -0.03],
    [0.36, 0.67, -0.03], [0.48, 0.6], [0.48, 0.46], [0.48, 0.32],
    [0.48, 0.18], [0.6, 0.6], [0.6, 0.46], [0.6, 0.32],
    [0.6, 0.18], [0.72, 0.6], [0.72, 0.46], [0.72, 0.32],
    [0.72, 0.18],
  ]),
  // Verified against classifySign() — see the file header.
  G: pose([
    [0.5, 0.9], [0.36, 0.79], [0.29, 0.71], [0.17, 0.67],
    [0.05, 0.63], [0.36, 0.6], [0.5, 0.58], [0.64, 0.56],
    [0.78, 0.54], [0.48, 0.6], [0.48, 0.46], [0.48, 0.56, -0.03],
    [0.48, 0.67, -0.03], [0.6, 0.6], [0.6, 0.46], [0.6, 0.56, -0.03],
    [0.6, 0.67, -0.03], [0.72, 0.6], [0.72, 0.46], [0.72, 0.56, -0.03],
    [0.72, 0.67, -0.03],
  ]),
  // Verified against classifySign() — see the file header.
  H: pose([
    [0.5, 0.9], [0.36, 0.79], [0.29, 0.71], [0.37, 0.66],
    [0.43, 0.7], [0.34, 0.55], [0.44, 0.53], [0.54, 0.51],
    [0.64, 0.49], [0.34, 0.6], [0.44, 0.6], [0.54, 0.6],
    [0.64, 0.6], [0.6, 0.6], [0.6, 0.46], [0.6, 0.56, -0.03],
    [0.6, 0.67, -0.03], [0.72, 0.6], [0.72, 0.46], [0.72, 0.56, -0.03],
    [0.72, 0.67, -0.03],
  ]),
  // Verified against classifySign() — see the file header.
  K: pose([
    [0.5, 0.9], [0.36, 0.79], [0.35333333333333333, 0.66], [0.3466666666666667, 0.53],
    [0.34, 0.4], [0.36, 0.6], [0.36, 0.46], [0.36, 0.32],
    [0.36, 0.18], [0.48, 0.6], [0.48, 0.46], [0.48, 0.32],
    [0.48, 0.18], [0.6, 0.6], [0.6, 0.46], [0.6, 0.56, -0.03],
    [0.6, 0.67, -0.03], [0.72, 0.6], [0.72, 0.46], [0.72, 0.56, -0.03],
    [0.72, 0.67, -0.03],
  ]),
  // Verified against classifySign() — see the file header.
  M: pose([
    [0.5, 0.9], [0.36, 0.79], [0.36, 0.62], [0.5, 0.56],
    [0.66, 0.5], [0.36, 0.6], [0.36, 0.46], [0.36, 0.56, -0.03],
    [0.36, 0.67, -0.03], [0.48, 0.6], [0.48, 0.46], [0.48, 0.56, -0.03],
    [0.48, 0.67, -0.03], [0.6, 0.6], [0.6, 0.46], [0.6, 0.56, -0.03],
    [0.6, 0.67, -0.03], [0.72, 0.6], [0.72, 0.46], [0.72, 0.56, -0.03],
    [0.72, 0.67, -0.03],
  ]),
  // Verified against classifySign() — see the file header.
  N: pose([
    [0.5, 0.9], [0.36, 0.79], [0.34, 0.62], [0.44, 0.56],
    [0.54, 0.5], [0.36, 0.6], [0.36, 0.46], [0.36, 0.56, -0.03],
    [0.36, 0.67, -0.03], [0.48, 0.6], [0.48, 0.46], [0.48, 0.56, -0.03],
    [0.48, 0.67, -0.03], [0.6, 0.6], [0.6, 0.46], [0.6, 0.56, -0.03],
    [0.6, 0.67, -0.03], [0.72, 0.6], [0.72, 0.46], [0.72, 0.56, -0.03],
    [0.72, 0.67, -0.03],
  ]),
  // Verified against classifySign() — see the file header.
  O: pose([
    [0.5, 0.9], [0.4, 0.6], [0.34, 0.55], [0.32, 0.5],
    [0.24, 0.48, -0.1], [0.36, 0.54], [0.36, 0.44], [0.26, 0.5, -0.05],
    [0.24, 0.48, -0.08], [0.48, 0.54], [0.48, 0.44], [0.38, 0.5, -0.05],
    [0.36, 0.48, -0.08], [0.6, 0.54], [0.6, 0.44], [0.5, 0.5, -0.05],
    [0.48, 0.48, -0.08], [0.72, 0.54], [0.72, 0.44], [0.62, 0.5, -0.05],
    [0.6, 0.48, -0.08],
  ]),
  // Verified against classifySign() — see the file header.
  P: pose([
    [0.5, 0.15], [0.4, 0.2], [0.4066666666666667, 0.32666666666666666], [0.41333333333333333, 0.4533333333333333],
    [0.42, 0.58], [0.36, 0.35], [0.36, 0.49], [0.36, 0.63],
    [0.36, 0.77], [0.48, 0.35], [0.48, 0.49], [0.48, 0.63],
    [0.48, 0.77], [0.6, 0.35], [0.6, 0.28], [0.6, 0.24, -0.03],
    [0.6, 0.2, -0.03], [0.72, 0.35], [0.72, 0.28], [0.72, 0.24, -0.03],
    [0.72, 0.2, -0.03],
  ]),
  // Verified against classifySign() — see the file header.
  Q: pose([
    [0.5, 0.9], [0.36, 0.79], [0.29, 0.71], [0.17, 0.67],
    [0.05, 0.63], [0.36, 0.6], [0.36, 0.75], [0.36, 0.95],
    [0.36, 1.2], [0.48, 0.6], [0.48, 0.46], [0.48, 0.56, -0.03],
    [0.48, 0.67, -0.03], [0.6, 0.6], [0.6, 0.46], [0.6, 0.56, -0.03],
    [0.6, 0.67, -0.03], [0.72, 0.6], [0.72, 0.46], [0.72, 0.56, -0.03],
    [0.72, 0.67, -0.03],
  ]),
  // Verified against classifySign() — see the file header.
  R: pose([
    [0.5, 0.9], [0.36, 0.79], [0.29, 0.71], [0.37, 0.66],
    [0.43, 0.7], [0.36, 0.6], [0.4, 0.46], [0.44, 0.32],
    [0.5, 0.18], [0.48, 0.6], [0.44, 0.46], [0.4, 0.32],
    [0.34, 0.18], [0.6, 0.6], [0.6, 0.46], [0.6, 0.56, -0.03],
    [0.6, 0.67, -0.03], [0.72, 0.6], [0.72, 0.46], [0.72, 0.56, -0.03],
    [0.72, 0.67, -0.03],
  ]),
  // Verified against classifySign() — see the file header.
  S: pose([
    [0.5, 0.9], [0.36, 0.79], [0.34, 0.62], [0.4, 0.58],
    [0.42, 0.55, -0.1], [0.36, 0.6], [0.36, 0.46], [0.36, 0.56, -0.03],
    [0.36, 0.67, -0.03], [0.48, 0.6], [0.48, 0.46], [0.48, 0.56, -0.03],
    [0.48, 0.67, -0.03], [0.6, 0.6], [0.6, 0.46], [0.6, 0.56, -0.03],
    [0.6, 0.67, -0.03], [0.72, 0.6], [0.72, 0.46], [0.72, 0.56, -0.03],
    [0.72, 0.67, -0.03],
  ]),
  // Verified against classifySign() — see the file header.
  T: pose([
    [0.5, 0.9], [0.36, 0.79], [0.32, 0.62], [0.36, 0.56],
    [0.4, 0.5], [0.36, 0.6], [0.36, 0.46], [0.36, 0.56, -0.03],
    [0.36, 0.67, -0.03], [0.48, 0.6], [0.48, 0.46], [0.48, 0.56, -0.03],
    [0.48, 0.67, -0.03], [0.6, 0.6], [0.6, 0.46], [0.6, 0.56, -0.03],
    [0.6, 0.67, -0.03], [0.72, 0.6], [0.72, 0.46], [0.72, 0.56, -0.03],
    [0.72, 0.67, -0.03],
  ]),
  // Verified against classifySign() — see the file header.
  U: pose([
    [0.5, 0.9], [0.36, 0.79], [0.29, 0.71], [0.37, 0.66],
    [0.43, 0.7], [0.36, 0.6], [0.36, 0.46], [0.36, 0.32],
    [0.36, 0.18], [0.48, 0.6], [0.48, 0.46], [0.48, 0.32],
    [0.48, 0.18], [0.6, 0.6], [0.6, 0.46], [0.6, 0.56, -0.03],
    [0.6, 0.67, -0.03], [0.72, 0.6], [0.72, 0.46], [0.72, 0.56, -0.03],
    [0.72, 0.67, -0.03],
  ]),
  // Verified against classifySign() — see the file header.
  "1": pose([
    [0.5, 0.9], [0.36, 0.79], [0.29, 0.71], [0.37, 0.66],
    [0.43, 0.7], [0.36, 0.6], [0.36, 0.46], [0.36, 0.32],
    [0.36, 0.18], [0.48, 0.6], [0.48, 0.46], [0.48, 0.56, -0.03],
    [0.48, 0.67, -0.03], [0.6, 0.6], [0.6, 0.46], [0.6, 0.56, -0.03],
    [0.6, 0.67, -0.03], [0.72, 0.6], [0.72, 0.46], [0.72, 0.56, -0.03],
    [0.72, 0.67, -0.03],
  ]),
  // Verified against classifySign() — see the file header.
  "2": pose([
    [0.5, 0.9], [0.36, 0.79], [0.29, 0.71], [0.37, 0.66],
    [0.43, 0.7], [0.36, 0.6], [0.36, 0.46], [0.36, 0.32],
    [0.36, 0.18], [0.48, 0.6], [0.48, 0.46], [0.48, 0.32],
    [0.48, 0.18], [0.6, 0.6], [0.6, 0.46], [0.6, 0.56, -0.03],
    [0.6, 0.67, -0.03], [0.72, 0.6], [0.72, 0.46], [0.72, 0.56, -0.03],
    [0.72, 0.67, -0.03],
  ]),
  // Verified against classifySign() — see the file header.
  "3": pose([
    [0.5, 0.9], [0.36, 0.79], [0.29, 0.71], [0.17, 0.67],
    [0.05, 0.63], [0.36, 0.6], [0.36, 0.46], [0.36, 0.32],
    [0.36, 0.18], [0.48, 0.6], [0.48, 0.46], [0.48, 0.32],
    [0.48, 0.18], [0.6, 0.6], [0.6, 0.46], [0.6, 0.56, -0.03],
    [0.6, 0.67, -0.03], [0.72, 0.6], [0.72, 0.46], [0.72, 0.56, -0.03],
    [0.72, 0.67, -0.03],
  ]),
  // Verified against classifySign() — see the file header.
  "4": pose([
    [0.5, 0.9], [0.36, 0.79], [0.29, 0.71], [0.37, 0.66],
    [0.43, 0.7], [0.36, 0.6], [0.36, 0.46], [0.36, 0.32],
    [0.36, 0.18], [0.48, 0.6], [0.48, 0.46], [0.48, 0.32],
    [0.48, 0.18], [0.6, 0.6], [0.6, 0.46], [0.6, 0.32],
    [0.6, 0.18], [0.72, 0.6], [0.72, 0.46], [0.72, 0.32],
    [0.72, 0.18],
  ]),
  // Verified against classifySign() — see the file header.
  "5": pose([
    [0.5, 0.9], [0.36, 0.79], [0.29, 0.71], [0.17, 0.67],
    [0.05, 0.63], [0.36, 0.6], [0.36, 0.46], [0.36, 0.32],
    [0.36, 0.18], [0.48, 0.6], [0.48, 0.46], [0.48, 0.32],
    [0.48, 0.18], [0.6, 0.6], [0.6, 0.46], [0.6, 0.32],
    [0.6, 0.18], [0.72, 0.6], [0.72, 0.46], [0.72, 0.32],
    [0.72, 0.18],
  ]),
  // Verified against classifySign() — see the file header.
  "6": pose([
    [0.5, 0.9], [0.36, 0.79], [0.29, 0.71], [0.37, 0.66],
    [0.72, 0.67, -0.05], [0.36, 0.6], [0.36, 0.46], [0.36, 0.32],
    [0.36, 0.18], [0.48, 0.6], [0.48, 0.46], [0.48, 0.32],
    [0.48, 0.18], [0.6, 0.6], [0.6, 0.46], [0.6, 0.32],
    [0.6, 0.18], [0.72, 0.6], [0.72, 0.46], [0.72, 0.56, -0.03],
    [0.72, 0.67, -0.03],
  ]),
  // Verified against classifySign() — see the file header.
  "7": pose([
    [0.5, 0.9], [0.36, 0.79], [0.29, 0.71], [0.37, 0.66],
    [0.6, 0.67, -0.05], [0.36, 0.6], [0.36, 0.46], [0.36, 0.32],
    [0.36, 0.18], [0.48, 0.6], [0.48, 0.46], [0.48, 0.32],
    [0.48, 0.18], [0.6, 0.6], [0.6, 0.46], [0.6, 0.56, -0.03],
    [0.6, 0.67, -0.03], [0.72, 0.6], [0.72, 0.46], [0.72, 0.32],
    [0.72, 0.18],
  ]),
  // Verified against classifySign() — see the file header.
  "8": pose([
    [0.5, 0.9], [0.36, 0.79], [0.29, 0.71], [0.37, 0.66],
    [0.48, 0.67, -0.05], [0.36, 0.6], [0.36, 0.46], [0.36, 0.32],
    [0.36, 0.18], [0.48, 0.6], [0.48, 0.46], [0.48, 0.56, -0.03],
    [0.48, 0.67, -0.03], [0.6, 0.6], [0.6, 0.46], [0.6, 0.32],
    [0.6, 0.18], [0.72, 0.6], [0.72, 0.46], [0.72, 0.32],
    [0.72, 0.18],
  ]),
  // Verified against classifySign() — see the file header.
  "9": pose([
    [0.5, 0.9], [0.36, 0.79], [0.29, 0.71], [0.37, 0.66],
    [0.36, 0.67, -0.05], [0.36, 0.6], [0.36, 0.46], [0.36, 0.56, -0.03],
    [0.36, 0.67, -0.03], [0.48, 0.6], [0.48, 0.46], [0.48, 0.32],
    [0.48, 0.18], [0.6, 0.6], [0.6, 0.46], [0.6, 0.32],
    [0.6, 0.18], [0.72, 0.6], [0.72, 0.46], [0.72, 0.32],
    [0.72, 0.18],
  ]),
  // Verified against classifySign() — see the file header.
  I: pose([
    [0.5, 0.9], [0.36, 0.79], [0.29, 0.71], [0.37, 0.66],
    [0.43, 0.7], [0.36, 0.6], [0.36, 0.46], [0.36, 0.56, -0.03],
    [0.36, 0.67, -0.03], [0.48, 0.6], [0.48, 0.46], [0.48, 0.56, -0.03],
    [0.48, 0.67, -0.03], [0.6, 0.6], [0.6, 0.46], [0.6, 0.56, -0.03],
    [0.6, 0.67, -0.03], [0.72, 0.6], [0.72, 0.46], [0.72, 0.32],
    [0.72, 0.18],
  ]),
  // Approximate — J's starting handshape (same as I; see the file header).
  // The guide's text steps carry the actual downward-then-hook motion.
  J: pose([
    [0.5, 0.9], [0.36, 0.79], [0.29, 0.71], [0.37, 0.66],
    [0.43, 0.7], [0.36, 0.6], [0.36, 0.46], [0.36, 0.56, -0.03],
    [0.36, 0.67, -0.03], [0.48, 0.6], [0.48, 0.46], [0.48, 0.56, -0.03],
    [0.48, 0.67, -0.03], [0.6, 0.6], [0.6, 0.46], [0.6, 0.56, -0.03],
    [0.6, 0.67, -0.03], [0.72, 0.6], [0.72, 0.46], [0.72, 0.32],
    [0.72, 0.18],
  ]),
  // Verified against classifySign() — see the file header.
  L: pose([
    [0.5, 0.9], [0.36, 0.79], [0.29, 0.71], [0.17, 0.67],
    [0.05, 0.63], [0.36, 0.6], [0.36, 0.46], [0.36, 0.32],
    [0.36, 0.18], [0.48, 0.6], [0.48, 0.46], [0.48, 0.56, -0.03],
    [0.48, 0.67, -0.03], [0.6, 0.6], [0.6, 0.46], [0.6, 0.56, -0.03],
    [0.6, 0.67, -0.03], [0.72, 0.6], [0.72, 0.46], [0.72, 0.56, -0.03],
    [0.72, 0.67, -0.03],
  ]),
  // Verified against classifySign() — see the file header.
  V: pose([
    [0.5, 0.9], [0.36, 0.79], [0.29, 0.71], [0.37, 0.66],
    [0.43, 0.7], [0.36, 0.6], [0.36, 0.46], [0.36, 0.32],
    [0.36, 0.18], [0.53, 0.6], [0.53, 0.46], [0.53, 0.32],
    [0.53, 0.18], [0.6, 0.6], [0.6, 0.46], [0.6, 0.56, -0.03],
    [0.6, 0.67, -0.03], [0.72, 0.6], [0.72, 0.46], [0.72, 0.56, -0.03],
    [0.72, 0.67, -0.03],
  ]),
  // Verified against classifySign() — see the file header.
  W: pose([
    [0.5, 0.9], [0.36, 0.79], [0.29, 0.71], [0.37, 0.66],
    [0.43, 0.7], [0.36, 0.6], [0.36, 0.46], [0.36, 0.32],
    [0.36, 0.18], [0.48, 0.6], [0.48, 0.46], [0.48, 0.32],
    [0.48, 0.18], [0.6, 0.6], [0.6, 0.46], [0.6, 0.32],
    [0.6, 0.18], [0.72, 0.6], [0.72, 0.46], [0.72, 0.56, -0.03],
    [0.72, 0.67, -0.03],
  ]),
  // Verified against classifySign() — see the file header.
  Y: pose([
    [0.5, 0.9], [0.36, 0.79], [0.29, 0.71], [0.17, 0.67],
    [0.05, 0.63], [0.36, 0.6], [0.36, 0.46], [0.36, 0.56, -0.03],
    [0.36, 0.67, -0.03], [0.48, 0.6], [0.48, 0.46], [0.48, 0.56, -0.03],
    [0.48, 0.67, -0.03], [0.6, 0.6], [0.6, 0.46], [0.6, 0.56, -0.03],
    [0.6, 0.67, -0.03], [0.72, 0.6], [0.72, 0.46], [0.72, 0.32],
    [0.72, 0.18],
  ]),
  // Verified against classifySign() — see the file header.
  X: pose([
    [0.5, 0.9], [0.36, 0.79], [0.29, 0.71], [0.37, 0.66],
    [0.43, 0.7], [0.36, 0.6], [0.34, 0.56], [0.4, 0.48, -0.03],
    [0.5, 0.42, -0.03], [0.48, 0.6], [0.48, 0.46], [0.48, 0.56, -0.03],
    [0.48, 0.67, -0.03], [0.6, 0.6], [0.6, 0.46], [0.6, 0.56, -0.03],
    [0.6, 0.67, -0.03], [0.72, 0.6], [0.72, 0.46], [0.72, 0.56, -0.03],
    [0.72, 0.67, -0.03],
  ]),
  // Approximate — Z's starting handshape: a bare index point (see the file
  // header). The guide's text steps carry the actual Z-stroke motion.
  Z: pose([
    [0.5, 0.9], [0.36, 0.79], [0.29, 0.71], [0.37, 0.66],
    [0.43, 0.7], [0.36, 0.6], [0.36, 0.46], [0.36, 0.32],
    [0.36, 0.18], [0.48, 0.6], [0.48, 0.46], [0.48, 0.56, -0.03],
    [0.48, 0.67, -0.03], [0.6, 0.6], [0.6, 0.46], [0.6, 0.56, -0.03],
    [0.6, 0.67, -0.03], [0.72, 0.6], [0.72, 0.46], [0.72, 0.56, -0.03],
    [0.72, 0.67, -0.03],
  ]),
  // Verified against classifySign() (numbers vocabulary) — see the file header.
  "0": pose([
    [0.5, 0.9], [0.4, 0.6], [0.34, 0.55], [0.3, 0.5],
    [0.3, 0.44], [0.36, 0.6], [0.3, 0.46], [0.28, 0.38, -0.03],
    [0.32, 0.42, -0.03], [0.48, 0.6], [0.42, 0.44], [0.4, 0.36, -0.03],
    [0.44, 0.4, -0.03], [0.6, 0.6], [0.54, 0.44], [0.52, 0.36, -0.03],
    [0.56, 0.4, -0.03], [0.72, 0.6], [0.66, 0.46], [0.64, 0.4, -0.03],
    [0.68, 0.44, -0.03],
  ]),
};

export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], // thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // index
  [9, 10], [10, 11], [11, 12], // middle
  [13, 14], [14, 15], [15, 16], // ring
  [0, 17], [17, 18], [18, 19], [19, 20], // pinky
  [5, 9], [9, 13], [13, 17], // palm
];
