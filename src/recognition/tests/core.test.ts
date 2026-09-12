/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHoldTracker } from '../holdTracker';
import { classifySign } from '../signClassifier';
import { geminiCoach } from '../geminiCoach';
import type { Landmark } from '../types';

const sign = {label:'L',confidence:0.9};
test('confirms after a full second once, then requires release', () => {
  const tracker = createHoldTracker();
  for(let t=0;t<1000;t+=100) assert.equal(tracker.update(sign,t).confirmed,null);
  assert.equal(tracker.update(sign,1000).confirmed?.label,'L');
  for(let t=1100;t<=3000;t+=100) assert.equal(tracker.update(sign,t).confirmed,null);
  tracker.update(null,3100);
  for(let t=3200;t<4200;t+=100) assert.equal(tracker.update(sign,t).confirmed,null);
  assert.equal(tracker.update(sign,4200).confirmed?.label,'L');
});
test('lost tracking, weak evidence and long gaps interrupt holds', () => {
  for(const interruption of [null, {label:'L',confidence:0.3}, {label:'L',confidence:NaN}]) {
    const tracker=createHoldTracker();
    for(let t=0;t<=900;t+=100) tracker.update(sign,t);
    tracker.update(interruption,1000);
    assert.equal(tracker.update(sign,1100).progress,0);
  }
  const tracker=createHoldTracker();
  tracker.update(sign,0);
  assert.equal(tracker.update(sign,5000).progress,0);
});
test('wrong signs never confirm the target and changing the target resets evidence', () => {
  const tracker=createHoldTracker();
  for(let t=0;t<2000;t+=100) assert.equal(tracker.update(sign,t,{target:'I'}).confirmed,null);
  for(let t=2000;t<3000;t+=100) tracker.update(sign,t,{target:'L'});
  assert.equal(tracker.update(sign,3000,{target:'I'}).progress,0);
  assert.equal(tracker.update(sign,3100,{target:'L'}).progress,0);
});

