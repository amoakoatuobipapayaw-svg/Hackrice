import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { SignResult } from '../lib/contracts';
import { createHoldTracker } from './holdTracker';
import type { RecognitionOptions } from './types';

export function useRecognitionState(options: RecognitionOptions) {
  const optionsRef = useRef(options);
  useLayoutEffect(() => { optionsRef.current = options; }, [options]);
  const tracker = useRef(createHoldTracker());
  const [current, setCurrent] = useState<SignResult | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [confirmed, setConfirmed] = useState<SignResult | null>(null);
  const [correctReps, setCorrectReps] = useState(0);
  const clearHold = useCallback(() => {
    tracker.current.reset(); setCurrent(null); setHoldProgress(0); setConfirmed(null);
  }, []);
  const reset = useCallback(() => { clearHold(); setCorrectReps(0); }, [clearHold]);
  // Reset the external stream when the exercise changes; old evidence cannot score a new target.
  useEffect(() => {
    tracker.current.reset();
    const frame = requestAnimationFrame(clearHold);
    return () => cancelAnimationFrame(frame);
  }, [options.target, options.vocabulary, options.holdMs, options.minConfidence, clearHold]);
  const accept = useCallback((result: SignResult | null, now: number) => {
    setCurrent(result);
    const next = tracker.current.update(result, now, optionsRef.current);
    setHoldProgress(next.progress);
    if (next.confirmed) {
      setConfirmed(next.confirmed);
      setCorrectReps(count => count + 1);
      optionsRef.current.onConfirm?.(next.confirmed);
    }
  }, []);
  return { current, holdProgress, confirmed, correctReps, reset, clearHold, accept, optionsRef };
}
