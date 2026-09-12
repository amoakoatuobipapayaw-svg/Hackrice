const GUIDES: Record<string, { name: string; steps: string[] }> = {
  I: { name: 'A little finger. A big first step.', steps: ['Make a loose fist with your palm facing the camera.', 'Extend your little finger. Keep your other fingers folded.', 'Rest your thumb across the folded fingers.'] },
  L: { name: 'Make room for your L.', steps: ['Point your index finger up.', 'Extend your thumb sideways to form an L.', 'Keep your middle, ring, and little fingers folded.'] },
  V: { name: 'Find your V.', steps: ['Extend your index and middle fingers.', 'Spread them apart into a V.', 'Fold your ring and little fingers with your thumb tucked.'] },
  W: { name: 'Three fingers, one new sign.', steps: ['Extend your index, middle, and ring fingers.', 'Spread them comfortably apart.', 'Keep your little finger folded and your thumb tucked.'] },
  Y: { name: 'Stretch into a Y.', steps: ['Extend your thumb and little finger.', 'Fold your index, middle, and ring fingers.', 'Keep your hand upright and fully in view.'] },
};

export function SignGuide({ target, completed = 0, targets = [] }: { target: string; completed?: number; targets?: readonly string[] }) {
  const guide = GUIDES[target];
  return <section className="flex h-full flex-col rounded-3xl border border-slate-700 bg-slate-900 p-6 sm:p-8" aria-label={`Guide for ${target}`}>
    <div className="flex items-center justify-between"><span className="text-xs font-bold tracking-widest text-violet-300 uppercase">Your next hand shape</span><span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">ASL · One hand</span></div>
    <div className="my-6 flex items-center justify-center gap-6 rounded-3xl border border-violet-400/20 bg-violet-500/10 py-7">
      <span className="text-[100px] leading-none font-black tracking-tight text-violet-200 sm:text-[120px]">{target}</span>
      <div className="max-w-28 text-sm leading-relaxed text-violet-200">Shape it.<br />Hold it.<br /><span className="font-bold text-emerald-300">You’ve got this.</span></div>
    </div>
    <h2 className="text-xl font-bold">{guide?.name ?? 'Keep your hand in view.'}</h2>
    <ol className="mt-5 space-y-4">{guide?.steps.map((step, i) => <li key={step} className="flex gap-3 text-sm leading-relaxed text-slate-300"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-violet-200">{i + 1}</span>{step}</li>)}</ol>
    {targets.length > 0 && <div className="mt-auto pt-7"><p className="mb-3 text-xs font-bold tracking-widest text-slate-400 uppercase">Your five-sign journey</p><ol className="flex gap-2" aria-label="Lesson steps">{targets.map((letter, i) => <li key={i} aria-current={i === completed ? 'step' : undefined} aria-label={`${letter}: ${i < completed ? 'complete' : i === completed ? 'current' : 'up next'}`} className={`flex h-11 flex-1 items-center justify-center rounded-xl border-2 text-sm font-bold ${i < completed ? 'border-emerald-400 bg-emerald-400 text-slate-950' : i === completed ? 'border-violet-400 bg-violet-500/20 text-white' : 'border-slate-700 text-slate-400'}`}>{i < completed ? '✓' : letter}</li>)}</ol></div>}
  </section>;
}
