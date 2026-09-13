// The feedback beat after every attempt, plus Gemini's live coaching line
// while the camera is running. This is where the "recommendation" lands:
// a worked solution for the math and a hand-shape tip for the signing.
//
// Asking to be shown the answer is deliberately NOT styled as a failure —
// it still costs the point, but a learner who asks for help should be
// taught, not scolded.
import { Icon, type IconName } from "../../components/ui/Icon";

export type Attempt = { outcome: "correct" | "miss"; via: "sign" | "voice" | "reveal"; points: number };

type CoachCardProps = {
  attempt: Attempt | null;
  explanation: string;
  hint?: string;
  coachingLine: string | null;
  cameraRunning: boolean;
  onContinue: () => void;
  isLast: boolean;
};

type Tone = { wrap: string; badge: string; title: string; button: string; icon: IconName };

const TONES: Record<"correct" | "wrong" | "taught", Tone> = {
  correct: {
    wrap: "border-success bg-success-soft",
    badge: "bg-success text-white",
    title: "text-success",
    button: "border-success/70 bg-success text-white hover:brightness-110",
    icon: "check",
  },
  wrong: {
    wrap: "border-danger bg-danger-soft",
    badge: "bg-danger text-white",
    title: "text-danger",
    button: "border-danger/70 bg-danger text-white hover:brightness-110",
    icon: "x",
  },
  taught: {
    wrap: "border-accent bg-accent/15",
    badge: "bg-accent text-accent-ink",
    title: "text-accent-ink",
    button: "border-brand-hover bg-brand text-white hover:bg-brand-hover",
    icon: "lightbulb",
  },
};

export function CoachCard({ attempt, explanation, hint, coachingLine, cameraRunning, onContinue, isLast }: CoachCardProps) {
  if (attempt) {
    const key = attempt.outcome === "correct" ? "correct" : attempt.via === "reveal" ? "taught" : "wrong";
    const tone = TONES[key];
    const heading =
      key === "correct"
        ? attempt.via === "voice"
          ? "Heard you — correct!"
          : "Signed it — correct!"
        : key === "taught"
          ? "Here's how it works"
          : "Not quite — here's why";
    return (
      <section role="status" aria-live="assertive" className={`rounded-2xl border-2 p-5 ${tone.wrap}`}>
        <div className="flex items-start gap-4">
          <span aria-hidden="true" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone.badge}`}>
            <Icon name={tone.icon} size={24} strokeWidth={key === "taught" ? 2 : 3} />
          </span>
          <div className="min-w-0 flex-1">
            <p className={`text-lg font-black ${tone.title}`}>
              {heading}
              {key === "correct" && attempt.points > 0 && <span className="ml-2 text-sm font-extrabold">+{attempt.points}</span>}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink">{explanation}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onContinue}
          autoFocus
          className={`mt-4 w-full rounded-xl border-2 border-b-4 px-5 py-3 text-sm font-extrabold tracking-wide uppercase active:translate-y-0.5 active:border-b-2 focus-visible:outline-2 focus-visible:outline-offset-4 ${tone.button}`}
        >
          {isLast ? "See results" : "Continue"}
        </button>
      </section>
    );
  }

  return (
    <section className="flex gap-4 rounded-2xl border-2 border-line bg-surface p-5" aria-label="Coach">
      <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
        <Icon name="lightbulb" size={22} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-extrabold text-brand">Coach</p>
        <p role="status" aria-live="polite" className="mt-1 text-sm leading-relaxed text-muted">
          {coachingLine ?? hint ?? (cameraRunning ? "Watching your hand shape. Tips arrive every few seconds." : "Start the camera to get live hand-shape coaching, or answer by voice.")}
        </p>
      </div>
    </section>
  );
}
