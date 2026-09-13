# Signly — Engineering & Product Plan

**Status:** shipped and live at [signly.vip](https://signly.vip)
**Origin:** HackRice '26 — Games & Gamification track
**This document:** what we built, the decisions behind it, what we know is not finished, and
the sequenced plan to take it from a working demo to a product Deaf educators would endorse.

---

## 1. Thesis

> Sign language is a motor skill. Motor skills need a feedback loop. The feedback loop for
> signed language currently requires a fluent human being, and that is the bottleneck.

Every assumption in the codebase follows from one claim: **if a camera can close that loop
in under a second, on hardware people already own, the economics of learning to sign
change.**

That claim generates hard constraints, and we chose the architecture to satisfy them rather
than the other way around:

| Constraint | Consequence in the code |
|---|---|
| Feedback must feel instantaneous | Classification is 100% client-side. No network round-trip is permitted inside the recognition loop. |
| Learners must not have to trust us with video of themselves | No frame ever leaves the device. Gemini receives rounded landmark geometry, nothing else. |
| Zero friction to first attempt | Browser-only. No install, no wearable, no account required to play. |
| A tool for Deaf communities cannot depend on audio | Every voice path has a non-voice equivalent; every audio output has a caption. |
| We are not fluent signers | Capability is tiered explicitly in code, and the product only claims what has been tested on a real camera. |

---

## 2. Where we are

**Shipped and working end to end**

- Real-time hand tracking with 21 3-D landmarks at ~15 fps, fully in-browser
- Geometric classifier covering all 26 letters and digits 0–9, with per-sign confidence caps
- Motion recognition for `J` and `Z` — geometric stroke detection plus a trained 1-D CNN with
  automatic fallback to the heuristic
- Four game surfaces: a five-level Practice course, three Speed clocks, a nine-game Math Lab,
  and a Welcome content unit
- A 2,683-sign video dictionary with phrase matching, served from Supabase Storage
- Gemini coaching, ElevenLabs speech in both directions, Persona-gated live leaderboard,
  Google auth with guest fallback, streaks, XP, levels, and personal bests
- A full accessibility layer: captions, high-contrast mode, reduced motion, keyboard
  navigation, and a voice-optional design
- 62 automated tests over the pure logic layer; a `?mock=1` path that plays every mode with no
  camera

**Validated on a real webcam:** 12 letters (`I L V W Y A S T N M J Z`) and digits `1–9`.

**Not yet validated:** the remaining 14 letters and `0`. Rules exist, tests exercise them,
they are playable at a proportionally lowered floor — and they are not counted as working.
Closing that gap is Phase 1 and it is the single most valuable thing we can do next.

**Known limitations we are not hiding**

1. Confidence is a geometric match score, not a calibrated probability.
2. The classifier is hand-tuned by hearing developers. The thumb-occlusion family
   (`A/E/M/N/S/T`) in particular needs data, not more rules.
3. The trained motion model learned from synthetic trajectories labeled by our own
   heuristic — it generalizes the boundary, it cannot exceed it.
4. Recognition covers handshapes only. ASL grammar lives in facial expression, body position,
   space, and movement, and Signly currently teaches none of it.
5. Everyday-sign content has not been reviewed by a fluent signer or Deaf educator.
6. Database row-level security is permissive by design for a demo leaderboard. It is not a
   production security posture.
7. Inference runs on the main thread; a Web Worker is the obvious next performance step.

---

## 3. Architectural decisions and their rationale

Recorded so a reviewer can judge the reasoning, not just the result.

**Client-side recognition over a server model.** A server model would likely be more accurate
today. It would also add 100–300 ms per frame, cost money per learner, and require uploading
video of people's hands and faces. Instant, free, and private beat marginally more accurate.

**A geometric rule engine over training a classifier during the hackathon.** With no labeled
data and 36 hours, a rule engine is inspectable and debuggable in a way a small model trained
on a tiny hand-collected set is not. When a sign fails we can see *which feature* failed. That
diagnosis is also what makes Gemini's coaching specific rather than generic.

**A single `CONFIDENCE_CAP` table as the source of truth.** Lesson content, unit unlocking,
the roadmap, Speed's deck, and Math's answer constraints are all derived from one table.
Promoting a sign after live testing is a one-line change with no call-site edits. This is what
kept the honest tiering from eroding under demo pressure — there was never an incentive to
overstate a sign, because overstating it was not the fast path to anything.

**The heuristic as the ML model's fallback, not the reverse.** The trained model is tried
first and must clear its own confidence floor; the validated heuristic catches everything
else. A `disableMotionML` flag removes the model from the path entirely without a rebuild.
New capability should never be able to regress proven capability.

**`contracts.ts` before any feature code.** The first commit of the project defined the types
crossing subsystem boundaries. Four people then built four subsystems in parallel against
those types and against mocks of each other's modules. Integration was incremental rather than
a big-bang merge at hour 30.

**Per-target confirmation floors instead of one global threshold.** A sign capped at 0.65 can
never reach a global 0.8 threshold — it would hang a round forever. `confirmFloor()` scales
the floor to each sign's own cap, so a developing sign still demands real evidence
proportional to how much that shape is trusted, without becoming impossible.

---

## 4. Roadmap

### Phase 1 — Earn the accuracy claim *(next 4–6 weeks)*

The product's ceiling is set by how many signs actually work. Everything here serves that.

| Workstream | Deliverable | Exit criterion |
|---|---|---|
| Data collection | In-app opt-in capture: consenting users donate landmark sequences (never video) with the intended label | ≥ 200 labeled samples per sign across ≥ 30 hands |
| Model | Replace hand-tuned geometry with a small classifier trained on real landmarks, keeping the rule engine as the fallback and as the coaching explainer | Held-out accuracy ≥ 95% on the demo tier, ≥ 85% across all 36 |
| Calibration | Convert match scores into calibrated probabilities; confidence becomes a number we can defend | Reliability curve within ±5% across bins |
| Coverage | Promote the remaining 14 letters and `0` on measured evidence | All 36 signs at demo tier, or documented reasons why not |
| Performance | Move inference to a Web Worker | No dropped frames at 30 fps on a mid-range laptop |
| Bias audit | Measure accuracy across skin tones, hand sizes, lighting, and left- vs right-handed signers | No subgroup more than 10% below the mean |

The bias audit is not optional. A recognizer that works well on the four hands that built it
is a demo, not a product.

### Phase 2 — Earn the curriculum claim *(2–3 months)*

Recognition is necessary and nowhere near sufficient. A tool that teaches only fingerspelling
teaches the smallest and least conversational part of ASL.

- **Deaf-led content review.** Partner with Rice's accessibility office and a local Deaf
  organization. Every existing lesson gets reviewed or removed. This gates all new content.
- **Word signs.** Two-handed detection, movement over time, and location relative to the body
  — an architectural extension of the J/Z motion path, not a new system.
- **Non-manual markers.** Face landmarks for the grammatical information that eyebrows,
  mouth morphemes, and head tilt carry. Explicitly teach that ASL is not signed English.
- **Real pedagogy.** Spaced repetition over the sign set; a curriculum sequenced by a
  qualified educator instead of by handshape convenience.
- **Receptive practice.** Watch a sign, identify it. Currently the app only trains production,
  which is half of a language.

### Phase 3 — Platform *(3–6 months)*

- **Mobile.** React Native with MediaPipe's native task, sharing the classifier logic. Phones
  are where daily-streak learning actually happens.
- **Classroom mode.** Teacher dashboards, rosters, assigned units, per-student progress.
  The clearest early revenue path — ASL is among the most-enrolled foreign languages in US
  universities, and none of those courses currently have automated practice feedback.
- **Production security.** Replace permissive RLS with `auth.uid()`-scoped policies,
  server-authoritative scoring, and rate limiting. Today's schema is honest about being a
  demo posture; that ends before any real user data exists.
- **Offline.** The recognition path has no server dependency, so a service worker plus a
  cached model makes the core loop work with no connection at all.

### Phase 4 — Institutional *(6–12 months)*

- WCAG 2.2 AA audit with Deaf and hard-of-hearing testers
- Efficacy study with a university ASL program: does Signly practice measurably improve
  fingerspelling reception and production against a control?
- Accessibility-compliance licensing for institutions with signed-language obligations
- An open landmark dataset contributed back, under Deaf-community governance

---

## 5. Quality and validation plan

**Automated (in place).** 62 tests over the pure logic layer, chosen for the failures that are
silent and expensive: hold timing and release, tracking loss, geometric invariance, vocabulary
separation, near-miss rejection, J-vs-Z disambiguation, static holds never registering as
motion, and ~18,000 generated math problems asserting both that every expression equals its
answer and that no answer contains an unconfirmable digit.

**Manual (protocol, not vibes).** A sign is promoted only after a full pass on at least three
different hands, under both good and poor lighting, at two camera distances, both handedness
orientations, and against its most confusable neighbor. The result is recorded before the cap
changes.

**Adding to CI:** typecheck, lint, and both test runners on every PR; a Playwright smoke test
driving each mode through `?mock=1`; and a bundle-size budget, since the recognition path is
already loading two ML runtimes from a CDN.

---

## 6. Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| Accuracy plateaus below usefulness on the hard letters | **High** | Phase 1 real-data collection; the rule engine remains as fallback and explainer; ship a smaller validated set rather than a large unreliable one |
| We build the wrong curriculum without Deaf input | **High** | Phase 2 gates all new content on Deaf-led review; existing unreviewed content is labeled as such in the UI today |
| ASL Citizen's non-commercial license blocks a commercial path | Medium | Dictionary is isolated behind `dictionary/index.ts`; swapping the source touches one module. Commercial use requires Microsoft sign-off, which we would seek before any monetization |
| Third-party model or API deprecation (already hit twice mid-build) | Medium | Every external call sits behind an owned serverless function; model IDs are environment-overridable; the app degrades to mocks rather than breaking |
| CDN-loaded MediaPipe/TF.js blocked by a strict CSP or offline network | Medium | Document required hosts; Phase 3 self-hosting and service-worker caching |
| Permissive RLS misread as a production posture | Medium | Documented in the schema itself; hard prerequisite for Phase 3 |
| Main-thread inference stalls UI on low-end devices | Low | Throttled to 15 fps today; Web Worker in Phase 1 |

---

## 7. Operating model

Four engineers, one seam, no shared files.

| Stream | Owner | Territory |
|---|---|---|
| **A — Recognition** | Ato Kwamena Quansah | `src/recognition/`, `src/dictionary/`, the Gemini coaching call |
| **B — Games** | Jana R.O. | `src/games/`, gameplay UI, design system |
| **C — Voice & accessibility** | Papa Yaw Amoako Atuobi | `src/voice/`, Math Lab, the accessibility layer |
| **D — Platform** | Neriah Okolo | `src/lib/`, `src/meta/`, `src/app/`, `api/`, deployment |

**The rules that made parallel work survive 150 commits in 36 hours:**

1. `src/lib/contracts.ts` is written first and changed only by announcement, then pushed
   immediately so everyone rebases.
2. Every stream ships a `mock.ts` early. Nobody waits on anybody.
3. Stay inside your folder. Merge conflicts are a symptom of ownership ambiguity, not of git.
4. Cross-folder writes go through exactly one function — `completeRound()`.
5. Branch per stream, merge to `main` at fixed checkpoints, never a big-bang integration.
6. Secrets live in Vercel environment variables. Client keys are prefixed `VITE_`; anything
   unprefixed must never reach the browser.

---

## 8. Success metrics

**Product:** signs at demo tier (12 of 36 → 36 of 36) · median attempts to first confirmed rep
· seven-day streak retention · share of sessions completing a full level.

**Technical:** held-out classifier accuracy overall and per subgroup · calibration error ·
p95 time from correct handshape to confirmation · frames dropped per session.

**Impact:** the metric that matters is not any of the above. It is whether a Deaf educator,
shown this app, would tell a student to use it. Phase 2 exists to make that answer yes.

---

## Appendix — the 36-hour build

Recorded because the execution is part of the submission.

| Phase | Window | Outcome |
|---|---|---|
| 0 · Foundation | Fri 23:00 – Sat 01:00 | `contracts.ts` merged; Vite + React + TS + Tailwind shell; stubs and mocks for all four streams; `npm run dev` working for everyone |
| 1 · Parallel core | Sat 01:00 – 10:00 | Webcam + landmarks rendering; Lesson playable on mocks; TTS/STT live; leaderboard, streaks, Persona gate, `/api` proxies deployed |
| 2 · Integration | Sat 10:00 – 16:00 | Mocks swapped for real modules one at a time; full loop live — sign to camera → real score → Gemini coaching → spoken aloud → XP posted |
| 3 · Depth & polish | Sat 16:00 – 22:00 | Math Lab expanded to nine games; Practice to five levels; Speed to three clocks; 2,683-sign dictionary; motion model for J/Z; accessibility pass |
| 4 · Freeze & submit | Sat 22:00 – Sun 02:00 | Feature freeze, demo video, Devpost, rehearsal |
| 5 · Buffer | Sun 02:00 – 08:45 | Fixes only. Submitted ahead of deadline |

**What went right:** contracts-first parallelism; mocks from hour one; deriving all content
from the confidence table; deploying on night one so there was always a live URL.

**What we would do differently:** collect real landmark data on Saturday morning instead of
hand-tuning geometry all day — the rule engine consumed the hours that a small trained model
would have used better, and it is exactly the work Phase 1 now has to do. And we would have
contacted a Deaf educator *before* writing any lesson content, not after.

---

<div align="center">

**Signly** · [signly.vip](https://signly.vip) · HackRice '26

</div>
