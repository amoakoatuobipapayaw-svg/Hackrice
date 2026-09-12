import type { SignResult } from '../lib/contracts';

/** One rep per uninterrupted hold; release/change sign to score it again. */
export function createHoldTracker() {
  let label: string | null = null;
  let since = 0;
  let last = 0;
  let awarded = false;
  let configuration = '';
  function reset() { label = null; since = 0; last = 0; awarded = false; }
  return {
    reset,
    update(result: SignResult | null, now: number, options: {
      target?: string; holdMs?: number; minConfidence?: number;
    } = {}) {
      const nextConfiguration = JSON.stringify([options.target, options.holdMs, options.minConfidence]);
      if (configuration !== nextConfiguration) { reset(); configuration = nextConfiguration; }
      if (!Number.isFinite(now) || !result || !Number.isFinite(result.confidence) ||
          result.confidence < (options.minConfidence ?? 0.8) ||
          (options.target && result.label !== options.target)) {
        reset();
        return { progress: 0, confirmed: null };
      }
      // A suspended tab or lost video must not count as continuous evidence.
      if (label !== result.label || now - last > 250 || now < last) {
        label = result.label; since = now; awarded = false;
      }
      last = now;
      const progress = Math.min(1, (now - since) / Math.max(100, options.holdMs ?? 1000));
      const confirmed = progress === 1 && !awarded ? result : null;
      if (confirmed) awarded = true;
      return { progress, confirmed };
    },
  };
}