// Geometric fixtures verify rule behavior, not real-world ASL accuracy.
function hand(extended: boolean[], thumb = false): Landmark[] {
  const points: Landmark[] = Array.from({length:21},()=>({x:0.5,y:0.9,z:0}));
  const xs=[0.36,0.48,0.60,0.72];
  for(let finger=0;finger<4;finger++) {
    const base=5+finger*4, x=xs[finger];
    points[base]={x,y:0.6,z:0};
    points[base+1]={x,y:0.46,z:0};
    points[base+2]={x,y:extended[finger]?0.32:0.56,z:extended[finger]?0:-0.03};
    points[base+3]={x,y:extended[finger]?0.18:0.67,z:extended[finger]?0:-0.03};
  }
  points[1]={x:0.36,y:0.79,z:0};
  points[2]={x:0.29,y:0.71,z:0};
  points[3]=thumb?{x:0.17,y:0.67,z:0}:{x:0.37,y:0.66,z:0};
  points[4]=thumb?{x:0.05,y:0.63,z:0}:{x:0.43,y:0.7,z:0};
  return points;
}
test('L, I and Y survive horizontal mirroring, translation and scaling', () => {
  for(const [label,points] of [
    ['L',hand([true,false,false,false],true)],
    ['I',hand([false,false,false,true])],
    ['Y',hand([false,false,false,true],true)],
  ] as const) {
    assert.equal(classifySign(points)?.label,label);
    assert.equal(classifySign(points.map(p=>({...p,x:1-p.x})))?.label,label);
    assert.equal(classifySign(points.map(p=>({x:p.x*0.6+0.2,y:p.y*0.6+0.1,z:p.z*0.6})))?.label,label);
  }
});
test('letter and number vocabulary disambiguates V versus 2', () => {
  const points=hand([true,true,false,false]);
  // Increase finger spread without changing whether the fingers are straight.
  for(let i=9;i<=12;i++) points[i].x+=0.05;
  assert.equal(classifySign(points,{vocabulary:'letters'})?.label,'V');
  assert.equal(classifySign(points,{vocabulary:'numbers'})?.label,'2');
});
test('invalid or degenerate landmarks abstain', () => {
  assert.equal(classifySign([]),null);
  assert.equal(classifySign(Array.from({length:21},()=>({x:0,y:0,z:0}))),null);
  const points=hand([true,false,false,false],true); points[8].x=NaN;
  assert.equal(classifySign(points),null);
});
test('digits 1–5 depend on the thumb as well as extended fingers', () => {
  const cases: [string, boolean[], boolean][] = [
    ['1',[true,false,false,false],false],
    ['2',[true,true,false,false],false],
    ['3',[true,true,false,false],true],
    ['4',[true,true,true,true],false],
    ['5',[true,true,true,true],true],
  ];
  for(const [label,fingers,thumb] of cases) {
    assert.equal(classifySign(hand(fingers,thumb),{vocabulary:'numbers'})?.label,label);
  }
});
test('digits 6–9 require contact with the corresponding finger', () => {
  for(const [label,folded] of [['6',3],['7',2],['8',1],['9',0]] as const) {
    const fingers=[true,true,true,true]; fingers[folded]=false;
    const points=hand(fingers);
    points[4]={...points[8+folded*4],z:points[8+folded*4].z-0.02};
    assert.equal(classifySign(points,{vocabulary:'numbers'})?.label,label);
    assert.equal(classifySign(points.map(p=>({...p,x:1-p.x})),{vocabulary:'numbers'})?.label,label);
  }
});
test('extended thumb does not receive a confident V or W letter guess', () => {
  for(const fingers of [[true,true,false,false],[true,true,true,false]]) {
    const result=classifySign(hand(fingers,true));
    assert.ok(!result || result.confidence < 0.8);
  }
});
test('aspect ratio correction preserves the same hand geometry', () => {
  const points=hand([true,false,false,false],true);
  for(const aspect of [4/3,16/9,9/16]) {
    assert.equal(classifySign(points.map(p=>({...p,y:p.y*aspect})),{aspectRatio:aspect})?.label,'L');
  }
});
test('contact scores vary with geometry and near-misses cannot earn a rep', () => {
  const scores: number[]=[];
  for(const gap of [0.05,0.20,0.28]) {
    const points=hand([false,true,true,true]);
    const scale=Math.hypot(points[0].x-points[9].x,points[0].y-points[9].y);
    points[4]={...points[8],z:points[8].z-gap*scale};
    const result=classifySign(points,{vocabulary:'numbers'});
    assert.equal(result?.label,'9');
    scores.push(result!.confidence);
    if(gap===0.28) {
      const tracker=createHoldTracker();
      for(let t=0;t<=2000;t+=100) assert.equal(tracker.update(result,t,{target:'9'}).confirmed,null);
    }
  }
  assert.ok(scores[0]>scores[1] && scores[1]>scores[2]);
  assert.ok(scores[0]>=0.8 && scores[2]<0.8);
});
test('clear supported poses remain confirmable with bounded, nonconstant scores', () => {
  for(const [points,vocabulary] of [
    [hand([true,false,false,false],true),'letters'],
    [hand([false,false,false,true]),'letters'],
    [hand([true,true,true,true],true),'numbers'],
  ] as const) {
    const result=classifySign(points,{vocabulary});
    assert.ok(result && result.confidence>=0.8 && result.confidence<=1);
    assert.notEqual(result.confidence,0.85);
  }
});
test('coaching matches the existing API and rejects failures/malformed responses', async () => {
  const original=globalThis.fetch;
  try {
    globalThis.fetch=async (url,init) => {
      assert.equal(url,'/api/coach');
      assert.deepEqual(JSON.parse(String(init?.body)),{summary:'Index extended'});
      return new Response(JSON.stringify({line:'  Keep your hand visible.  '}));
    };
    assert.equal(await geminiCoach('Index extended'),'Keep your hand visible.');
    globalThis.fetch=async()=>new Response('No',{status:500});
    await assert.rejects(geminiCoach('Index extended'),/500/);
    globalThis.fetch=async()=>new Response(JSON.stringify({unexpected:true}));
    await assert.rejects(geminiCoach('Index extended'),/line/);
    await assert.rejects(geminiCoach(''),/summary/);
  } finally { globalThis.fetch=original; }
});
