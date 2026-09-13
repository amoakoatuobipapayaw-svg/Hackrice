/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyMotion, motionCandidateShape, type MotionSample } from '../motionClassifier';
import { CONFIDENCE_CAP, type HandFrame } from '../signClassifier';

// Geometric fixtures verify rule behavior, not real-world ASL accuracy —
// same caveat as signClassifier's own tests. These have had no live-camera
// validation, which is exactly why J/Z stay capped at the untested 0.5 tier
// in signClassifier's CONFIDENCE_CAP table.

/** A straight-down-then-rightward hook, in the shape of a traced "J". */
function jPath(): MotionSample[] {
  const samples: MotionSample[] = [];
  for (let i = 0; i <= 4; i++) samples.push({ x: 0, y: i * 0.3, t: i * 60, scale: 1 });
  for (let i = 1; i <= 4; i++) samples.push({ x: i * 0.3, y: 1.2, t: 240 + i * 60, scale: 1 });
  return samples;
}

/** A horizontal-diagonal-horizontal zigzag, in the shape of a traced "Z". */
function zPath(): MotionSample[] {
  const samples: MotionSample[] = [];
  for (let i = 0; i <= 3; i++) samples.push({ x: i * 0.3, y: 0, t: i * 60, scale: 1 });
  for (let i = 1; i <= 3; i++) samples.push({ x: 0.9 - i * 0.3, y: i * 0.3, t: 180 + i * 60, scale: 1 });
  for (let i = 1; i <= 3; i++) samples.push({ x: i * 0.3, y: 0.9, t: 360 + i * 60, scale: 1 });
  return samples;
}

function staticJitter(): MotionSample[] {
  return Array.from({ length: 8 }, (_, i) => ({ x: 0.5 + (i % 2) * 0.01, y: 0.5, t: i * 60, scale: 1 }));
}

test('a traced J is recognized, capped at the untested confidence tier', () => {
  const result = classifyMotion(jPath(), 'J');
  assert.equal(result?.label, 'J');
  assert.ok(result && result.confidence > 0 && result.confidence <= CONFIDENCE_CAP.J);
});

test('a traced J survives horizontal mirroring and uniform scaling', () => {
  const mirrored = jPath().map(s => ({ ...s, x: -s.x }));
  assert.equal(classifyMotion(mirrored, 'J')?.label, 'J');
  const scaled = jPath().map(s => ({ ...s, x: s.x * 2, y: s.y * 2, scale: s.scale * 2 }));
  assert.equal(classifyMotion(scaled, 'J')?.label, 'J');
});

test('a traced Z is recognized, capped at the untested confidence tier', () => {
  const result = classifyMotion(zPath(), 'Z');
  assert.equal(result?.label, 'Z');
  assert.ok(result && result.confidence > 0 && result.confidence <= CONFIDENCE_CAP.Z);
});

test('a traced Z survives horizontal mirroring and uniform scaling', () => {
  const mirrored = zPath().map(s => ({ ...s, x: -s.x }));
  assert.equal(classifyMotion(mirrored, 'Z')?.label, 'Z');
  const scaled = zPath().map(s => ({ ...s, x: s.x * 2, y: s.y * 2, scale: s.scale * 2 }));
  assert.equal(classifyMotion(scaled, 'Z')?.label, 'Z');
});

test('a held, mostly-static hand never registers as a motion sign', () => {
  assert.equal(classifyMotion(staticJitter(), 'J'), null);
  assert.equal(classifyMotion(staticJitter(), 'Z'), null);
});

test('a J-shaped path is not mistaken for Z and vice versa', () => {
  assert.equal(classifyMotion(jPath(), 'Z'), null);
  assert.equal(classifyMotion(zPath(), 'J'), null);
});

test('an unregistered candidate label abstains', () => {
  assert.equal(classifyMotion(jPath(), 'Q'), null);
});

test('too few samples, and durations outside the gesture window, abstain', () => {
  assert.equal(classifyMotion(jPath().slice(0, 3), 'J'), null);
  const tooFast = jPath().map(s => ({ ...s, t: s.t / 10 })); // whole path in under 200ms
  assert.equal(classifyMotion(tooFast, 'J'), null);
  const tooSlow = jPath().map(s => ({ ...s, t: s.t * 10 })); // whole path over 1.8s
  assert.equal(classifyMotion(tooSlow, 'J'), null);
});

test('invalid or degenerate samples abstain', () => {
  const withNaN = jPath(); withNaN[2] = { ...withNaN[2], x: NaN };
  assert.equal(classifyMotion(withNaN, 'J'), null);
  const zeroScale = jPath().map(s => ({ ...s, scale: 0 }));
  assert.equal(classifyMotion(zeroScale, 'J'), null);
});

// motionCandidateShape only reads straight/thumbOut/contact, so a minimal
// stand-in exercises its branching directly rather than reconstructing full
// hand geometry (whose incidental finger-fold positions can accidentally
// satisfy an unrelated contact condition — the resting thumb ends up close
// enough to a folded middle fingertip to register as touching it).
function fakeFrame(overrides: Partial<HandFrame>): HandFrame {
  return {
    p: [], scale: 1, d: () => 1, extension: [1, 1, 1, 1], thumbEvidence: 0, rounded: false,
    straight: [false, false, false, false], thumbOut: false, contact: [false, false, false, false],
    ...overrides,
  };
}

test('the I handshape is a J candidate; a bare index point is a Z candidate', () => {
  const iShape = fakeFrame({ straight: [false, false, false, true] }); // pinky only
  assert.equal(motionCandidateShape(iShape), 'J');
  const indexOnly = fakeFrame({ straight: [true, false, false, false] }); // index only, no thumb contact
  assert.equal(motionCandidateShape(indexOnly), 'Z');
});

test('shapes that already mean something static are not motion candidates', () => {
  const vShape = fakeFrame({ straight: [true, true, false, false] }); // two fingers -> V, not motion
  assert.equal(motionCandidateShape(vShape), null);
  const lShape = fakeFrame({ straight: [true, false, false, false], thumbOut: true }); // thumb out -> L, not Z
  assert.equal(motionCandidateShape(lShape), null);
  const dShape = fakeFrame({ straight: [true, false, false, false], contact: [false, true, false, false] }); // thumb-to-middle -> D, not Z
  assert.equal(motionCandidateShape(dShape), null);
});

test('nonfinite time/scale, reversed time and tracking gaps abstain', () => {
  for (const patch of [{t: NaN}, {scale: Infinity}, {t: -1}, {t: 1000}]) {
    const path = jPath(); path[3] = {...path[3], ...patch};
    assert.equal(classifyMotion(path, 'J'), null);
  }
});

test('Z must progress downward; an upside-down zigzag is rejected', () => {
  assert.equal(classifyMotion(zPath().map(s => ({...s, y: -s.y})), 'Z'), null);
});

test('uneven sample density and a brief pause do not change the gesture', () => {
  for (const [label, original] of [['J', jPath()], ['Z', zPath()]] as const) {
    const path: MotionSample[] = [];
    for (let i = 0; i < original.length; i++) {
      const a = original[i]; path.push({...a, t: path.length * 35});
      if (i < 3) for (let j = 0; j < 4; j++) path.push({...a, t: path.length * 35});
    }
    assert.equal(classifyMotion(path, label)?.label, label);
  }
});

test('large depth/scale changes cannot masquerade as a traced sign', () => {
  assert.equal(classifyMotion(jPath().map((s, i) => ({...s, scale: i < 4 ? 1 : 3})), 'J'), null);
});
