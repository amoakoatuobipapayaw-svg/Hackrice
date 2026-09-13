<div align="center">

# Signly

**Say it with your hands.**

A browser game that teaches you American Sign Language by watching your hands through a
webcam. Sign to score. Hold a shape for one second and it counts as a rep — the same
instant, tactile feedback a rhythm game gives you, pointed at a real skill.

**[signly.vip](https://signly.vip)** · HackRice '26 · **Games & Gamification track**

</div>

---

## The problem

Learning to sign is a motor skill, not a vocabulary list. You can memorize that the letter
`R` is two crossed fingers and still form it wrong for months, because nothing tells you
otherwise. The loop that makes any skill stick — *attempt, correction, retry* — normally
requires a fluent signer sitting across from you.

So the existing tools split into two disappointing halves. Dictionaries and video courses
show you the sign but never see yours; you are practicing into a mirror with no scorekeeper.
Mainstream language apps have world-class feedback loops built entirely around audio, which
makes them structurally unavailable to the communities that use signed language most.

Neither half is fun, and unfun is fatal. A skill that takes months of daily reps dies without
a reason to come back on day four.

**Signly makes the camera the scorekeeper.** That one change turns silent, unverifiable
practice into a game loop with a win condition.

---

## The game

### The core loop

Everything in Signly is built on one two-second interaction:

> **A prompt appears → you form the shape → the overlay tracks your hand live → a hold meter
> fills over one second → it locks in with a sound, a score, and a coaching line → next
> prompt.**

That loop is the whole game. It is fast enough to chain, it is unambiguous — you either
locked it or you didn't — and it produces a stream of small, earned wins. Every mode below is
a different pressure applied to the same loop.

### Five ways to play

| Mode | The pressure | What makes it stick |
|---|---|---|
| **Learn** | None — this is the map | A unit roadmap grouped by handshape family (fist shapes, open hand, pointing shapes, pinch & curl, motion letters). Units unlock in sequence, so there is always exactly one obvious next thing. Your own name is rendered as fingerspelling tiles the moment you land, so the first sign you ever see is *yours*. |
| **Practice** | Mastery | A five-level course: *Your first five* (I L V W Y) → thirteen shapes → the whole alphabet → the digits → everything mixed. Finish a level and it celebrates, unlocks the next, and shows what you actually confirmed. Locked levels refuse in place instead of vanishing, so the ladder is always visible. |
| **Speed** | The clock | Three difficulties — Easy 60s ×1, Medium 30s ×1.5, Hard 15s ×2. A shuffled 36-sign deck deals with no repeats, even across the reshuffle seam, so you cannot farm the five letters you already know. Personal bests are tracked per mode. This is the mode people replay. |
| **Math Lab** | Divided attention | Nine games across three tiers — arithmetic, counting, comparison, times tables, sequences, fractions, algebra, logic, calculus. You answer by **signing the digits** or **speaking them**. Multi-digit answers are signed one digit at a time. Doing mental math *while* recalling a handshape is genuinely hard, and it turns fingerspelling from the task into the controller. |
| **Dictionary** | Curiosity | Type any word or phrase and get real signed video from a 2,683-sign library. The escape hatch from the game into the language — and where people wander when they should be sleeping. |

### The progression systems

Game feel is not decoration here; it is the retention strategy.

- **Combo multipliers.** Consecutive correct reps compound within a round. Breaking a chain
  costs you, which is what makes the fifth rep in a row feel different from the first.
- **XP and levels** with a persistent bar and a level-up toast that fires the moment you cross
  a threshold, mid-round.
- **Daily streaks on a calendar.** Every visit marks the day. Seeing eleven filled squares is
  a better argument for opening the app than any notification.
- **Sequential unlocks.** Content is gated by progress, not dumped at once. The next unit is
  always visible and always close.
- **Personal bests** per Speed mode and per Math game — a private ladder for players who
  aren't going to top the public one.
- **A live leaderboard** over realtime XP, gated behind human verification so nobody farms the
  top slot with a script.
- **No timers on your learning.** Practice never rushes you. The clock only exists in Speed,
  where you chose it. Pressure is opt-in, which is why the app stays a place you *want* to
  return to.
- **Nothing dead-ends.** If a shape refuses to confirm, a skip appears after ten seconds of
  camera time. A stubborn hand can never trap you in a level — the fastest way to lose a
  player is to make them feel stuck at something they can't fix.

The design target was simple: **a five-minute session that you finish wanting one more
round.** Streaks give you a reason to open it, Speed gives you a reason to retry, the roadmap
gives you a reason to come back tomorrow, and the Math Lab gives you a reason to still be
here in week three.

---

## How it works

No diagram — here is the pipeline in plain terms.

**Your camera never leaves your machine.** The browser requests the webcam through
`getUserMedia` and hands each frame to Google's MediaPipe Hand Landmarker, which runs entirely
in the tab and returns 21 three-dimensional landmarks — a wireframe skeleton of your hand —
about fifteen times a second. The video and its landmark overlay are mirrored so it feels like
a mirror; the maths underneath runs on unmirrored coordinates so left and right never
scramble.

**Those landmarks are scored against every candidate sign.** `signClassifier.ts` measures the
geometry — which fingers are extended, how straight each joint is, where the thumb sits, how
far apart the fingertips are, which ones are touching — and produces a match score for each of
the 36 letters and digits. It is a rule engine, not a black box, which means when a sign fails
we know *which feature* failed, and that is exactly what makes the coaching specific instead
of generic.

**`J` and `Z` are different, because they are movements, not poses.** A stable starting shape
arms a tracker, which then watches the path your hand traces and looks for a
downward-and-rising hook (J) or a horizontal / down-diagonal / horizontal zigzag (Z), measured
in units of your own palm size so it works whether you're close to the camera or across the
room. Layered on top is a small trained neural network — about 16 KB — that is tried first and
falls back to the geometric detector automatically whenever it isn't confident.

**A rep only counts when you hold it.** `holdTracker.ts` requires the same label, at or above
its confidence threshold, held steadily for a full second. Lose tracking for a quarter second,
drift to a different shape, or change targets and the accumulated evidence resets. This is the
single most important design decision in the app: a frame-by-frame scorer would flicker and
reward accidents, and the one-second hold is what makes a confirmation feel *earned* rather
than lucky.

**Confirmed reps flow into the game.** `gameLogic.completeRound()` is the one function every
mode calls — it converts correct answers and combo streaks into a score, the score into XP, XP
into a level, and a played session into a streak day, then persists all of it.

**The cloud is used only where it is genuinely better than the browser.** Four small
serverless functions on Vercel hold every secret: `/api/coach` sends a *rounded numeric summary
of hand geometry* — never a camera frame — to Google Gemini at most once every five seconds
and gets back one sentence of coaching; `/api/tts` and `/api/stt` proxy ElevenLabs for spoken
prompts and spoken answers; `/api/solanaBadge` mints a devnet streak token. Supabase stores
profiles, scores, streaks, and the dictionary clips, and pushes leaderboard changes live over
its realtime channel. Persona verifies that a leaderboard entry belongs to a human.

**Why none of the recognition lives on a server:** a round-trip per frame would put network
latency inside the feedback loop, and a game whose scorekeeper lags by 200 ms is not a game
anyone plays twice. Keeping it local also means we never have to ask a learner to trust us
with video of their hands and face. Fast and private turned out to be the same decision.

---

## The recognition engine, honestly

**Confidence tiers.** Every sign carries a `CONFIDENCE_CAP` — the ceiling its score can reach.
This is the single source of truth for what the product claims:

| Tier | Cap | Signs | Meaning |
|---|---|---|---|
| **Demo** | 0.98 | `I L V W Y A S T N M` + `J Z` (motion) + digits `1–9` | Live-tested on real webcams. Confirms at the shared 0.8 threshold. Fully unlocked in the roadmap. |
| **Developing** | 0.50–0.65 | `B C D E F H K O P Q R U X` + `0` | Rules exist and are exercised by tests, but are not yet validated on camera. Playable in Practice and Speed at a proportionally lowered floor; never counted as validated. |

Promoting a sign after live testing is a **one-line change** to that table. Lesson content,
unit unlocking, the roadmap, Speed's deck, and Math's answer constraints all derive from it —
nothing else in the codebase moves. That is why the honest tier stayed honest under demo
pressure: overstating a sign was never the fast path to anything.

**A design constraint that fell out of it:** the classifier confirms digits 1–9, so *no math
answer in the entire Math Lab may contain a zero*. That rule is enforced by a test that
generates roughly 18,000 problems across all nine games and asserts it — because an
unanswerable problem on stage is a demo-ending bug, and "we'll be careful" is not a strategy.

Confidence here is an explicit geometric match score, not a calibrated probability, and the
code says so in the places it matters.

---

## Sponsor technology, and why each one is load-bearing

| Technology | Where it lives | Why it is not decoration |
|---|---|---|
| **Google Gemini** | `api/coach.ts` — `gemini-3.5-flash-lite` | Turns a number into a *correction*. "Your ring finger is drifting up" is something a player can act on; a score of 0.62 is not. Sent rounded landmark geometry, never a frame. ≤1 request per 5 s, one in flight, 8 s timeout — and recognition keeps running uninterrupted if it fails. |
| **ElevenLabs** | `api/tts.ts`, `api/stt.ts` | The two-way bridge that makes the Math Lab work: prompts read aloud, answers spoken back. STT is keyterm-biased to digits and homophone-aware ("for", "to", "ate"), because a hackathon room is loud and general dictation is the wrong tool for a one-digit answer. |
| **Persona** | `meta/personaVerify.ts` | A public leaderboard with prizes is a bot magnet, and a leaderboard nobody trusts is dead weight. Persona is the gate between "has an account" and "is a human who may compete" — deliberately separate from Google sign-in, which only creates the account. |
| **Solana** | `api/solanaBadge.ts` | A portable, verifiable record of a three-day streak, minted on devnet. Implemented and isolated behind its own endpoint; intentionally not surfaced in the shipped UI — a stretch goal that stayed off the critical path. |

---

## Accessibility and privacy

Accessibility is the product thesis, not a compliance pass. A game about signed language that
only works if you can hear would be a contradiction.

- **The camera stays local.** No frame, landmark stream, or player audio is ever uploaded for
  recognition. The only thing that reaches Gemini is rounded numeric hand geometry, at most
  once every five seconds, opt-in per screen.
- **Captions on every audio path.** Anything spoken is also rendered as text.
- **Speech is optional.** A persisted text-to-speech toggle, and every voice interaction has a
  full non-voice equivalent — Math answers can always be signed instead.
- **High-contrast mode** that respects the OS `prefers-contrast` setting and remembers an
  explicit override, implemented as semantic-token overrides so every screen inherits it free.
- **`prefers-reduced-motion`** honored throughout — including the celebration animations.
- **Keyboard and screen reader:** skip-to-content link, labeled landmarks, ARIA-described
  regions, focus-visible states, large tap targets, and a sidebar that becomes a six-target
  top bar on phones.
- **Secrets are server-side.** Gemini, ElevenLabs, and the Solana mint authority live in Vercel
  environment variables and never reach the browser.

**Scope honesty:** the everyday-sign content (HELLO, THANK YOU, PLEASE, SORRY, MY NAME IS,
NICE TO MEET YOU) has not been reviewed by a fluent ASL signer or Deaf educator, and is
labeled as such in the UI. It is a placeholder for real content review, not authority.

---

## Tech stack

**Frontend** React 19 · TypeScript 6 · Vite 8 · Tailwind CSS 4 · React Router 7
**Vision** MediaPipe Tasks Vision · TensorFlow.js
**Backend** Vercel serverless functions · Supabase (Postgres, Auth, Realtime, Storage)
**AI / voice** Google Gemini · ElevenLabs TTS + STT
**Identity / chain** Persona · Solana web3.js + SPL Token (devnet)
**Quality** Node test runner · oxlint · `tsc -b`

Roughly 9,900 lines of TypeScript across 119 source files and 150 commits, built by four
people in 36 hours.

---

## Quickstart

```bash
npm install
cp .env.example .env.local   # optional — the app runs fine with none of these set
npm run dev
```

**The app runs with zero environment variables.** Supabase, Persona, Gemini, and ElevenLabs
each fall back to mocks or clearly-labeled warnings, so a fresh clone is playable immediately
and `npm run dev` never breaks. Fill in `.env.local` as keys become available.

| Variable | Scope | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | client | Profiles, leaderboard, dictionary clip hosting |
| `VITE_SUPABASE_ANON_KEY` | client | Public anon key — safe client-side by design |
| `VITE_PERSONA_TEMPLATE_ID` | client | Persona inquiry template |
| `GEMINI_API_KEY` | **server** | `/api/coach` — never prefix with `VITE_` |
| `ELEVENLABS_API_KEY` | **server** | `/api/tts`, `/api/stt` |
| `SOLANA_MINT_AUTHORITY_SECRET`, `SOLANA_BADGE_MINT` | **server** | Devnet badge mint |

Plain Vite does not serve Vercel's `/api` functions — use `vercel dev` or a deployment to
exercise coaching and voice. The database schema lives in `supabase/schema.sql` and every
statement is idempotent, so re-running it is safe.

### Commands

```bash
npm run dev                          # dev server
npm run build                        # tsc -b + production build
npm run lint                         # oxlint
node src/recognition/tests/run.mjs   # 34 recognition tests
node src/games/tests/run.mjs         # 28 game tests, ~18,000 generated problems
```

### Play without a camera

Append `?mock=1` to any game route — `/math?game=calculus&mock=1` — and a mock recognizer
feeds the digit the game is waiting for, so every answer confirms after the normal one-second
hold. `?mock=stall` never matches, for exercising the coaching and stuck-sign paths. Built as
a stage fallback and used by CI.

---

## Testing

62 tests run under Node's built-in runner against the pure, DOM-free logic — the layer where a
regression is silent and expensive.

**Recognition (34).** Hold timing and release, tracking loss, target changes, geometric
invariance, letter-versus-number separation (V versus 2), thumb-related V/W false positives,
rejection of near-miss reps, invalid landmarks, video aspect ratio, the coaching API contract;
J/Z trajectory recognition, mirror and scale invariance, J-vs-Z disambiguation, static holds
never registering as motion, partial-path rejection, uneven timing; plus the trained model
re-validated against the same hand-written fixtures.

**Games (28).** All nine math generators run over ~18,000 problems asserting two invariants
that would otherwise fail live on stage: every displayed expression actually equals its stated
answer, and no answer ever contains a digit the classifier cannot confirm. Plus practice-level
derivation, progression gating, and Speed deck exhaustion with no repeat across the reshuffle
seam.

---

## Project structure

```
src/
├── recognition/   MediaPipe, geometric classifier, motion model, hold tracker, Gemini coach
│   ├── ml/        offline synthetic dataset generation + training (Node only, never bundled)
│   └── tests/
├── games/         Practice · Speed · Math Lab · roadmap · camera UI · sign guides
│   ├── practice/  five-level course, progression, results
│   ├── speed/     timed modes, deck, personal bests
│   ├── math/      nine generators, round state machine, scoring
│   └── tests/
├── voice/         ElevenLabs TTS/STT clients, captions, press-and-hold mic
├── meta/          leaderboard, streaks, XP, Persona gate, Solana badge
├── dictionary/    ASL Citizen index + offline extraction tooling
├── lib/           shared contracts, Supabase, auth, profile, scoring
├── app/           shell, routing, home, nav, onboarding
└── components/ui/ shared primitives and design tokens
api/               Vercel functions: coach · tts · stt · solanaBadge
```

### How four people built this in parallel

`src/lib/contracts.ts` is the seam. It was the first thing committed, before any feature code,
and it defines every type that crosses a subsystem boundary. Each stream then built against
those types and against `mock.ts` implementations of everyone else's modules, so nobody was
ever blocked and integration happened incrementally instead of as one merge at hour 30.

| Stream | Owner | Territory |
|---|---|---|
| **A — Recognition** | Ato Kwamena Quansah | `src/recognition/`, `src/dictionary/`, the Gemini coaching call |
| **B — Games** | Jana R.O. | `src/games/`, gameplay UI, design system |
| **C — Voice & accessibility** | Papa Yaw Amoako Atuobi | `src/voice/`, Math Lab, the accessibility layer |
| **D — Platform** | Neriah Okolo | `src/lib/`, `src/meta/`, `src/app/`, `api/`, deployment |

The working rules: stay inside your folder; branch per stream and merge at fixed checkpoints;
`contracts.ts` changes are announced first and pushed immediately so everyone rebases;
cross-folder writes go through exactly one function, `completeRound()`; and secrets never leave
Vercel's environment variables. See `PLAN.md` for the full plan and roadmap.

---

## Team

Built at HackRice '26 by four Rice University students — Ato Kwamena Quansah, Jana R.O.,
Papa Yaw Amoako Atuobi, and Neriah Okolo.

---

## Attribution

Sign video clips are a curated subset of Microsoft's
[ASL Citizen](https://github.com/microsoft/ASL-citizen-code) dataset, used under its
non-commercial research license; commercial use would require separate sign-off from
Microsoft. Hand landmark detection is Google's
[MediaPipe Hand Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js).
Fingerspelling references follow [Lifeprint](https://www.lifeprint.com/asl101/pages-layout/fingerspelling.htm).
The learning-path interaction pattern is inspired by Duolingo's; all implementation is original
React and Tailwind, with no copied assets or source.

Signly is a learning aid built by hearing students. It is not a substitute for instruction from
Deaf educators and fluent signers, and the roadmap in `PLAN.md` treats bringing them into the
loop as the next requirement, not a nice-to-have.
