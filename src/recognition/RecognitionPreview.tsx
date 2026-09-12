import { useEffect, useRef, useState } from 'react';
import { useSignRecognition } from './useSignRecognition';
import { useMockSignRecognition } from './mock';
import type { Recognition, Vocabulary } from './types';
import { loadHandLandmarker } from './handLandmarker';
import { DEMO_LETTERS, EXPERIMENTAL_LETTERS } from './signClassifier';

function ModelCheck() {
  const generation = useRef(0);
  const [message,setMessage] = useState('');
  useEffect(() => () => { generation.current++; }, []);
  function check() {
    const id=++generation.current;
    setMessage('Loading model…');
    void loadHandLandmarker().then(model => {
      model.close();
      if (id===generation.current) setMessage('Hand-tracking model ready.');
    }).catch(error => {
      if (id===generation.current) setMessage(error instanceof Error ? error.message : 'Model unavailable.');
    });
  }
  return <div>
    <button className="rounded border px-3 py-2" onClick={check} disabled={message==='Loading model…'}>
      Check hand-tracking model (no camera)
    </button>
    <p aria-live="polite">{message}</p>
  </div>;
}

function CameraDemo() {
  const [vocabulary,setVocabulary] = useState<Vocabulary>('letters');
  const [target,setTarget] = useState('L');
  const [coaching,setCoaching] = useState(false);
  const [experimental,setExperimental] = useState(false);
  const { videoRef, canvasRef, ...recognition } = useSignRecognition({target,vocabulary,coaching});
  return <>
    <p>Allow the webcam when prompted. Hold your full hand in view with good lighting.</p>
    <label>Sign set <select value={vocabulary} onChange={event => {
      const next = event.target.value as Vocabulary; setVocabulary(next); setTarget(next === 'letters' ? 'L' : '1');
    }}><option value="letters">Letters</option><option value="numbers">Numbers</option></select></label>
    {' '}<label>Target <select value={target} onChange={event => setTarget(event.target.value)}>
      {(vocabulary === 'letters'
        ? experimental ? [...DEMO_LETTERS,...EXPERIMENTAL_LETTERS].sort() : DEMO_LETTERS
        : experimental ? ['0','1','2','3','4','5','6','7','8','9'] : ['1','2','3','4','5','6','7','8','9']).map(label =>
        <option key={label}>{label}</option>)}
    </select></label>
    <label className="block"><input type="checkbox" checked={experimental} onChange={event => {
      setExperimental(event.target.checked);
      setTarget(vocabulary === 'letters' ? 'L' : '1');
    }} /> Show experimental targets (for inspecting guesses; scoring threshold stays unchanged)</label>
    <div className="relative my-4 aspect-[4/3] max-w-2xl overflow-hidden rounded-xl bg-slate-950">
      <video ref={videoRef} muted playsInline className="h-full w-full -scale-x-100" />
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100" />
    </div>
    <label><input type="checkbox" checked={coaching} onChange={event => setCoaching(event.target.checked)} />
      {' '}Enable AI coaching (sends hand coordinates to the team’s server every five seconds)</label>
    <Readout recognition={recognition} target={target} />
    <p>Prototype rules, not validated ASL assessment. J/Z and word signs are not supported.
      Other letter guesses are experimental and do not earn reps at the default threshold.</p>
  </>;
}

function MockDemo() {
  const { current, status, start, stop, reset, confirmed, correctReps, holdProgress, error, coachingLine } = useMockSignRecognition();
  const recognition = { current, status, start, stop, reset, confirmed, correctReps, holdProgress, error, coachingLine };
  return <><p>No camera needed. Cycles A, B, THANK YOU, 1, and 5, with a release between signs.</p>
    <Readout recognition={recognition} /></>;
}

function Readout({recognition:r,target}: {recognition:Omit<Recognition, 'videoRef' | 'canvasRef'>; target?:string}) {
  const feedback = r.status === 'idle' ? 'Press Start to begin.'
    : r.status === 'loading' ? 'Starting camera and hand tracking…'
    : r.status === 'error' ? 'Resolve the error below, then press Start to retry.'
    : !r.current ? 'No confident sign guess yet. Keep your whole hand visible.'
    : r.current.confidence < 0.8 ? `The ${r.current.label} guess is too weak to confirm (80% required).`
    : target && r.current.label !== target ? `Detected ${r.current.label}; the target is ${target}.`
    : r.holdProgress === 1 ? 'Confirmed. Release or change your sign before another rep.'
    : 'Keep this sign steady for one full second.';
  return <section className="my-4 space-y-3">
    <div className="flex gap-3">
      <button className="rounded bg-emerald-700 px-4 py-2 text-white" onClick={r.start}
        disabled={r.status==='running'||r.status==='loading'}>Start</button>
      <button className="rounded border px-4 py-2" onClick={r.stop}>Stop</button>
      <button className="rounded border px-4 py-2" onClick={r.reset}>Reset reps</button>
    </div>
    <p>Status: {r.status} · Guess: <strong>{r.current?.label ?? '—'}</strong>
      {' '}· Rule match: {r.current ? `${Math.round(r.current.confidence*100)}%` : '—'}</p>
    <p className="text-sm">Rule match measures hand geometry, not recognition accuracy. Borderline poses score lower.</p>
    <label>Hold to confirm <progress className="w-full" value={r.holdProgress} max={1} /></label>
    <p aria-live="polite">{feedback}</p>
    <p aria-live="polite">Confirmed reps: {r.correctReps} · Last confirmed: {r.confirmed?.label ?? '—'}</p>
    {r.error && <p role="alert">{r.error}</p>}
    {r.coachingLine && <p aria-live="polite">{r.coachingLine}</p>}
  </section>;
}

export function RecognitionPreview() {
  const [mock,setMock] = useState(true);
  return <main className="mx-auto min-h-screen max-w-3xl space-y-4 bg-slate-50 p-6 font-sans text-slate-900">
    <h1 className="text-3xl font-bold">SignQuest · Recognition lab</h1>
    <p>Start with the mock to check scoring, then try the webcam.</p>
    <ModelCheck />
    <label><input type="checkbox" checked={mock} onChange={event => setMock(event.target.checked)} /> Mock mode</label>
    {mock ? <MockDemo /> : <CameraDemo />}
  </main>;
}
