// The "Welcome to ASL" content unit: no camera, no scoring — just a preview
// of a few everyday signs before the alphabet. Recognition doesn't support
// word signs yet (see recognition/README.md), so these are taught as
// instructional content, the same way SignGuide teaches a handshape.
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { LogoMark } from "../components/ui/Logo";
import { GameLayout, ProfileGate } from "./GameLayout";
import { getLocalProfile } from "../lib/localProfile";
import { SignPhrase } from "./SignPhrase";
import { markWelcomeSeen } from "./welcomeProgress";

/** A colored banner, matching Home's hero treatment, instead of the plain
 * generic header every in-round screen uses — this page is a one-time read,
 * not a round in progress, so it should feel like a welcome, not a task. */
function WelcomeHero() {
  return (
    <div className="relative mb-7 overflow-hidden rounded-3xl border-b-8 border-brand-hover bg-brand p-6 text-white sm:p-9">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "radial-gradient(#fff 1.4px, transparent 1.6px)", backgroundSize: "22px 22px" }} />
      <div aria-hidden="true" className="pointer-events-none absolute -right-8 -bottom-12 hidden opacity-20 sm:block animate-float"><LogoMark size={200} className="[&_rect]:fill-transparent" /></div>
      <div className="relative">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-extrabold tracking-widest uppercase"><span className="h-1.5 w-1.5 rounded-full bg-accent" />Before the alphabet</p>
        <h1 className="mt-4 max-w-lg text-3xl leading-tight font-black tracking-tight sm:text-4xl">Intro to <span className="marker-underline text-white">ASL</span>.</h1>
        <p className="mt-3 max-w-md text-base leading-relaxed text-white/85">A quick preview of a few everyday signs before you start the alphabet.</p>
      </div>
    </div>
  );
}

const EVERYDAY_SIGNS = [
  { sign: "HELLO", note: "An open hand near the forehead, palm out, moves away from the head — like a small salute." },
  { sign: "THANK YOU", note: "Flat fingertips touch the chin, then the hand moves forward and slightly down toward who you're thanking." },
  { sign: "PLEASE", note: "A flat hand rests on the chest, palm in, and makes a small circular rubbing motion." },
  { sign: "SORRY", note: "A closed fist makes a small circular rubbing motion on the chest." },
  { sign: "MY NAME IS", note: "Two fingers of one hand tap twice across two fingers of the other, like laying one small sign on top of another." },
  { sign: "NICE TO MEET YOU", note: "Two pointing hands, starting apart, come together in the middle — representing two people meeting." },
];

export function Welcome() {
  const profile = getLocalProfile();
  const navigate = useNavigate();
  if (!profile) return <ProfileGate />;

  return (
    <GameLayout hero={<WelcomeHero />}>
      <section aria-labelledby="everyday-signs-heading">
        <h2 id="everyday-signs-heading" className="text-lg font-extrabold">Your first everyday signs</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Common, high-frequency vocabulary like this is exactly what research databases such as{" "}
          <a href="https://asl-lex.org/about.html" target="_blank" rel="noreferrer" className="font-semibold text-selected-ink underline underline-offset-2">ASL-LEX</a>{" "}
          catalog — real signs rated by fluent Deaf signers for how often they come up in everyday use. This preview isn't pulled from that dataset's numbers, but it's the kind of everyday vocabulary it points to.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {EVERYDAY_SIGNS.map(({ sign, note }) => (
            <Card key={sign} className="p-4">
              <span className="inline-block rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-brand uppercase">{sign}</span>
              <p className="mt-2 text-sm leading-relaxed text-muted">{note}</p>
              <div className="mt-3 border-t border-line pt-3"><SignPhrase text={sign} fill /></div>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          Clips above are from{" "}
          <a href="https://www.microsoft.com/en-us/research/project/asl-citizen/" target="_blank" rel="noreferrer" className="underline underline-offset-2">Microsoft's ASL Citizen dataset</a>
          {" "}— real Deaf and hard-of-hearing signers. ASL doesn't have a single sign for every English phrase, so multi-word entries above are shown word by word, skipping any word with no clip yet. Want to try more? Visit the{" "}
          <Link to="/dictionary" className="underline underline-offset-2">sign dictionary</Link>.
        </p>
      </section>

      <div className="mt-6 rounded-2xl border-2 border-dashed border-line p-5">
        <h2 className="font-bold">A note on this content</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          These written descriptions are a starting point and not yet checked by a fluent ASL signer or Deaf educator — treat them as an introduction, not a certified lesson. The video clips are real signers, but word-by-word playback isn't fluent ASL grammar. The camera can't check these signs yet either; that's still fingerspelling and numbers only.
        </p>
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => { markWelcomeSeen(); navigate("/"); }}>Continue to your roadmap</Button>
        <Link to="/lesson" className="flex items-center justify-center rounded-xl border-2 border-b-4 border-line px-5 py-3 text-center text-sm font-extrabold tracking-wide text-brand uppercase hover:bg-soft" onClick={markWelcomeSeen}>Skip to hand shapes</Link>
      </div>
    </GameLayout>
  );
}
