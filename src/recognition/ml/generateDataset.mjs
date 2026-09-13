// Generates a large labeled dataset of traced J/Z candidate trajectories
// without any hand-collected webcam data. The trick: instead of hand-writing
// "this counts as a valid J," we procedurally generate thousands of randomized
// candidate strokes (some clearly good, some clearly bad, some borderline,
// some swapped between J/Z) and let the EXISTING, already-tuned geometric
// heuristic (classifyMotion, in motionClassifier.ts) act as the ground-truth
// labeler. The model trained on this data can therefore only learn to
// approximate/generalize a decision boundary the team already validated as
// reasonable — never something worse or unrelated to it.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { requireCompiled } from './loadTs.mjs';

const { classifyMotion } = requireCompiled(['motionClassifier.ts']);

// Deterministic PRNG (mulberry32) so the dataset is reproducible.
function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const uniform = (rng, lo, hi) => lo + rng() * (hi - lo);
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

/** Densify a polyline of control points into evenly-spaced-ish points with
 * jitter, so classifyMotion's path()/leg efficiency math sees a realistic
 * noisy trace rather than a handful of perfectly straight segments. */
function densify(rng, controlPoints, noise) {
  const out = [controlPoints[0]];
  for (let i = 1; i < controlPoints.length; i++) {
    const a = controlPoints[i - 1], b = controlPoints[i];
    const steps = Math.floor(uniform(rng, 3, 9));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      out.push({
        x: a.x + (b.x - a.x) * t + (rng() - 0.5) * noise,
        y: a.y + (b.y - a.y) * t + (rng() - 0.5) * noise,
      });
    }
  }
  return out;
}

function jControlPoints(rng, style) {
  const descend = style === 'valid' ? uniform(rng, 0.55, 0.95) : uniform(rng, 0.05, 1.1);
  const hookDx = style === 'valid' ? uniform(rng, 0.28, 0.5) : uniform(rng, -0.1, 0.55);
  const hookDy = style === 'valid' ? uniform(rng, -0.4, -0.16) : uniform(rng, -0.45, 0.15);
  const drift = style === 'valid' ? uniform(rng, -0.08, 0.08) : uniform(rng, -0.3, 0.3);
  const mid = { x: drift, y: descend };
  return [{ x: 0, y: 0 }, mid, { x: mid.x + hookDx, y: mid.y + hookDy }];
}

function zControlPoints(rng, style) {
  const dir = pick(rng, [-1, 1]);
  const dx1 = dir * (style === 'valid' ? uniform(rng, 0.4, 0.7) : uniform(rng, 0.05, 0.8));
  const dy1 = style === 'valid' ? uniform(rng, -0.05, 0.05) : uniform(rng, -0.3, 0.3);
  const dx2 = style === 'valid' ? -dir * uniform(rng, 0.4, 0.7) : uniform(rng, -0.8, 0.8);
  const dy2 = style === 'valid' ? uniform(rng, 0.4, 0.75) : uniform(rng, -0.3, 0.8);
  const dx3 = style === 'valid' ? dir * uniform(rng, 0.4, 0.7) : uniform(rng, -0.8, 0.8);
  const dy3 = style === 'valid' ? uniform(rng, -0.05, 0.05) : uniform(rng, -0.3, 0.3);
  const p0 = { x: 0, y: 0 };
  const p1 = { x: p0.x + dx1, y: p0.y + dy1 };
  const p2 = { x: p1.x + dx2, y: p1.y + dy2 };
  const p3 = { x: p2.x + dx3, y: p2.y + dy3 };
  return [p0, p1, p2, p3];
}

function jitterPoints(rng) {
  const cx = uniform(rng, -0.05, 0.05), cy = uniform(rng, -0.05, 0.05);
  const n = Math.floor(uniform(rng, 6, 12));
  return Array.from({ length: n }, () => ({ x: cx + (rng() - 0.5) * 0.03, y: cy + (rng() - 0.5) * 0.03 }));
}

/** Turn a normalized point path into a raw MotionSample[] with realistic
 * per-sample scale jitter and frame timing (matching useSignRecognition's
 * ~15fps throttle, with an occasional dropped-frame-style pause). */
function toSamples(rng, points, baseScale) {
  let t = 0;
  return points.map((p, i) => {
    if (i > 0) t += rng() < 0.15 ? uniform(rng, 120, 220) : uniform(rng, 35, 75);
    const scale = baseScale * uniform(rng, 0.97, 1.03);
    return { x: p.x * scale, y: p.y * scale, t, scale };
  });
}

function generateFor(rng, candidate, style, n, out) {
  for (let i = 0; i < n; i++) {
    const points = candidate === 'J' ? jControlPoints(rng, style) : zControlPoints(rng, style);
    const noise = style === 'valid' ? uniform(rng, 0, 0.02) : uniform(rng, 0, 0.08);
    const dense = densify(rng, points, noise);
    const samples = toSamples(rng, dense, uniform(rng, 0.1, 0.25));
    const result = classifyMotion(samples, candidate);
    out.push({ label: result ? result.label : 'invalid', samples });
  }
}

function generateJitterFor(rng, candidate, n, out) {
  for (let i = 0; i < n; i++) {
    const samples = toSamples(rng, jitterPoints(rng), uniform(rng, 0.1, 0.25));
    const result = classifyMotion(samples, candidate);
    out.push({ label: result ? result.label : 'invalid', samples });
  }
}

function generateCrossShape(rng, n, out) {
  for (let i = 0; i < n; i++) {
    const shape = pick(rng, ['J', 'Z']);
    const candidate = shape === 'J' ? 'Z' : 'J';
    const points = shape === 'J' ? jControlPoints(rng, 'valid') : zControlPoints(rng, 'valid');
    const dense = densify(rng, points, uniform(rng, 0, 0.03));
    const samples = toSamples(rng, dense, uniform(rng, 0.1, 0.25));
    const result = classifyMotion(samples, candidate);
    out.push({ label: result ? result.label : 'invalid', samples });
  }
}

const rng = makeRng(20260912);
const dataset = [];
generateFor(rng, 'J', 'valid', 1500, dataset);
generateFor(rng, 'J', 'invalid', 1500, dataset);
generateFor(rng, 'Z', 'valid', 1500, dataset);
generateFor(rng, 'Z', 'invalid', 1500, dataset);
generateCrossShape(rng, 1000, dataset);
generateJitterFor(rng, 'J', 500, dataset);
generateJitterFor(rng, 'Z', 500, dataset);

const counts = dataset.reduce((acc, d) => ((acc[d.label] = (acc[d.label] ?? 0) + 1), acc), {});
console.log(`Generated ${dataset.length} sequences:`, counts);

const here = dirname(fileURLToPath(import.meta.url));
writeFileSync(join(here, 'data/dataset.json'), JSON.stringify(dataset));
console.log(`Wrote ${join(here, 'data/dataset.json')}`);
