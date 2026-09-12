import type { SignResult } from '../lib/contracts';
import type { Landmark, Vocabulary } from './types';

// J and Z are motion signs: same handshape as I and a bare index point,
// traced through a trajectory. Handled by motionClassifier.ts, which shares
// this file's CONFIDENCE_CAP table so promoting them after live testing
// works the same one-line way as every static letter below.
export const MOTION_SIGNS = ['J', 'Z'] as const;
const ALL_LETTERS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'] as const;
const ALL_NUMBERS = ['0','1','2','3','4','5','6','7','8','9'] as const;
// Confirmation needs a rule-match score >= CONFIRM_THRESHOLD (see holdTracker's
// default minConfidence). Single source of truth for every sign's cap: promoting
// a sign from experimental to demo-quality, once it's been tested live on a real
// webcam, is a one-line change here — bump its cap to 0.98 and it moves itself
// from EXPERIMENTAL_LETTERS to DEMO_LETTERS below without touching any call site.
// J and Z start at the same untested tier as any other never-live-tested sign;
// motionClassifier.ts's heuristic geometry has no live-camera validation either.
export const CONFIRM_THRESHOLD = 0.8;
export const CONFIDENCE_CAP: Record<string, number> = {
  I: 0.98, Y: 0.98, L: 0.98, V: 0.98, W: 0.98,
  F: 0.65, B: 0.65, D: 0.65, K: 0.65, P: 0.65, H: 0.65, O: 0.65, U: 0.65,
  Q: 0.6, G: 0.6, A: 0.6,
  R: 0.55, C: 0.55, X: 0.55,
  E: 0.5, T: 0.5, N: 0.5, M: 0.5, S: 0.5, J: 0.5, Z: 0.5,
  '1': 0.98, '2': 0.98, '3': 0.98, '4': 0.98, '5': 0.98,
  '6': 0.98, '7': 0.98, '8': 0.98, '9': 0.98, '0': 0.65,
};
export const DEFAULT_CAP = 0.65;
export const DEMO_LETTERS = ALL_LETTERS.filter(l => (CONFIDENCE_CAP[l] ?? DEFAULT_CAP) >= CONFIRM_THRESHOLD);
export const EXPERIMENTAL_LETTERS = ALL_LETTERS.filter(l => (CONFIDENCE_CAP[l] ?? DEFAULT_CAP) < CONFIRM_THRESHOLD);
export const DEMO_NUMBERS = ALL_NUMBERS.filter(n => (CONFIDENCE_CAP[n] ?? DEFAULT_CAP) >= CONFIRM_THRESHOLD);
export const EXPERIMENTAL_NUMBERS = ALL_NUMBERS.filter(n => (CONFIDENCE_CAP[n] ?? DEFAULT_CAP) < CONFIRM_THRESHOLD);
const distance = (a: Landmark, b: Landmark) => Math.hypot(a.x-b.x, a.y-b.y, a.z-b.z);
export const ramp = (value: number, low: number, high: number) =>
  Math.max(0, Math.min(1, (value-low)/(high-low)));
function angle(a: Landmark, b: Landmark, c: Landmark) {
  const u = [a.x-b.x, a.y-b.y, a.z-b.z];
  const v = [c.x-b.x, c.y-b.y, c.z-b.z];
  const denominator = Math.hypot(...u) * Math.hypot(...v);
  return denominator < 1e-8 ? 0 : Math.acos(Math.max(-1, Math.min(1,
    u.reduce((sum, value, i) => sum + value*v[i], 0) / denominator))) * 180 / Math.PI;
}

export type HandFrame = {
  p: readonly Landmark[];
  scale: number;
  d(a: number, b: number): number;
  straight: readonly [boolean, boolean, boolean, boolean];
  extension: readonly number[];
  thumbOut: boolean;
  thumbEvidence: number;
  contact: readonly [boolean, boolean, boolean, boolean];
  rounded: boolean;
};

/** Shared per-frame hand geometry, reused by classifySign (static shapes) and
 * motionClassifier.ts (which handshape is a candidate for a motion sign, plus
 * the scale used to normalize a trajectory across distance from the camera). */
export function computeHandFrame(points: readonly Landmark[], aspectRatio = 1): HandFrame | null {
  if (!Array.isArray(points) || points.length !== 21 || points.some(p => !p || ![p.x,p.y,p.z].every(Number.isFinite))) return null;
  if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) return null;
  // MediaPipe x/z use image-width units; convert y to the same metric.
  const p = points.map(point => ({ ...point, y: point.y / aspectRatio }));
  const scale = distance(p[0], p[9]);
  if (scale < 0.025 || distance(p[5],p[17]) < 0.015) return null;
  const d = (a: number, b: number) => distance(p[a],p[b])/scale;
  const bases = [5,9,13,17];
  const straight = bases.map(b => angle(p[b],p[b+1],p[b+3]) > 155 &&
    angle(p[b+1],p[b+2],p[b+3]) > 150 && d(b+3,0) > d(b+1,0)*1.08) as [boolean, boolean, boolean, boolean];
  // Continuous evidence exposes borderline joints instead of treating every
  // non-straight finger as a confidently folded finger.
  const extension = bases.map(b => Math.min(
    ramp(angle(p[b],p[b+1],p[b+3]),125,175),
    ramp(angle(p[b+1],p[b+2],p[b+3]),120,170),
    ramp(d(b+3,0)/Math.max(d(b+1,0),0.01),0.95,1.3),
  ));
  const thumbOut = angle(p[2],p[3],p[4]) > 150 && d(4,17) > 1.25 && d(4,5) > 0.65;
  const thumbEvidence = Math.min(ramp(angle(p[2],p[3],p[4]),120,170),
    ramp(d(4,17),0.9,1.5),ramp(d(4,5),0.35,0.85));
  const contact = [8,12,16,20].map(tip => d(4,tip) < 0.30) as [boolean, boolean, boolean, boolean];
  const rounded = !straight.some(Boolean) && bases.every(b => angle(p[b],p[b+1],p[b+3]) > 65);
  return { p, scale, d, straight, extension, thumbOut, thumbEvidence, contact, rounded };
}

