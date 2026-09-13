/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resamplePath, RESAMPLE_LENGTH } from '../motionFeatures';
import { classifyMotionML, type MotionModel } from '../motionModel';
import type { MotionSample } from '../motionClassifier';

test('resamplePath is translation- and scale-normalized, and a fixed length', () => {
  const samples: MotionSample[] = [
    { x: 1, y: 1, t: 0, scale: 0.2 },
    { x: 1.1, y: 1, t: 60, scale: 0.2 },
    { x: 1.2, y: 1, t: 120, scale: 0.2 },
  ];
  const path = resamplePath(samples, 5);
  assert.equal(path.length, 5);
  assert.deepEqual(path[0], [0, 0]);
  const shifted = resamplePath(samples.map(s => ({ ...s, x: s.x + 10, y: s.y - 3 })), 5);
  for (let i = 0; i < 5; i++) {
    assert.ok(Math.abs(path[i][0] - shifted[i][0]) < 1e-9);
    assert.ok(Math.abs(path[i][1] - shifted[i][1]) < 1e-9);
  }
  const scaled = resamplePath(samples.map(s => ({ ...s, x: (s.x - 1) * 2 + 1, scale: s.scale * 2 })), 5);
  for (let i = 0; i < 5; i++) assert.ok(Math.abs(path[i][0] - scaled[i][0]) < 1e-9);
});

test('resamplePath abstains gracefully on degenerate input', () => {
  assert.equal(resamplePath([], 5).length, 5);
  assert.equal(resamplePath([{ x: 0, y: 0, t: 0, scale: 1 }], 5).length, 5);
  const stationary = Array.from({ length: 4 }, (_, i) => ({ x: 0.5, y: 0.5, t: i * 60, scale: 1 }));
  const path = resamplePath(stationary, RESAMPLE_LENGTH);
  assert.equal(path.length, RESAMPLE_LENGTH);
  assert.ok(path.every(p => p[0] === 0 && p[1] === 0));
});

test('classifyMotionML only returns a result matching the requested candidate', () => {
  const samples: MotionSample[] = [{ x: 0, y: 0, t: 0, scale: 1 }];
  const stubModel: MotionModel = { predict: () => ({ label: 'J', confidence: 0.9 }) };
  assert.deepEqual(classifyMotionML(stubModel, samples, 'J'), { label: 'J', confidence: 0.9 });
  assert.equal(classifyMotionML(stubModel, samples, 'Z'), null);
  assert.equal(classifyMotionML(null, samples, 'J'), null);
  const abstaining: MotionModel = { predict: () => null };
  assert.equal(classifyMotionML(abstaining, samples, 'J'), null);
});

// If the trained model artifact has been generated (src/recognition/ml/train.mjs),
// load it with tfjs-node and check it against the exact hand-verified fixtures
// in motion.test.ts — the best available ground truth, independent of the
// synthetic dataset generator. Skips quietly if the artifact or tfjs-node
// isn't present (e.g. a teammate who hasn't run the training script).
void test('trained model artifact classifies the canonical J/Z fixtures correctly', async () => {
  const { existsSync, readFileSync } = await import('node:fs');
  const { join } = await import('node:path');
  // Sources run here from a temp copy (see tests/run.mjs), so the real repo
  // root — needed to find the committed model artifact under public/ — comes
  // from an env var rather than a relative/import.meta path.
  const root = process.env.SIGNLY_ROOT ?? process.cwd();
  const modelPath = join(root, 'public/models/motion-model/model.json');
  if (!existsSync(modelPath)) { console.log('  (skipped: no trained model artifact — run src/recognition/ml/train.mjs)'); return; }
  let tf: typeof import('@tensorflow/tfjs-node');
  try {
    const util = await import('node:util');
    const mutableUtil = util.default as Record<string, unknown>;
    if (!mutableUtil.isNullOrUndefined) mutableUtil.isNullOrUndefined = (v: unknown) => v === null || v === undefined;
    tf = await import('@tensorflow/tfjs-node');
  } catch { console.log('  (skipped: @tensorflow/tfjs-node not installed)'); return; }

  const modelJson = JSON.parse(readFileSync(modelPath, 'utf8'));
  const weightsPath = join(root, 'public/models/motion-model/weights.bin');
  const weightData = readFileSync(weightsPath);
  const handler = tf.io.fromMemory({
    modelTopology: modelJson.modelTopology,
    weightSpecs: modelJson.weightsManifest[0].weights,
    weightData: weightData.buffer.slice(weightData.byteOffset, weightData.byteOffset + weightData.byteLength),
  });
  const layersModel = await tf.loadLayersModel(handler);
  const model: MotionModel = {
    predict(samples) {
      const path = resamplePath(samples, RESAMPLE_LENGTH);
      const input = tf.tensor3d([path], [1, RESAMPLE_LENGTH, 2]);
      const output = layersModel.predict(input) as import('@tensorflow/tfjs-node').Tensor;
      const probabilities = Array.from(output.dataSync());
      input.dispose(); output.dispose();
      const labels = ['J', 'Z', 'invalid'] as const;
      let best = 0;
      for (let i = 1; i < probabilities.length; i++) if (probabilities[i] > probabilities[best]) best = i;
      if (labels[best] === 'invalid') return null;
      return { label: labels[best], confidence: probabilities[best] };
    },
  };

  function jPath(): MotionSample[] {
    const s: MotionSample[] = [];
    for (let i = 0; i <= 4; i++) s.push({ x: 0, y: i * 0.3, t: i * 60, scale: 1 });
    for (let i = 1; i <= 4; i++) s.push({ x: i * 0.3, y: 1.2 - i * 0.08, t: 240 + i * 60, scale: 1 });
    return s;
  }
  function zPath(): MotionSample[] {
    const s: MotionSample[] = [];
    for (let i = 0; i <= 3; i++) s.push({ x: i * 0.3, y: 0, t: i * 60, scale: 1 });
    for (let i = 1; i <= 3; i++) s.push({ x: 0.9 - i * 0.3, y: i * 0.3, t: 180 + i * 60, scale: 1 });
    for (let i = 1; i <= 3; i++) s.push({ x: i * 0.3, y: 0.9, t: 360 + i * 60, scale: 1 });
    return s;
  }
  function staticJitter(): MotionSample[] {
    return Array.from({ length: 8 }, (_, i) => ({ x: 0.5 + (i % 2) * 0.01, y: 0.5, t: i * 60, scale: 1 }));
  }

  assert.equal(classifyMotionML(model, jPath(), 'J')?.label, 'J');
  assert.equal(classifyMotionML(model, zPath(), 'Z')?.label, 'Z');
  assert.equal(classifyMotionML(model, staticJitter(), 'J'), null);
  assert.equal(classifyMotionML(model, staticJitter(), 'Z'), null);
});
