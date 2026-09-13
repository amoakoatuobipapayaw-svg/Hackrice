import type { SignRecognition, SignResult } from '../lib/contracts';
import type { RefObject } from 'react';

export type Landmark = { x: number; y: number; z: number };
export type Vocabulary = 'letters' | 'numbers';
export type RecognitionOptions = {
  vocabulary?: Vocabulary;
  target?: string;
  holdMs?: number;
  minConfidence?: number;
  onConfirm?: (result: SignResult) => void;
  /** Landmark summaries leave the browser only when coaching is explicitly enabled. */
  coaching?: boolean;
  /** Opt-in J/Z stroke scoring; experimental and not calibrated ASL accuracy. */
  experimentalMotion?: boolean;
};
export interface Recognition extends SignRecognition {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  status: 'idle' | 'loading' | 'running' | 'error';
  error: string | null;
  coachingLine: string | null;
  holdProgress: number;
  confirmed: SignResult | null;
  correctReps: number;
  reset(): void;
}
