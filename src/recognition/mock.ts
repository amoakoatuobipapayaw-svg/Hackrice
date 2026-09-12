import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { SignResult } from '../lib/contracts';
import type { Recognition, RecognitionOptions } from './types';
import { useRecognitionState } from './useRecognitionState';

export const MOCK_SEQUENCE: readonly (SignResult | null)[] = [
  { label: 'A', confidence: 0.95 }, null,
  { label: 'B', confidence: 0.95 }, null,
  { label: 'THANK YOU', confidence: 0.95 }, null,
  { label: '1', confidence: 0.95 }, null,
  { label: '5', confidence: 0.95 }, null,
];

/** Drop-in for B: no camera, model download, API key, or backend required. */
export function useSignRecognition(
  options: RecognitionOptions & { sequence?: readonly (SignResult | null)[] } = {},
): Recognition {
  const { current, confirmed, correctReps, holdProgress, reset, clearHold, accept } = useRecognitionState(options);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const latest = useRef(options);
  useLayoutEffect(() => { latest.current = options; }, [options]);
  const [status, setStatus] = useState<Recognition['status']>('idle');
  const stop = useCallback(() => {
    if (timer.current !== null) clearInterval(timer.current);
    timer.current = null; setStatus('idle'); clearHold();
  }, [clearHold]);
  const start = useCallback(() => {
    if (timer.current !== null) return;
    clearHold(); setStatus('running');
    const started = performance.now();
    timer.current = setInterval(() => {
      const now = performance.now();
      const sequence = latest.current.sequence ?? MOCK_SEQUENCE;
      accept(sequence.length ? sequence[Math.floor((now - started) / 1600) % sequence.length] : null, now);
    }, 50);
  }, [accept, clearHold]);
  useEffect(() => () => { if (timer.current !== null) clearInterval(timer.current); }, []);
  return { current: current, confirmed: confirmed, correctReps: correctReps,
    holdProgress: holdProgress, reset: reset, videoRef, canvasRef,
    status, error: null, coachingLine: 'Mock mode — no camera or AI coaching.', start, stop };
}

export { useSignRecognition as useMockSignRecognition };
