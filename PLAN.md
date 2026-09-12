# PLAN.md — Signly build plan and work split

> **Naming note (2026-09-12):** the product was renamed from "SignQuest" to "Signly" — see CLAUDE.md.

Team of 4, all coding through Claude Code from separate accounts. Web app first.
Clock: hacking ends **Sunday 9:00 AM**, Devpost submission (with a 3-4 minute video) due **Sunday 8:45 AM**. It is Friday ~11 PM now. Sleep is allowed and encouraged; rotate.

**Status: Phase 1 core is landing on `main`.** `feat/voice` (C, real ElevenLabs speak/listen + a11y pass) and `feat/recognition` (A, real MediaPipe hand tracking + geometric classifier, 13 passing unit tests) are both merged. `api/coach.ts` is live and returning real Gemini coaching lines (migrated to the new Interactions API — `generateContent` is deprecated, see git log). Supabase is live. Deployed at **https://signquest-flame.vercel.app**. Sign → recognition → coaching is wireable end to end now; B's game screens are next to actually call it from a real Lesson flow instead of the stub pages. Still open from D's list: `ELEVENLABS_API_KEY` in Vercel, Persona template ID, Solana stretch.

## The four workstreams

Assign one person to each. The most technically comfortable person should take **A (Recognition)**, it is the hardest and the riskiest. Nerez, that is probably you.

### A — Recognition engine (hardest, start first)
Owns `src/recognition/` and the Gemini coaching call.
- Get the webcam feed running with `getUserMedia`.
- Load MediaPipe Hand Landmarker (`@mediapipe/tasks-vision`), draw the 21 landmarks over the video so we can see it working.
- Build `signClassifier.ts`: given hand landmarks, return the best-guess letter/number. Start rule-based on finger states (which fingers are extended, thumb position) for A-Z and 0-9. This is enough for the MVP.
- Build `useSignRecognition()` hook that streams `{ label, confidence }` and a "hold to confirm" scoring rule (label stable for ~1 second = a correct rep).
- Build `geminiCoach()`: every few seconds, send a frame or the landmark summary to `/api/coach` and return one short coaching line.
- `recognition/mock.ts` and stub `useSignRecognition.ts`/`handLandmarker.ts`/`signClassifier.ts`/`geminiCoach.ts` already exist (D scaffolded them) — build the real internals in place, keep the `SignRecognition` shape from `contracts.ts`.

