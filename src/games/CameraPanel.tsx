import { useEffect } from 'react';
import type { Recognition } from '../recognition/types';
import { Icon } from '../components/ui/Icon';
import { playCorrectChime } from '../lib/sfx';
import { RecognitionCamera } from './RecognitionCamera';

export function CameraPanel({ recognition: r, target, onStart, startLabel = 'Start camera', feedback, celebrate }: {
  recognition: Recognition; target?: string; onStart?: () => void; startLabel?: string; feedback?: string | null;
  /** Bump this (e.g. a counter you increment) each time a sign or answer is
   * confirmed, to trigger a brief checkmark pop + chime over the camera. */
  celebrate?: number;
}) {
  useEffect(() => {
    if (celebrate) playCorrectChime();
  }, [celebrate]);

  const running = r.status === 'running';
  const loading = r.status === 'loading';
  const message = feedback ?? (r.status === 'error' ? 'Let’s reconnect your camera.' : !running ? 'Your practice space is ready.' : !r.current ? 'Bring your whole hand into view.' : r.current.confidence < 0.8 ? 'Keep your fingers clear and steady.' : target && r.current.label !== target ? 'Adjust your hand to match the prompt.' : r.holdProgress >= 1 ? 'Confirmed! Release your hand for the next sign.' : 'That’s the shape. Hold for one second.');
  return <section className="overflow-hidden rounded-2xl border-2 border-line bg-surface" aria-label="Camera practice">
    <div className="flex items-center justify-between px-5 py-4"><h2 className="font-extrabold">Your practice space</h2><span className={`flex items-center gap-2 text-xs font-semibold ${running ? 'text-brand' : 'text-muted'}`}><span className={`h-2 w-2 rounded-full ${running ? 'bg-brand' : 'bg-muted'}`} />{running ? 'Camera live' : loading ? 'Connecting' : 'Camera off'}</span></div>
    <div className="relative">
      <RecognitionCamera videoRef={r.videoRef} canvasRef={r.canvasRef} />
      {!running && <div className="absolute inset-0 flex flex-col items-center justify-center bg-canvas px-6 text-center">
        <span aria-hidden="true" className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand"><Icon name="video" size={32} strokeWidth={1.75} /></span>
        <p className="text-lg font-extrabold">{loading ? 'Getting your camera ready…' : 'This is your space to sign'}</p>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">{loading ? 'The first start may take a moment.' : 'Face the light and leave room for your whole hand.'}</p>
      </div>}
      {celebrate ? <span key={celebrate} aria-hidden="true" className="animate-pop pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-success text-white shadow-lg"><Icon name="check" size={40} strokeWidth={3} /></span>
      </span> : null}
    </div>
    <div className="space-y-4 p-5">
      <div className="flex items-center justify-between gap-3"><div><p className="text-xs text-muted">Hand shape detected</p><p className="mt-1 text-2xl font-black">{r.current?.label ?? '—'}</p></div><button type="button" disabled={loading} onClick={running ? r.stop : (onStart ?? r.start)} className="rounded-xl border-2 border-b-4 border-brand-hover bg-brand px-5 py-3 text-sm font-extrabold text-white hover:bg-brand-hover active:translate-y-0.5 active:border-b-2 focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-50 disabled:active:translate-y-0">{loading ? 'Connecting…' : running ? 'Pause camera' : r.status === 'error' ? 'Retry camera' : startLabel}</button></div>
      <div><div className="mb-2 flex justify-between text-xs font-semibold text-muted"><span>Hold to confirm</span><span>{Math.round(r.holdProgress * 100)}%</span></div><div role="progressbar" aria-label="Hold to confirm" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(r.holdProgress * 100)} className="h-2.5 w-full overflow-hidden rounded-full bg-soft"><div className="h-full rounded-full bg-success transition-[width] duration-150 motion-reduce:transition-none" style={{ width: `${Math.round(r.holdProgress * 100)}%` }} /></div></div>
      <p role="status" className="rounded-xl bg-soft px-4 py-3 text-sm leading-relaxed text-brand">{message}</p>
      {r.error && <p role="alert" className="text-sm text-danger">{r.error}</p>}
      <p className="text-xs leading-relaxed text-muted">Hand tracking runs on your device. Pausing releases the camera.</p>
    </div>
  </section>;
}