/** Heuristic match scores, NOT calibrated probabilities or ASL proficiency scores.
 * Pass letters/numbers from game mode, never the desired answer as a candidate filter.
 * Raw (unmirrored) MediaPipe image coordinates are expected.
 */
export function classifySign(points: readonly Landmark[], options: {
  vocabulary?: Vocabulary; aspectRatio?: number;
} = {}): SignResult | null {
  const frame = computeHandFrame(points, options.aspectRatio ?? 1);
  if (!frame) return null;
  const { p, d, straight, extension, thumbOut, thumbEvidence, contact, rounded } = frame;
  const [index,middle,ring,pinky] = straight;
  const match = (label: string, extra: number[] = [], touching?: number): SignResult => {
    const evidence = extension.flatMap((value,i) => i === touching ? [] : [straight[i] ? value : 1-value]);
    if (['1','2','3','4','5','I','Y','L','V','W'].includes(label)) {
      evidence.push(thumbOut ? thumbEvidence : 1-thumbEvidence);
    }
    const weakest = Math.min(...evidence,...extra);
    const cap = CONFIDENCE_CAP[label] ?? DEFAULT_CAP;
    // This remains an uncalibrated geometric match, never an accuracy estimate.
    return {label,confidence:Math.min(cap,0.45+0.53*weakest)};
  };
  const contactEvidence = (finger: number) => 1-ramp(d(4,8+finger*4),0.12,0.40);
  if (options.vocabulary === 'numbers') {
    if (contact[3] && index && middle && ring) return match('6',[contactEvidence(3)],3);
    if (contact[2] && index && middle && pinky) return match('7',[contactEvidence(2)],2);
    if (contact[1] && index && ring && pinky) return match('8',[contactEvidence(1)],1);
    if (contact[0] && middle && ring && pinky) return match('9',[contactEvidence(0)],0);
    if (rounded && contact[0]) return match('0');
    if (index && middle && ring && pinky) return match(thumbOut ? '5' : '4');
    if (index && middle && !ring && !pinky) return match(thumbOut ? '3' : '2');
    if (index && !middle && !ring && !pinky && !thumbOut) return match('1');
    return null;
  }
  if (contact[0] && middle && ring && pinky) return match('F');
  if (!index && !middle && !ring && pinky) return match(thumbOut ? 'Y' : 'I');
  if (index && middle && ring && !pinky && !thumbOut) return match('W');
  if (index && middle && ring && pinky && !thumbOut &&
      d(8,12) < 0.4 && d(12,16) < 0.4 && d(16,20) < 0.4) return match('B');
  const dx = p[8].x-p[5].x, dy = p[8].y-p[5].y;
  const horizontal = Math.abs(dx) > Math.abs(dy)*1.5;
  const downward = dy > Math.abs(dx)*0.7;
  if (index && !middle && !ring && !pinky) {
    if (thumbOut) return match(downward ? 'Q' : horizontal ? 'G' : 'L',
      !horizontal && !downward ? [ramp(-dy/(Math.abs(dx)+Math.abs(dy)+1e-8),0.35,0.85)] : []);
    if (contact[1]) return match('D');
    return null; // Index-only shape is ambiguous without more thumb evidence.
  }
  if (index && middle && !ring && !pinky) {
    if (thumbOut && d(4,10) < 0.65) return match(downward ? 'P' : 'K');
    if (thumbOut) return null; // An extended thumb is not the U/V hand shape.
    if (horizontal) return match('H');
    const tipDelta = p[8].x-p[12].x, baseDelta = p[5].x-p[9].x;
    if (tipDelta*baseDelta < 0) return match('R');
    return match(d(8,12) > 0.4 ? 'V' : 'U',
      d(8,12) > 0.4 ? [ramp(d(8,12),0.32,0.65)] : []);
  }
  if (rounded) {
    if (contact[0]) return match('O');
    if (d(4,8) > 0.35 && d(4,8) < 1.0) return match('C');
  }
  if (!straight.some(Boolean)) {
    if (d(8,0) > d(6,0) && angle(p[5],p[6],p[8]) > 70) return match('X');
    // Occluded thumb placement is inherently weak in a single camera view.
    const axis = {x:p[17].x-p[5].x,y:p[17].y-p[5].y,z:p[17].z-p[5].z};
    const project = (i: number) => ((p[i].x-p[5].x)*axis.x + (p[i].y-p[5].y)*axis.y +
      (p[i].z-p[5].z)*axis.z) / distance(p[17],p[5])**2;
    const thumb = project(4);
    if (thumb < -0.12) return match('A');
    if ([8,12,16,20].every(tip => d(tip,4)<0.55)) return match('E');
    if (p[4].z > (p[8].z+p[12].z)/2) {
      return match(thumb < project(9) ? 'T' : thumb < project(13) ? 'N' : 'M');
    }
    return match('S');
  }
  return null;
}

export { classifySign as signClassifier };
