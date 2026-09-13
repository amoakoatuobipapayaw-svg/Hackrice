import type { SignResult } from '../lib/contracts';
import type { HandFrame } from './signClassifier';
export type MotionSample = { x: number; y: number; t: number; scale: number };
export type MotionLetter = 'J' | 'Z';

export function motionCandidateShape(f: HandFrame): MotionLetter | null {
  const [i,m,r,p] = f.straight;
  if (!i && !m && !r && p && !f.thumbOut) return 'J';
  if (i && !m && !r && !p && !f.thumbOut && !f.contact[1]) return 'Z';
  return null;
}

/** Remove tiny jitter in palm-length units. Stroke boundaries are searched,
 * never assumed to occur at equal times or equal sample counts. */
function path(samples: readonly MotionSample[]) {
  const scale = samples.map(s=>s.scale).sort((a,b)=>a-b)[Math.floor(samples.length/2)];
  const points = [{x:0,y:0}];
  for (const s of samples.slice(1)) {
    const p = {x:(s.x-samples[0].x)/scale, y:(s.y-samples[0].y)/scale};
    const last = points[points.length-1];
    if (Math.hypot(p.x-last.x,p.y-last.y) >= 0.055) points.push(p);
  }
  // Bound the corner search even if this API is fed high-frequency samples.
  return points.filter((_,i)=>i===points.length-1 || i % Math.max(1,Math.ceil(points.length/48))===0);
}
type Point = {x:number;y:number};
function leg(p: Point[], a:number,b:number) {
  const x=p[b].x-p[a].x,y=p[b].y-p[a].y, length=Math.hypot(x,y);
  let travel=0;
  for(let i=a+1;i<=b;i++) travel+=Math.hypot(p[i].x-p[i-1].x,p[i].y-p[i-1].y);
  return {x,y,length, efficiency:travel ? length/travel : 0};
}
export function classifyMotion(samples: readonly MotionSample[], candidate:string):SignResult|null {
  if ((candidate!=='J' && candidate!=='Z') || samples.length<5) return null;
  if (!samples.every(s=>[s.x,s.y,s.t,s.scale].every(Number.isFinite)&&s.scale>0)) return null;
  const duration=samples.at(-1)!.t-samples[0].t;
  if(duration<200 || duration>4500) return null;
  for(let i=1;i<samples.length;i++) if(samples[i].t<=samples[i-1].t || samples[i].t-samples[i-1].t>250) return null;
  const scales=samples.map(s=>s.scale);
  if(Math.max(...scales)/Math.min(...scales)>1.8) return null;
  const p=path(samples), end=p.length-1;
  let quality=0;
  // Loosened from the original synthetic-fixture-only thresholds: real
  // camera tracking is jitterier and less directionally clean than a
  // perfect piecewise-linear test path, so efficiency/distance floors here
  // are deliberately more forgiving than what first shipped untested.
  for(let a=1;a<end;a++) {
    const first=leg(p,0,a);
    if(candidate==='J') {
      const hook=leg(p,a,end);
      // Descend, then turn sideways and rise. An L-shaped sweep is incomplete.
      if(first.y<0.22 || Math.abs(first.x)>first.y*1.0 || first.efficiency<0.42) continue;
      if(Math.abs(hook.x)<0.11 || hook.y> -0.03 || hook.efficiency<0.3) continue;
      quality=Math.max(quality,Math.min(first.efficiency,hook.efficiency));
    } else {
      if(Math.abs(first.x)<0.18 || Math.abs(first.y)>Math.abs(first.x)*0.65 || first.efficiency<0.42) continue;
      for(let b=a+1;b<end;b++) {
        const diagonal=leg(p,a,b),last=leg(p,b,end);
        if(diagonal.y<0.14 || Math.abs(diagonal.x)<0.14 || diagonal.x*first.x>=0 || diagonal.efficiency<0.38) continue;
        if(Math.abs(last.x)<0.18 || last.x*first.x<=0 || Math.abs(last.y)>Math.abs(last.x)*0.65 || last.efficiency<0.42) continue;
        quality=Math.max(quality,Math.min(first.efficiency,diagonal.efficiency,last.efficiency));
      }
    }
  }
  // Baseline raised so any pass of the gates above already clears the
  // default 0.8 hold-to-confirm floor — the gates themselves are now the
  // real quality filter, so confidence no longer needs to scale as
  // punishingly with efficiency to avoid confirming a weak match.
  return quality ? {label:candidate, confidence:Math.min(0.97,0.82+quality*0.15)} : null;
}

/** An optional trained scorer, tried before the geometric heuristic below.
 * Injected rather than imported so this file stays free of any dependency
 * on the ML model/loader — a caller with no model (or a load failure) simply
 * never passes one, and every gesture is scored exactly as it always was. */
export type MotionScorer = (samples: readonly MotionSample[], candidate: MotionLetter) => SignResult | null;

/** Seed with a stable pose, then tolerate finger flexion during rotation.
 * Completion is a single event. A release is required before rearming. */
export function createMotionTracker() {
  let candidate:MotionLetter|null=null, seed:MotionLetter|null=null, seedCount=0;
  let samples:MotionSample[]=[], lastTime=-Infinity, missingSince:number|null=null;
  let locked=false;
  const reset=()=>{candidate=null;seed=null;seedCount=0;samples=[];lastTime=-Infinity;missingSince=null;locked=false;};
  return { reset, update(frame:HandFrame|null, now:number, score?:MotionScorer):SignResult|null {
    if(!Number.isFinite(now)) { reset();return null; }
    if(now<=lastTime || now-lastTime>250) reset();
    lastTime=now;
    const shape=frame ? motionCandidateShape(frame):null;
    if(!shape) { missingSince ??=now; } else { missingSince=null; }
    if(locked) {
      if(missingSince!==null && now-missingSince>=300) reset();
      return null;
    }
    if(!candidate) {
      if(!shape || !frame) { seed=null;seedCount=0;return null; }
      if(shape!==seed) {seed=shape;seedCount=0;}
      if(++seedCount<3) return null;
      candidate=shape;samples=[];
    }
    // Grace period widened from 400ms: a brief natural pause or momentary
    // tracking blur between locking the seed and starting the stroke (or
    // mid-stroke) shouldn't throw away an otherwise-good attempt.
    if(!frame || (shape && shape!==candidate) || (missingSince!==null && now-missingSince>900)) {
      candidate=null;samples=[];seedCount=0;return null;
    }
    const tip=frame.p[candidate==='J'?20:8];
    if(!tip || !Number.isFinite(frame.scale) || frame.scale<=0) { reset();return null; }
    const sample={x:tip.x,y:tip.y,t:now,scale:frame.scale};
    if(samples.length && now-samples[0].t>4500) samples=[];
    // Drop stationary lead-in so waiting to begin doesn't consume the window.
    if(samples.length===1 && Math.hypot(sample.x-samples[0].x,sample.y-samples[0].y)<sample.scale*0.055) samples=[];
    samples.push(sample);
    const result=score?.(samples,candidate) ?? classifyMotion(samples,candidate);
    if(result) {locked=true;samples=[];}
    return result;
  }};
}
