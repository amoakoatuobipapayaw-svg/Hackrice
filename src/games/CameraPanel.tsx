import type { Recognition } from '../recognition/types';
import { RecognitionCamera } from './RecognitionCamera';

export function CameraPanel({ recognition: r, target, onStart, startLabel = 'Start camera', feedback }: {
  recognition: Recognition; target?: string; onStart?: () => void; startLabel?: string; feedback?: string | null;
}) {
  const running = r.status === 'running';
  const loading = r.status === 'loading';
  const message = feedback ?? (r.status === 'error' ? 'Let’s reconnect your camera.' : !running ? 'Your practice space is ready.' : !r.current ? 'Bring your whole hand into view.' : r.current.confidence < 0.8 ? 'Keep your fingers clear and steady.' : target && r.current.label !== target ? 'Adjust your hand to match the prompt.' : r.holdProgress >= 1 ? 'Confirmed! Release your hand for the next sign.' : 'That’s the shape. Hold for one second.');
  return <section className="overflow-hidden rounded-2xl border border-line bg-surface" aria-label="Camera practice">
    <div className="flex items-center justify-between px-5 py-4"><h2 className="font-bold">Your practice space</h2><span className={`flex items-center gap-2 text-xs font-semibold ${running ? 'text-brand' : 'text-muted'}`}><span className={`h-2 w-2 rounded-full ${running ? 'bg-brand' : 'bg-muted'}`} />{running ? 'Camera live' : loading ? 'Connecting' : 'Camera off'}</span></div>
    <div className="relative">
      <RecognitionCamera videoRef={r.videoRef} canvasRef={r.canvasRef} />
      {!running && <div className="absolute inset-0 flex flex-col items-center justify-center bg-canvas px-6 text-center">
        <svg aria-hidden="true" viewBox="0 0 64 64" className="mb-4 h-14 w-14 text-brand" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="17" width="34" height="30" rx="9" /><path d="m43 27 12-7v24l-12-7M20 27h12M20 36h6" /></svg>
        <p className="text-lg font-bold">{loading ? 'Getting your camera ready…' : 'This is your space to sign'}</p>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">{loading ? 'The first start may take a moment.' : 'Face the light and leave room for your whole hand.'}</p>
      </div>}
    </div>
    <div className="space-y-4 p-5">
      <div className="flex items-center justify-between gap-3"><div><p className="text-xs text-muted">Hand shape detected</p><p className="mt-1 text-2xl font-bold">{r.current?.label ?? '—'}</p></div><button type="button" disabled={loading} onClick={running ? r.stop : (onStart ?? r.start)} className="rounded-xl border border-brand bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-50">{loading ? 'Connecting…' : running ? 'Pause camera' : r.status === 'error' ? 'Retry camera' : startLabel}</button></div>
      <div><div className="mb-2 flex justify-between text-xs font-semibold text-muted"><span>Hold to confirm</span><span>{Math.round(r.holdProgress * 100)}%</span></div><progress aria-label="Hold to confirm" value={r.holdProgress} max={1} className="block h-2 w-full overflow-hidden rounded-full accent-brand" /></div>
      <p role="status" className="rounded-xl bg-soft px-4 py-3 text-sm leading-relaxed text-brand">{message}</p>
      {r.error && <p role="alert" className="text-sm text-danger">{r.error}</p>}
      <p className="text-xs leading-relaxed text-muted">Hand tracking runs on your device. Pausing releases the camera.</p>
    </div>
  </section>;
}
