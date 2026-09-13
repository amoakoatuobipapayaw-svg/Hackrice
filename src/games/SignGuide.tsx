import { Icon } from '../components/ui/Icon';
import { hasLetterHint, LetterHint } from './LetterHint';
import { hasNumberHint, NumberHint } from './NumberHint';
import { HandHint } from './math/HandHint';

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
  // J and Z are the two letters that move (see recognition/motionClassifier.ts):
  // the hand shape alone isn't the sign, the path it travels is.
  J: { name: 'How to sign J', steps: ['Start in the I shape: little finger up, the rest folded.', 'Trace a J in the air with your little finger — straight down, then hook to the side.', 'Keep the hand shape steady while it travels; only your hand moves.'] },
  Z: { name: 'How to sign Z', steps: ['Point your index finger, other fingers folded.', 'Draw a Z in the air: across, diagonally down, then across again.', 'Keep the strokes crisp and stay inside the camera frame.'] },
  // Digits 0-9. These follow the number rules in recognition/signClassifier.ts,
  // where 6-9 are a thumb touching one fingertip and the rest held straight.
  '0': { name: 'How to sign 0', steps: ['Curve your fingers and thumb until the tips meet.', 'Shape a rounded O — that circle is zero.', 'Keep the opening facing the camera.'] },
  '1': { name: 'How to sign 1', steps: ['Point your index finger straight up.', 'Fold your middle, ring, and little fingers into your palm.', 'Keep your thumb tucked against them, not out to the side.'] },
  '2': { name: 'How to sign 2', steps: ['Extend your index and middle fingers.', 'Spread them apart into a V.', 'Fold your ring and little fingers with your thumb tucked.'] },
  '3': { name: 'How to sign 3', steps: ['Extend your thumb, index, and middle fingers.', 'Spread the three comfortably apart.', 'Fold your ring and little fingers down.'] },
  '4': { name: 'How to sign 4', steps: ['Hold four fingers straight up, spread apart.', 'Fold your thumb across your palm.', 'Keep your palm facing the camera.'] },
  '5': { name: 'How to sign 5', steps: ['Spread all five fingers wide.', 'Keep your thumb out to the side, away from your palm.', 'Relax your wrist and face your palm at the camera.'] },
  '6': { name: 'How to sign 6', steps: ['Touch your thumb to your little fingertip.', 'Hold your index, middle, and ring fingers straight up.', 'Keep your palm facing the camera.'] },
  '7': { name: 'How to sign 7', steps: ['Touch your thumb to your ring fingertip.', 'Hold your index, middle, and little fingers straight up.', 'Keep your palm facing the camera.'] },
  '8': { name: 'How to sign 8', steps: ['Touch your thumb to your middle fingertip.', 'Hold your index, ring, and little fingers straight up.', 'Keep your palm facing the camera.'] },
  '9': { name: 'How to sign 9', steps: ['Touch your thumb to your index fingertip.', 'Hold your middle, ring, and little fingers straight up.', 'Keep your palm facing the camera.'] },
};

export function SignGuide({ target, completed = 0, targets = [] }: { target: string; completed?: number; targets?: readonly string[] }) {
  const guide = GUIDES[target];
  return <section className="flex h-full flex-col rounded-2xl border-2 border-line bg-surface p-6 sm:p-8" aria-label={`Guide for ${target}`}>
    <div className="flex items-center justify-between"><span className="text-xs font-extrabold tracking-widest text-brand uppercase">Your next hand shape</span><span className="rounded-full bg-soft px-3 py-1 text-xs font-bold text-muted">ASL · One hand</span></div>
    <div className="my-6 flex flex-wrap items-center justify-center gap-6 rounded-2xl bg-soft py-7 sm:gap-8">
      <span className="flex h-32 w-28 -rotate-2 flex-col items-center justify-center rounded-2xl border-b-8 border-brand-hover bg-brand text-[88px] leading-none font-black tracking-tight text-white shadow-md sm:h-36 sm:w-32 sm:text-[100px]">{target}<span className="mt-1 text-[10px] font-bold tracking-widest text-white/70">ASL</span></span>
      <div className="flex flex-col items-center gap-1">
        {hasLetterHint(target)
          ? <LetterHint letter={target} size={132} />
          : hasNumberHint(target)
            ? <NumberHint digit={target} size={132} />
            : <HandHint digit={target} size={132} />}
        <span className="text-[11px] font-bold tracking-wide text-muted uppercase">Copy this shape</span>
      </div>
      <div className="max-w-28 text-sm leading-relaxed text-brand">Shape it.<br />Hold it.<br /><span className="font-bold text-brand">You’ve got this.</span></div>
    </div>
    <h2 className="text-xl font-extrabold">{guide?.name ?? 'Keep your hand in view.'}</h2>
    <ol className="mt-5 space-y-4">{guide?.steps.map((step, i) => <li key={step} className="flex gap-3 text-sm leading-relaxed text-muted"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-extrabold text-brand">{i + 1}</span>{step}</li>)}</ol>
    {/^[1-9]$/.test(target) && (
      <p className="mt-4 text-xs text-muted">
        Handshape photo by{" "}
        <a href="https://commons.wikimedia.org/wiki/User:Snailsmakemehappy" target="_blank" rel="noreferrer" className="underline underline-offset-2">Snailsmakemehappy</a>
        {", licensed "}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer" className="underline underline-offset-2">CC BY-SA 4.0</a>
        {", via Wikimedia Commons — resized, otherwise unmodified."}
      </p>
    )}
    {targets.length > 0 && <div className="mt-auto pt-7"><p className="mb-3 text-xs font-extrabold tracking-widest text-muted uppercase">Your {targets.length}-sign journey</p><ol className="grid gap-2" aria-label="Lesson steps" style={{ gridTemplateColumns: `repeat(${Math.min(targets.length, 6)}, minmax(0, 1fr))` }}>{targets.map((letter, i) => <li key={i} aria-current={i === completed ? 'step' : undefined} aria-label={`${letter}: ${i < completed ? 'complete' : i === completed ? 'current' : 'up next'}`} className={`flex h-11 items-center justify-center rounded-xl border-2 text-sm font-bold ${i < completed ? 'border-brand bg-brand text-white' : i === completed ? 'border-brand bg-soft text-ink' : 'border-line text-muted'}`}>{i < completed ? <Icon name="check" size={18} strokeWidth={3} /> : letter}</li>)}</ol></div>}
  </section>;
}
