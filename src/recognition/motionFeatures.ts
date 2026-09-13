import type { MotionSample } from './motionClassifier';

export const RESAMPLE_LENGTH = 24;

/** Turn a raw, variable-length traced trajectory into a fixed-length,
 * translation- and scale-normalized point sequence suitable for a model's
 * fixed-size input. Training and inference call this exact function, so any
 * drift between them here would silently wreck accuracy. */
export function resamplePath(
  samples: readonly MotionSample[],
  length = RESAMPLE_LENGTH,
): number[][] {
  if (samples.length < 2) return Array.from({ length }, () => [0, 0]);
  const scales = samples.map(s => s.scale).slice().sort((a, b) => a - b);
  const scale = scales[Math.floor(scales.length / 2)] || 1;
  const origin = samples[0];
  const points = samples.map(s => [(s.x - origin.x) / scale, (s.y - origin.y) / scale] as const);
  const cumulative = [0];
  for (let i = 1; i < points.length; i++) {
    cumulative.push(cumulative[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  }
  const total = cumulative[cumulative.length - 1];
  if (total === 0) return Array.from({ length }, () => [points[0][0], points[0][1]]);
  const result: number[][] = [];
  let segment = 0;
  for (let i = 0; i < length; i++) {
    const target = (total * i) / (length - 1);
    while (segment < cumulative.length - 2 && cumulative[segment + 1] < target) segment++;
    const segStart = cumulative[segment];
    const segEnd = cumulative[segment + 1] ?? segStart;
    const t = segEnd > segStart ? (target - segStart) / (segEnd - segStart) : 0;
    const a = points[segment];
    const b = points[segment + 1] ?? a;
    result.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return result;
}
