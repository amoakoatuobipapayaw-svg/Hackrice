import type { SignResult } from '../lib/contracts';
import type { MotionLetter, MotionSample } from './motionClassifier';
import { resamplePath, RESAMPLE_LENGTH } from './motionFeatures';

// Trained offline (src/recognition/ml/) on synthetic trajectories labeled by
// the existing geometric heuristic in motionClassifier.ts, then validated
// against the hand-written fixtures in tests/motion.test.ts. Loaded from
// jsDelivr the same way handLandmarker.ts loads MediaPipe, keeping this out
// of package.json/the bundle rather than adding a real npm dependency.
export const TFJS_VERSION = '4.22.0';
const MODULE_URL = `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@${TFJS_VERSION}/+esm`;
const MODEL_URL = '/models/motion-model/model.json';
const MOTION_LABELS = ['J', 'Z', 'invalid'] as const;
// Require a clear margin over "invalid" so a completed gesture (which is
// accepted immediately, with no hold-to-confirm window) needs real confidence.
const ML_FLOOR = 0.6;

type Tensor = { dataSync(): Float32Array | Int32Array | Uint8Array; dispose(): void };
type LayersModel = { predict(x: Tensor): Tensor };
type TfModule = {
  tensor3d(values: number[][][], shape: [number, number, number]): Tensor;
  loadLayersModel(path: string): Promise<LayersModel>;
};

export interface MotionModel { predict(samples: readonly MotionSample[]): SignResult | null; }

export async function loadMotionModel(): Promise<MotionModel> {
  const tf = await import(/* @vite-ignore */ MODULE_URL) as TfModule;
  const layersModel = await tf.loadLayersModel(MODEL_URL);
  return {
    predict(samples: readonly MotionSample[]): SignResult | null {
      const path = resamplePath(samples, RESAMPLE_LENGTH);
      const input = tf.tensor3d([path], [1, RESAMPLE_LENGTH, 2]);
      const output = layersModel.predict(input);
      const probabilities = Array.from(output.dataSync());
      input.dispose(); output.dispose();
      let best = 0;
      for (let i = 1; i < probabilities.length; i++) if (probabilities[i] > probabilities[best]) best = i;
      const label = MOTION_LABELS[best];
      if (label === 'invalid' || probabilities[best] < ML_FLOOR) return null;
      return { label, confidence: probabilities[best] };
    },
  };
}

/** classifyMotion's own return shape/gates, reused so the ML path and the
 * heuristic it can fall back to agree on what a caller receives. */
export function classifyMotionML(
  model: MotionModel | null,
  samples: readonly MotionSample[],
  candidate: MotionLetter,
): SignResult | null {
  if (!model) return null;
  const result = model.predict(samples);
  return result && result.label === candidate ? result : null;
}
