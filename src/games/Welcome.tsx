// The "Welcome to ASL" content unit: no camera, no scoring — just the
// grammar/modality orientation a fingerspelling-only roadmap otherwise never
// covers, plus a small preview of everyday signs. Recognition doesn't
// support word signs yet (see recognition/README.md), so these are taught
// as instructional content, the same way SignGuide teaches a handshape.
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Icon, type IconName } from "../components/ui/Icon";
import { GameLayout, ProfileGate } from "./GameLayout";
import { getLocalProfile } from "../lib/localProfile";
import { SignPhrase } from "./SignPhrase";
import { markWelcomeSeen } from "./welcomeProgress";

type Tone = "brand" | "accent" | "success";
const CARD_ACCENT: Record<Tone, string> = {
  brand: "border-l-brand",
  accent: "border-l-accent",
  success: "border-l-success",
};
// Same soft-badge convention as Roadmap.tsx's unit tags, reused here so an
// icon badge reads as the same kind of chip elsewhere in the app.
const ICON_BADGE: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand",
  accent: "bg-accent/30 text-accent-ink",
  success: "bg-success-soft text-success",
};

const GRAMMAR_POINTS: { title: string; body: string; icon: IconName; tone: Tone }[] = [
  { title: "Its own grammar", body: "ASL isn't English signed word for word. It has its own grammar and word order, built for a visual, spatial language rather than a spoken one.", icon: "bookOpen", tone: "brand" },
  { title: "Facial expression carries meaning", body: "Eyebrows, mouth shape, and eye gaze aren't just emotion — they can mark a question, describe intensity, or change a sign's meaning entirely.", icon: "sparkles", tone: "accent" },
  { title: "Body position matters", body: "Leaning, shoulder shifts, and where you position yourself can show whose turn it is to \"speak\" in a conversation, or represent a different person or thing.", icon: "user", tone: "success" },
  { title: "Space is grammar too", body: "Signers place people, places, and ideas at points in the space around them, then point back to those points later — space stands in for pronouns and location.", icon: "target", tone: "brand" },
  { title: "Movement changes meaning", body: "The letters J and Z in this course are one small example: the same starting handshape, a different path traced through the air, a different letter.", icon: "zap", tone: "accent" },
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
      <div className="grid gap-4 sm:grid-cols-2">
        {GRAMMAR_POINTS.map((point) => (
          <Card key={point.title} className={`flex gap-4 border-l-4 p-5 ${CARD_ACCENT[point.tone]}`}>
            <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${ICON_BADGE[point.tone]}`}>
              <Icon name={point.icon} size={18} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-ink">{point.title}</h2>
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
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {EVERYDAY_SIGNS.map(({ sign, note }) => (
            <Card key={sign} className="p-4">
              <span className="inline-block rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-brand uppercase">{sign}</span>
              <p className="mt-2 text-sm leading-relaxed text-muted">{note}</p>
              <div className="mt-3 border-t border-line pt-3"><SignPhrase text={sign} /></div>
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