### B — Game modes and gameplay UI
Owns `src/games/`. Builds against A's and C's mocks until integration.
- **Lesson mode**: show a target sign (image or description), user signs it, show live score and the coaching line, advance on success. A short lesson = 5 signs.
- **Speed Challenge**: a timed run of signs, points for speed and accuracy, combo multiplier.
- **Math mode**: generate a math problem, accept the answer two ways: sign the number in ASL, or speak it (calls C's voice STT). Correct/incorrect feedback, timer, score.
- `gameLogic.ts`: scoring, streak-within-a-round, XP awarded. Return results in the `RoundResult` shape from contracts.
- `Lesson.tsx`, `SpeedChallenge.tsx`, `MathMode.tsx` exist as stub pages already routed in `src/app/App.tsx` — build out the real UI in place.

### C — Voice and accessibility (ElevenLabs)
Owns `src/voice/`.
- `speak(text)`: call `/api/tts`, play the returned audio. Used to speak recognized signs aloud and read prompts.
- `listen()`: capture mic audio, send to `/api/stt`, return the transcript. Used by Math mode voice answers.
- `useVoice()` hook exposing `speak`, `listen`, and `isSpeaking`.
- Accessibility pass: captions for all audio, keyboard navigation, large tap targets, high-contrast mode. This is our impact story, own it proudly.
- `voice/mock.ts` and stub `useVoice.ts` already exist (D scaffolded them) — build the real `/api/tts` + `/api/stt` calls in place, keep the `VoiceApi` shape from `contracts.ts`.

### D — Shell, meta, backend, sponsors
Owns `src/lib/`, `src/meta/`, `src/app/`, and `/api`.
- [x] **First job, hour one**: write `src/lib/contracts.ts` and merge to `main`. Nothing else starts cleanly until this exists.
- [x] Scaffold the Vite + React + TS + Tailwind app, routing, Home, Nav, onboarding screen.
- [x] `supabase.ts` query helpers (`getLeaderboard`, `postScore`, `getProfile`, `bumpStreak`), with mock fallback if env vars are missing. **Live**: Supabase project provisioned through the Vercel Marketplace, `supabase/schema.sql` applied (tables + permissive RLS + realtime on `scores`). `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are set in Vercel (Production, Development — Preview hit a CLI bug, add manually via the dashboard if you need preview deploys) and in `.env.local`. Get the same two values from whoever holds the Vercel project and drop them in your own `.env.local` to point at the same shared database.
- [x] Serverless proxies in `/api`: `coach.ts` (Gemini), `tts.ts` and `stt.ts` (ElevenLabs). Keys server-side, read from `process.env`. **TODO:** set `GEMINI_API_KEY` / `ELEVENLABS_API_KEY` in Vercel.
- [x] **Persona gate**: `PersonaGate.tsx` loads the sandbox SDK and flips a local `verified` flag. **TODO:** get a real `VITE_PERSONA_TEMPLATE_ID` and wire `verified` through to the leaderboard once Supabase is live.
- [x] Streaks and XP: `StreakXp.tsx` (badge + level bar), `bumpStreak()` in `supabase.ts`.
- [x] Leaderboard UI (`meta/Leaderboard.tsx`) with realtime subscription, currently rendering mock rows until Supabase is live.
- [ ] **Solana badge (stretch)**: `solanaBadge.ts`, mint a devnet achievement when a user hits a streak milestone. Only after everything else works.
- [x] Deploy to Vercel — **live at https://signquest-flame.vercel.app**. `vercel.json` added with a catch-all rewrite so client-side routes (`/leaderboard`, `/lesson`, etc.) don't 404 on refresh/direct visit. `/api/coach` is live with real Gemini output; `/api/tts`/`/api/stt` will 500 until `ELEVENLABS_API_KEY` is set in Vercel.
  - **Deploy gotcha:** the Vercel project (Hobby plan, under D's personal account) isn't Git-connected — `vercel git connect` fails because the Vercel GitHub App was never installed/authorized on the repo owner's (B's) GitHub account, which is a separate permission from the repo just being public. Practical effect: **`vercel deploy --prod` fails/hangs with a "Deployment Blocked: commit email could not be matched" error if the tip commit on `main` wasn't authored by D.** Fix before deploying: `git commit --allow-empty -m "chore: trigger deploy"` (authored as D) on top, push, then deploy. True auto-deploy-on-push would need B to install the Vercel GitHub App and grant repo access, then `vercel git connect` — worth doing if there's downtime, not worth chasing mid-crunch.

## Shared interfaces (these go in src/lib/contracts.ts, D writes them first)
Everyone codes to these. Exact names matter so imports line up.

```ts
export type SignResult = { label: string; confidence: number };      // from A
export type GameMode = "lesson" | "speed" | "math";
export type RoundResult = {                                          // from B
  mode: GameMode; score: number; correct: number; total: number; xp: number;
};
export type ScoreEntry = {                                           // leaderboard, from D
  userId: string; name: string; xp: number; verified: boolean; updatedAt: string;
};
export type UserProfile = { id: string; name: string; streak: number; xp: number; level: number; verified: boolean };

// hook contracts (shape only)
export interface SignRecognition { current: SignResult | null; start(): void; stop(): void; } // A: useSignRecognition()
export interface VoiceApi { speak(t: string): Promise<void>; listen(): Promise<string>; isSpeaking: boolean; } // C: useVoice()
```

## Timeline (anchored to the real clock, sleep built in)
- **Fri 11:00 PM to Sat 1:00 AM — Phase 0, Setup (all together).** ✅ D scaffolded the app and merged `contracts.ts`, plus stub files + mocks for `recognition/`, `games/`, `voice/` so `npm run dev` already works for everyone. Still open: A gets webcam + landmarks drawing on screen (proves the riskiest part on night one), and deploy the shell to Vercel.
- **Sat 1:00 AM to Sat 10:00 AM — Phase 1, Parallel core (rotate sleep).** Each workstream builds its core against mocks. Target by end of phase: A recognizes letters and numbers; B has Lesson mode playable with mock recognition; C has speak and listen working; D has leaderboard, streaks, Persona gate, and the /api proxies live.
- **Sat 10:00 AM to Sat 4:00 PM — Phase 2, Integration.** Replace mocks with real modules one at a time. Get the full loop working end to end: pick a lesson, sign to camera, real score, real coaching line, ElevenLabs speaks it, XP posts to the real leaderboard. Then wire Math mode with both sign and voice answers.
- **Sat 4:00 PM to Sat 10:00 PM — Phase 3, Polish + sponsors.** Gemini coaching quality pass, animations, sound, empty and error states, mobile-responsive layout, high-contrast and captions. If ahead: Solana devnet badge.
- **Sat 10:00 PM to Sun 2:00 AM — Phase 4, Freeze + submit prep.** Feature freeze. Record the 3-4 minute video, write the Devpost, seed the leaderboard with a few entries, rehearse the 2-minute live demo out loud twice.
- **Sun 2:00 AM to 8:00 AM — Buffer and sleep.** Fixes only, no new features.
- **Sun 8:45 AM — SUBMIT.** Do not wait until 8:59.

## Integration checkpoints (avoid big-bang merges)
- Checkpoint 1 (Sat 10 AM): `contracts.ts` frozen, all mocks conform, shell deployed.
- Checkpoint 2 (Sat 4 PM): full core loop works on `main` with real modules.
- Checkpoint 3 (Sat 10 PM): feature freeze, everything on `main`, demo rehearsed once.

## Devpost / video checklist (Phase 4)
- 30s intro: name (Signly), team, Games & Gamification track, the challenges (Gemini, ElevenLabs, Persona, Solana), the problem (learning ASL is hard and Deaf communities are underserved by audio-first apps).
- 2m demo: the golden loop live, then show streaks, leaderboard with a verified name, Math mode answered by sign AND by voice.
- 30s technical: MediaPipe for real-time landmarks, Gemini for coaching, ElevenLabs for the voice bridge, Supabase + Vercel, Persona for the bot-free leaderboard.
- 30s impact: who this helps and where it goes next.
- Tag every sponsor challenge on the Devpost submission (you can enter multiple challenges, one track).

## Risk list (watch these)
1. **Recognition accuracy** is the biggest risk. If rule-based classification is shaky, narrow to fewer signs that work reliably rather than many that do not. A confident demo of 10 signs beats a flaky demo of 40.
2. **API keys in the browser**: never. Route Gemini and ElevenLabs through /api. Persona and Supabase anon keys are safe client-side.
3. **Solana rabbit hole**: timebox to 2 hours max. If it fights you, cut it, we still have three strong sponsors.
4. **Merge conflicts**: only happen if two people edit the same file. Stay in your folder, coordinate on contracts.ts.
