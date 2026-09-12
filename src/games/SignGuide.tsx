import { Icon } from '../components/ui/Icon';

const GUIDES: Record<string, { name: string; steps: string[] }> = {
  A: { name: 'How to sign A', steps: ['Make a fist with your palm facing the camera.', 'Rest your thumb alongside your fist, not across it.', 'Keep your wrist steady and upright.'] },
  B: { name: 'How to sign B', steps: ['Hold your four fingers straight up, touching.', 'Fold your thumb flat across your palm.', 'Keep your palm facing the camera.'] },
  C: { name: 'How to sign C', steps: ['Curve your fingers and thumb into a C shape.', 'Leave a gap between your fingertips and thumb.', 'Keep the curve open toward the camera.'] },
  D: { name: 'How to sign D', steps: ['Point your index finger straight up.', 'Touch your thumb to your middle finger.', 'Fold your ring and little fingers down.'] },
  E: { name: 'How to sign E', steps: ['Curl your fingertips down toward your palm.', 'Rest your thumb against your curled fingers.', 'Keep your hand compact and facing the camera.'] },
  F: { name: 'How to sign F', steps: ['Touch your thumb and index finger together.', 'Extend your middle, ring, and little fingers, spread apart.', 'Keep your palm facing the camera.'] },
  G: { name: 'How to sign G', steps: ['Point your index finger and thumb out sideways.', 'Keep a small gap between them, like a tiny L on its side.', 'Fold your other fingers down and turn your hand horizontal.'] },
  H: { name: 'How to sign H', steps: ['Extend your index and middle fingers together.', 'Turn your hand so they point sideways, not up.', 'Fold your ring and little fingers with your thumb tucked.'] },
  I: { name: 'How to sign I', steps: ['Make a loose fist with your palm facing the camera.', 'Extend your little finger. Keep your other fingers folded.', 'Rest your thumb across the folded fingers.'] },
  K: { name: 'How to sign K', steps: ['Extend your index and middle fingers into a V.', 'Touch your thumb against the base of your middle finger.', 'Keep your ring and little fingers folded.'] },
  L: { name: 'How to sign L', steps: ['Point your index finger up.', 'Extend your thumb sideways to form an L.', 'Keep your middle, ring, and little fingers folded.'] },
  M: { name: 'How to sign M', steps: ['Fold your index, middle, and ring fingers over your thumb.', 'Keep your palm facing down.', 'Tuck your little finger in with the rest.'] },
  N: { name: 'How to sign N', steps: ['Fold your index and middle fingers over your thumb.', 'Keep your palm facing down.', 'Fold your ring and little fingers out of the way.'] },
  O: { name: 'How to sign O', steps: ['Curve your fingers and thumb until the tips touch.', 'Shape your hand into a rounded O.', 'Keep the shape facing the camera.'] },
  P: { name: 'How to sign P', steps: ['Form a K shape with index and middle fingers.', 'Point your hand downward instead of up.', 'Keep your thumb touching your middle finger.'] },
  Q: { name: 'How to sign Q', steps: ['Point your index finger and thumb out, like a G.', 'Turn your hand so they point downward.', 'Fold your other fingers down.'] },
  R: { name: 'How to sign R', steps: ['Extend your index and middle fingers.', 'Cross your middle finger over your index finger.', 'Keep your ring and little fingers folded with your thumb tucked.'] },
  S: { name: 'How to sign S', steps: ['Make a fist with your palm facing the camera.', 'Fold your thumb across the front of your fingers.', 'Keep your fingers curled in tight.'] },
  T: { name: 'How to sign T', steps: ['Make a loose fist.', 'Tuck your thumb between your index and middle fingers.', 'Keep the rest of your fingers folded.'] },
  U: { name: 'How to sign U', steps: ['Extend your index and middle fingers together, touching.', 'Point them straight up.', 'Fold your ring and little fingers with your thumb tucked.'] },
  V: { name: 'How to sign V', steps: ['Extend your index and middle fingers.', 'Spread them apart into a V.', 'Fold your ring and little fingers with your thumb tucked.'] },
  W: { name: 'How to sign W', steps: ['Extend your index, middle, and ring fingers.', 'Spread them comfortably apart.', 'Keep your little finger folded and your thumb tucked.'] },
  X: { name: 'How to sign X', steps: ['Make a loose fist.', 'Bend your index finger into a hook shape.', 'Keep your thumb resting alongside it.'] },
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
