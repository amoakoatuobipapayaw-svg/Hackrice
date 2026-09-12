// Pose data for SignSkeleton.tsx — a dot-and-line hand diagram the learner
// copies. Coordinates follow MediaPipe's Hand Landmarker convention:
// normalized [0, 1], origin top-left, y increasing downward, wrist-relative
// hand orientation (fingers pointing up, thumb to the left).
//
// HOW WE GET REAL POSES LATER: these three are hand-authored approximations
// — clearly distinct hand shapes, not captured from a real hand. Replace
// them by running MediaPipe on a webcam, freezing a frame while making the
// sign, and copying its 21 landmark points in here.
//
// TODO — remaining letters/numbers still needed (all approximated for now):
// C D E F G H I J K L M N O P Q R S T U V W X Y Z, and 0 1 2 3 4 6 7 8 9.
// (J and Z are motion signs — see src/recognition/motionClassifier.ts for
// how A modeled those; a static skeleton may need a start/end pose pair.)

export type Landmark = { x: number; y: number; z?: number };
export type HandPose = Landmark[]; // exactly 21 points, indices 0-20

function pose(points: [number, number][]): HandPose {
  return points.map(([x, y]) => ({ x, y }));
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
  // Fist with the thumb resting alongside it (not covering the fingers).
  A: pose([
    [0.5, 0.85],
    [0.41, 0.78], [0.34, 0.72], [0.3, 0.64], [0.28, 0.56],
    [0.39, 0.56], [0.37, 0.62], [0.36, 0.57], [0.37, 0.5],
    [0.46, 0.54], [0.45, 0.61], [0.45, 0.55], [0.46, 0.48],
    [0.53, 0.55], [0.53, 0.62], [0.53, 0.56], [0.53, 0.49],
    [0.6, 0.57], [0.6, 0.63], [0.6, 0.58], [0.6, 0.51],
  ]),
  // Flat palm: four fingers straight and together, thumb folded across.
  B: pose([
    [0.5, 0.85],
    [0.44, 0.78], [0.42, 0.68], [0.44, 0.6], [0.47, 0.56],
    [0.41, 0.55], [0.41, 0.38], [0.41, 0.22], [0.41, 0.09],
    [0.46, 0.54], [0.46, 0.36], [0.46, 0.19], [0.46, 0.06],
    [0.51, 0.55], [0.51, 0.37], [0.51, 0.2], [0.51, 0.08],
    [0.56, 0.57], [0.56, 0.41], [0.56, 0.27], [0.56, 0.16],
  ]),
  // Open hand, fingers spread wide and fully extended, thumb out to the side.
  "5": pose([
    [0.5, 0.88],
    [0.38, 0.8], [0.28, 0.72], [0.2, 0.64], [0.14, 0.57],
    [0.37, 0.56], [0.34, 0.4], [0.32, 0.26], [0.3, 0.14],
    [0.46, 0.54], [0.46, 0.36], [0.46, 0.2], [0.46, 0.08],
    [0.55, 0.55], [0.57, 0.38], [0.59, 0.23], [0.61, 0.12],
    [0.63, 0.58], [0.67, 0.44], [0.7, 0.32], [0.73, 0.22],
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
