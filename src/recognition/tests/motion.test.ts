/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyMotion, createMotionTracker, motionCandidateShape, type MotionSample } from '../motionClassifier';
import { type HandFrame } from '../signClassifier';

// Synthetic trajectories verify geometry and lifecycle, not live ASL accuracy.

/** A straight-down-then-rightward hook, in the shape of a traced "J". */
function jPath(): MotionSample[] {
  const samples: MotionSample[] = [];
  for (let i = 0; i <= 4; i++) samples.push({ x: 0, y: i * 0.3, t: i * 60, scale: 1 });
  for (let i = 1; i <= 4; i++) samples.push({ x: i * 0.3, y: 1.2 - i * 0.08, t: 240 + i * 60, scale: 1 });
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

test('a traced J is recognized, with a geometric completion score', () => {
  const result = classifyMotion(jPath(), 'J');
  assert.equal(result?.label, 'J');
  assert.ok(result && result.confidence > 0 && result.confidence >= 0.8 && result.confidence <= 0.97);
});

test('a traced J survives horizontal mirroring and uniform scaling', () => {
  const mirrored = jPath().map(s => ({ ...s, x: -s.x }));
  assert.equal(classifyMotion(mirrored, 'J')?.label, 'J');
  const scaled = jPath().map(s => ({ ...s, x: s.x * 2, y: s.y * 2, scale: s.scale * 2 }));
  assert.equal(classifyMotion(scaled, 'J')?.label, 'J');
});

test('a traced Z is recognized, with a geometric completion score', () => {
  const result = classifyMotion(zPath(), 'Z');
  assert.equal(result?.label, 'Z');
  assert.ok(result && result.confidence > 0 && result.confidence >= 0.8 && result.confidence <= 0.97);
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

test('an incomplete J sweep or partial Z does not complete', () => {
  assert.equal(classifyMotion(jPath().map(s=>({...s,y:Math.min(s.y, 1.0)})).slice(0,5), 'J'),null);
  assert.equal(classifyMotion(zPath().slice(0,7),'Z'),null);
  const sweep=jPath().map((s,i)=>({...s,y:i<=4?s.y:1.2}));
  assert.equal(classifyMotion(sweep,'J'),null);
});

test('stream emits once, tolerates finger blur and requires release', () => {
  const tracker=createMotionTracker();
  function frame(sample:MotionSample, shape=true) {
    const f=fakeFrame({straight:shape?[false,false,false,true]:[false,false,false,false]});
    f.p=Array.from({length:21},()=>({x:sample.x,y:sample.y,z:0})); return f;
  }
  const origin={x:0,y:0,t:0,scale:1};
  tracker.update(frame(origin),0);tracker.update(frame(origin),60);
  let results=0;
  jPath().forEach((s,i)=>{if(tracker.update(frame(s,i!==5),s.t+120))results++;});
  assert.equal(results,1);
  jPath().forEach(s=>{if(tracker.update(frame(s),s.t+660))results++;});
  assert.equal(results,1);
  tracker.reset();
  assert.equal(tracker.update(null,2000),null);
});
