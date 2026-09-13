// The "Welcome to ASL" content unit: no camera, no scoring — just the
// grammar/modality orientation a fingerspelling-only roadmap otherwise never
// covers, plus a small preview of everyday signs. Recognition doesn't
// support word signs yet (see recognition/README.md), so these are taught
// as instructional content, the same way SignGuide teaches a handshape.
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { GameLayout, ProfileGate } from "./GameLayout";
import { getLocalProfile } from "../lib/localProfile";
import { SignPhrase } from "./SignPhrase";
import { markWelcomeSeen } from "./welcomeProgress";

const GRAMMAR_POINTS = [
  { icon: "🧩", title: "Its own grammar", body: "ASL isn't English signed word for word. It has its own grammar and word order, built for a visual, spatial language rather than a spoken one." },
  { icon: "🙂", title: "Facial expression carries meaning", body: "Eyebrows, mouth shape, and eye gaze aren't just emotion — they can mark a question, describe intensity, or change a sign's meaning entirely." },
  { icon: "🧍", title: "Body position matters", body: "Leaning, shoulder shifts, and where you position yourself can show whose turn it is to \"speak\" in a conversation, or represent a different person or thing." },
  { icon: "🗺️", title: "Space is grammar too", body: "Signers place people, places, and ideas at points in the space around them, then point back to those points later — space stands in for pronouns and location." },
  { icon: "〜", title: "Movement changes meaning", body: "The letters J and Z in this course are one small example: the same starting handshape, a different path traced through the air, a different letter." },
];

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
    <GameLayout
      mode="Welcome to ASL"
      title="ASL is a language, not a code for English."
      description="Before the alphabet: a quick orientation to what actually carries meaning in ASL, plus a preview of a few everyday signs."
      progress={0}
      progressLabel="A short read, no camera needed"
    >
      <div className="space-y-4">
        {GRAMMAR_POINTS.map((point) => (
          <Card key={point.title} className="flex gap-4 p-5">
            <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-soft text-xl text-brand">{point.icon}</span>
            <div>
              <h2 className="text-sm font-bold text-brand">{point.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">{point.body}</p>
            </div>
          </Card>
        ))}
      </div>

      <section className="mt-8" aria-labelledby="everyday-signs-heading">
        <h2 id="everyday-signs-heading" className="text-lg font-extrabold">Your first everyday signs</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Common, high-frequency vocabulary like this is exactly what research databases such as{" "}
          <a href="https://asl-lex.org/about.html" target="_blank" rel="noreferrer" className="font-semibold text-selected-ink underline underline-offset-2">ASL-LEX</a>{" "}
          catalog — real signs rated by fluent Deaf signers for how often they come up in everyday use. This preview isn't pulled from that dataset's numbers, but it's the kind of everyday vocabulary it points to.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {EVERYDAY_SIGNS.map(({ sign, note }) => (
            <div key={sign} className="rounded-2xl border border-line bg-surface p-4">
              <p className="text-sm font-extrabold tracking-wide text-brand">{sign}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{note}</p>
              <div className="mt-3"><SignPhrase text={sign} /></div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          Clips above are from{" "}
          <a href="https://www.microsoft.com/en-us/research/project/asl-citizen/" target="_blank" rel="noreferrer" className="underline underline-offset-2">Microsoft's ASL Citizen dataset</a>
          {" "}— real Deaf and hard-of-hearing signers. ASL doesn't have a single sign for every English phrase, so multi-word entries above are shown word by word; any word without a clip shows as plain text. Want to try more? Visit the{" "}
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
