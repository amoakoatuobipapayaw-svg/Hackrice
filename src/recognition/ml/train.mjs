// Trains a small 1D-CNN on the synthetic dataset (see generateDataset.mjs)
// to score a candidate J/Z trajectory as J, Z, or invalid/incomplete. Runs
// offline in Node via @tensorflow/tfjs-node (devDependency only; never
// shipped to the browser bundle). Saves a standard tfjs LayersModel
// (model.json + weight shards) into public/, so the browser can load it with
// a plain tf.loadLayersModel() and no conversion step.
// @tensorflow/tfjs-node@4.22.0's native kernel backend calls
// util.isNullOrUndefined, which Node removed from the `util` module in
// recent releases. Polyfill it before tfjs-node's kernels run.
import util from 'node:util';
if (!util.isNullOrUndefined) util.isNullOrUndefined = v => v === null || v === undefined;

import * as tf from '@tensorflow/tfjs-node';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { requireCompiled } from './loadTs.mjs';

const { resamplePath, RESAMPLE_LENGTH } = requireCompiled(['motionFeatures.ts']);

const here = dirname(fileURLToPath(import.meta.url));
const dataset = JSON.parse(readFileSync(join(here, 'data/dataset.json'), 'utf8'));

const LABELS = ['J', 'Z', 'invalid'];
const labelIndex = Object.fromEntries(LABELS.map((l, i) => [l, i]));

// Shuffle deterministically, then split off a validation set.
function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = makeRng(1337);
const shuffled = dataset.slice();
for (let i = shuffled.length - 1; i > 0; i--) {
  const j = Math.floor(rng() * (i + 1));
  [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
}
const splitAt = Math.floor(shuffled.length * 0.85);
const trainSet = shuffled.slice(0, splitAt);
const valSet = shuffled.slice(splitAt);

function toTensors(rows) {
  const x = rows.map(r => resamplePath(r.samples, RESAMPLE_LENGTH));
  // tf.oneHot's kernel is broken under this Node version (calls a `util`
  // helper Node has since removed), so one-hot encode by hand instead.
  const y = rows.map(r => {
    const row = new Array(LABELS.length).fill(0);
    row[labelIndex[r.label]] = 1;
    return row;
  });
  return {
    xs: tf.tensor3d(x, [rows.length, RESAMPLE_LENGTH, 2]),
    ys: tf.tensor2d(y, [rows.length, LABELS.length]),
  };
}

const { xs: trainXs, ys: trainYs } = toTensors(trainSet);
const { xs: valXs, ys: valYs } = toTensors(valSet);

// Counter-balance the "invalid" majority class so the model can't just
// always predict invalid and still score well on raw accuracy.
const counts = trainSet.reduce((acc, r) => ((acc[r.label] = (acc[r.label] ?? 0) + 1), acc), {});
const maxCount = Math.max(...Object.values(counts));
const classWeight = Object.fromEntries(LABELS.map(l => [labelIndex[l], maxCount / (counts[l] ?? 1)]));

const model = tf.sequential();
model.add(tf.layers.conv1d({ filters: 16, kernelSize: 3, activation: 'relu', inputShape: [RESAMPLE_LENGTH, 2] }));
model.add(tf.layers.conv1d({ filters: 32, kernelSize: 3, activation: 'relu' }));
model.add(tf.layers.globalAveragePooling1d());
model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
model.add(tf.layers.dropout({ rate: 0.2 }));
model.add(tf.layers.dense({ units: LABELS.length, activation: 'softmax' }));
model.compile({ optimizer: tf.train.adam(0.005), loss: 'categoricalCrossentropy', metrics: ['accuracy'] });
model.summary();

const history = await model.fit(trainXs, trainYs, {
  epochs: 40,
  batchSize: 32,
  classWeight,
  validationData: [valXs, valYs],
  callbacks: {
    onEpochEnd: (epoch, logs) => {
      if ((epoch + 1) % 5 === 0 || epoch === 0) {
        console.log(`epoch ${epoch + 1}: loss=${logs.loss.toFixed(3)} acc=${logs.acc.toFixed(3)} val_acc=${logs.val_acc.toFixed(3)}`);
      }
    },
  },
});
console.log('Final validation accuracy:', history.history.val_acc.at(-1));

// --- Sanity check against the hand-verified fixtures in tests/motion.test.ts ---
// These are independent of the synthetic generator, so they're the best
// available ground truth that the trained model actually learned something
// resembling real J/Z strokes rather than an artifact of the generator.
// scale: 1 exactly matches tests/motion.test.ts's fixtures — raw x/y ARE the
// normalized displacement there, so resamplePath's divide-by-scale is a
// no-op. Using any other scale here without also matching it against the
// same displacement values would silently feed the model an out-of-distribution
// input (this bit us once already: a mismatched scale here produced a bogus
// FAIL on both jPath and zPath).
function jPath() {
  const p = [{ x: 0, y: 0 }];
  for (let i = 1; i <= 4; i++) p.push({ x: 0, y: i * 0.3 });
  for (let i = 1; i <= 4; i++) p.push({ x: i * 0.3, y: 1.2 - i * 0.08 });
  return p.map((pt, i) => ({ ...pt, t: i * 60, scale: 1 }));
}
function zPath() {
  const p = [{ x: 0, y: 0 }];
  for (let i = 1; i <= 3; i++) p.push({ x: i * 0.3, y: 0 });
  for (let i = 1; i <= 3; i++) p.push({ x: 0.9 - i * 0.3, y: i * 0.3 });
  for (let i = 1; i <= 3; i++) p.push({ x: i * 0.3, y: 0.9 });
  return p.map((pt, i) => ({ ...pt, t: i * 60, scale: 1 }));
}
function staticJitter() {
  return Array.from({ length: 8 }, (_, i) => ({ x: 0.5 + (i % 2) * 0.01, y: 0.5, t: i * 60, scale: 1 }));
}

function predict(samples) {
  const input = tf.tensor3d([resamplePath(samples, RESAMPLE_LENGTH)], [1, RESAMPLE_LENGTH, 2]);
  const probs = model.predict(input).dataSync();
  input.dispose();
  const best = probs.indexOf(Math.max(...probs));
  return { label: LABELS[best], confidence: probs[best] };
}

const checks = [
  { name: 'jPath as J', samples: jPath(), expect: 'J' },
  { name: 'zPath as Z', samples: zPath(), expect: 'Z' },
  { name: 'staticJitter as J', samples: staticJitter(), expect: 'invalid' },
  { name: 'staticJitter as Z', samples: staticJitter(), expect: 'invalid' },
];
let passed = 0;
for (const check of checks) {
  const { label, confidence } = predict(check.samples);
  const ok = label === check.expect;
  if (ok) passed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${check.name}: predicted ${label} (${(confidence * 100).toFixed(1)}%), expected ${check.expect}`);
}
if (passed < checks.length * 0.75) {
  console.error(`Only ${passed}/${checks.length} sanity checks passed — model likely needs more training data/epochs before use.`);
  process.exitCode = 1;
}

const modelDir = join(here, '../../../public/models/motion-model');
mkdirSync(modelDir, { recursive: true });
await model.save(`file://${modelDir}`);
console.log(`Saved model to ${modelDir}`);
