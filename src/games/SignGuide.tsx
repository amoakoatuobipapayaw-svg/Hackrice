import { Icon } from '../components/ui/Icon';

const GUIDES: Record<string, { name: string; steps: string[] }> = {
  I: { name: 'How to sign I', steps: ['Make a loose fist with your palm facing the camera.', 'Extend your little finger. Keep your other fingers folded.', 'Rest your thumb across the folded fingers.'] },
  L: { name: 'How to sign L', steps: ['Point your index finger up.', 'Extend your thumb sideways to form an L.', 'Keep your middle, ring, and little fingers folded.'] },
  V: { name: 'How to sign V', steps: ['Extend your index and middle fingers.', 'Spread them apart into a V.', 'Fold your ring and little fingers with your thumb tucked.'] },
  W: { name: 'How to sign W', steps: ['Extend your index, middle, and ring fingers.', 'Spread them comfortably apart.', 'Keep your little finger folded and your thumb tucked.'] },
  Y: { name: 'How to sign Y', steps: ['Extend your thumb and little finger.', 'Fold your index, middle, and ring fingers.', 'Keep your hand upright and fully in view.'] },
};

export function SignGuide({ target, completed = 0, targets = [] }: { target: string; completed?: number; targets?: readonly string[] }) {
  const guide = GUIDES[target];
  return <section className="flex h-full flex-col rounded-2xl border-2 border-line bg-surface p-6 sm:p-8" aria-label={`Guide for ${target}`}>
    <div className="flex items-center justify-between"><span className="text-xs font-extrabold tracking-widest text-brand uppercase">Your next hand shape</span><span className="rounded-full bg-soft px-3 py-1 text-xs font-bold text-muted">ASL · One hand</span></div>
    <div className="my-6 flex items-center justify-center gap-8 rounded-2xl bg-soft py-7">
      <span className="flex h-32 w-28 -rotate-2 flex-col items-center justify-center rounded-2xl border-b-8 border-brand-hover bg-brand text-[88px] leading-none font-black tracking-tight text-white shadow-md sm:h-36 sm:w-32 sm:text-[100px]">{target}<span className="mt-1 text-[10px] font-bold tracking-widest text-white/70">ASL</span></span>
      <div className="max-w-28 text-sm leading-relaxed text-brand">Shape it.<br />Hold it.<br /><span className="font-bold text-brand">You’ve got this.</span></div>
    </div>
    <h2 className="text-xl font-extrabold">{guide?.name ?? 'Keep your hand in view.'}</h2>
    <ol className="mt-5 space-y-4">{guide?.steps.map((step, i) => <li key={step} className="flex gap-3 text-sm leading-relaxed text-muted"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-extrabold text-brand">{i + 1}</span>{step}</li>)}</ol>
    {targets.length > 0 && <div className="mt-auto pt-7"><p className="mb-3 text-xs font-extrabold tracking-widest text-muted uppercase">Your five-sign journey</p><ol className="flex gap-2" aria-label="Lesson steps">{targets.map((letter, i) => <li key={i} aria-current={i === completed ? 'step' : undefined} aria-label={`${letter}: ${i < completed ? 'complete' : i === completed ? 'current' : 'up next'}`} className={`flex h-11 flex-1 items-center justify-center rounded-xl border-2 text-sm font-bold ${i < completed ? 'border-brand bg-brand text-white' : i === completed ? 'border-brand bg-soft text-ink' : 'border-line text-muted'}`}>{i < completed ? <Icon name="check" size={18} strokeWidth={3} /> : letter}</li>)}</ol></div>}
  </section>;
}
