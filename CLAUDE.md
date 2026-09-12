# CLAUDE.md — SignQuest

> Read this fully before writing any code. Four people are building this repo, each driving Claude Code from a separate account. This file is the shared brain that keeps all of us consistent. If you are about to do something this file does not cover, check PLAN.md, then ask in the team chat before inventing a new pattern.

## What we are building (one sentence)
SignQuest is a Duolingo-style web game that teaches American Sign Language: you sign to your webcam, the app scores your hand shape and coaches you, and it can speak your signs out loud, all wrapped in streaks, XP, and a bot-free leaderboard.

## Status
Phase 0 scaffolding (D) is done and on `main`: `contracts.ts`, the Vite/React/TS/Tailwind app shell with routing, `src/lib/supabase.ts`, the `/api` proxies, and real-but-stub files + mocks in `recognition/`, `games/`, `voice/`, `meta/`. `npm run dev` and `npm run build` both work with zero env vars set (fall back to mocks). The **Supabase database is live** — one shared project provisioned through Vercel, schema in `supabase/schema.sql`. Ask whoever holds the Vercel project (`vercel env pull .env.local`, or copy `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` from them) so everyone's app points at the same leaderboard. **The app is deployed:** https://signquest-flame.vercel.app (redeploy manually with `vercel deploy --prod` until Git auto-deploy is sorted — see PLAN.md). Recognition (A) and voice (C) are merged into `main`; B's game integration is next. Pull `main` and see the recognition handoff below and PLAN.md for what's next.

## Recognition handoff — A to B (2026-09-12)
A's recognition engine is merged into `main`; it is ready for B to integrate into `src/games/`. B owns the game-screen wiring and scoring. A continues recognition testing and fixes. The deployed Math page is still a stub with the voice path wired; it does not yet mount the recognizer.

- Import `useSignRecognition` from `../recognition/useSignRecognition`. For Math, call `useSignRecognition({ vocabulary: 'numbers', target: String(answer), coaching: true, onConfirm })` inside the component. For lessons, use `vocabulary: 'letters'` and a supported letter target.
- Mount a `<video ref={recognition.videoRef} muted playsInline />` and a canvas with `ref={recognition.canvasRef}` over it before calling `recognition.start()` from a Start button. Match the video/canvas size and mirror both together. Provide Stop and display `status`/`error`. Full JSX examples are in `src/recognition/README.md`.
- Award a correct rep from `onConfirm`, not from each `current` update. Defaults require the target label to remain stable for about one second with a rule-match score of at least 0.8. Use `holdProgress` for feedback and `reset()` for a new round. Release or change the sign before repeating the same target.
- Begin the real-camera demo with letters I/L/V/W/Y and single-digit answers 1–9. Zero and the other static letters are experimental and do not confirm at the default threshold. J/Z motion and full-word signs such as THANK YOU are not implemented; THANK YOU exists in the mock only. Keep Math answers within the supported range for now.
- `confidence` is a geometric rule-match score, not measured recognition accuracy. A target checks correctness; it never forces the classifier to output that label.
- `/api/coach` is live: a synthetic-summary POST was verified to return HTTP 200 and a coaching line. The hook's `coaching: true` sends a landmark summary at most every five seconds while a hand is visible; render `coachingLine`. Keys stay server-side. Plain Vite does not serve this endpoint; use the deployed app or a configured Vercel development environment.
- `useMockSignRecognition` from `../recognition/mock` remains available for UI work without a camera. The local recognition lab is `/src/recognition/index.html` on Vite's printed port; it is a development-only page, not a deployed game route.
- Recognition has 13 passing unit tests (`node src/recognition/tests/run.mjs`); synthetic fixtures check code behavior, not real-world ASL accuracy. After B integrates, test camera start/stop, target confirmation, scoring and coaching together on the deployed game screen.

## The one demo that has to work
Sit in front of the webcam, a prompt says "sign THANK YOU", you sign it, the app recognizes it, scores you, gives one line of AI coaching, and ElevenLabs speaks "thank you" aloud. Then your score posts to a leaderboard next to your verified name. Everything else is support for that moment. When in doubt, protect this loop.

## Track and sponsors (what each is for, and its limit)
- **Games & Gamification track** (the one track we submit to). The whole app is a game loop: lessons, speed challenges, streaks, XP, leaderboard.
- **Google Gemini API**: powers the qualitative coaching feedback ("move your right hand slower", "keep your thumb tucked") and generates lesson hints. This is our Gemini prize hook. Do NOT use Gemini for real-time recognition (too slow); use it for periodic feedback only.
- **In-browser hand tracking (MediaPipe Hand Landmarker, by Google)**: the real-time engine that gives 21 hand landmarks per frame. This does the actual recognition and scoring, locally, no server.
- **ElevenLabs**: text to speech (speak the recognized sign, read prompts) and speech to text (voice answers in Math mode). Core to the accessibility story.
- **Persona**: verify the user is a real human ONCE before they can post to the global leaderboard, so scores are one-person-one-account. Sandbox only. Roughly ten lines of their widget. Do not build a full auth system around it.
- **Solana (STRETCH, cut first if behind)**: mint a "streak badge" on devnet as an on-chain achievement. Fully isolated in its own module. Never let Solana block the core loop.

## Scope guardrails (what we are NOT building)
- No finance features. No banking, no Nessie, no Capital One. It does not fit ASL and it costs us the Relevance score.
- Math mode is NOT a separate app. It reuses the same sign-recognition core: a problem appears, you answer by signing the number in ASL, or by speaking it via ElevenLabs.
- No native mobile app until the web app is fully done and demo-ready. Web first. Mobile is a bonus only if we finish early.
- Recognition MVP is static ASL: the alphabet (A-Z) and numbers (0-9), plus a small set of full-word signs we hardcode. Do not try to recognize complex dynamic multi-motion signs. Depth over breadth.

## Tech stack (do not swap without team agreement)
- **Frontend**: Vite + React + TypeScript + Tailwind CSS. Functional components and hooks only.
- **Hand tracking**: `@mediapipe/tasks-vision` (Hand Landmarker) in the browser.
- **AI coaching**: Google Gemini via a serverless proxy (see keys below).
- **Voice**: ElevenLabs TTS + Speech-to-Text via the serverless proxy.
- **Backend + data**: Supabase (Postgres) for profiles, streaks, XP, and the leaderboard. Use the `supabase-js` client.
- **Hosting**: Vercel. Serverless functions live in `/api` and proxy Gemini and ElevenLabs so keys stay server-side. Vercel gives us a public URL for the video and for testing on a phone.
- **Identity**: Persona embedded/hosted flow (sandbox).
- **Solana (stretch)**: `@solana/web3.js` + Phantom wallet adapter, devnet only.

## Repo structure and folder ownership
Each workstream owns one folder and only edits inside it. You import other teams' work through typed interfaces in `src/lib/contracts.ts`. Until a real module exists, import the MOCK from that folder.

```
signquest/
  api/                     # (D) serverless proxies: coach.ts, tts.ts, stt.ts
  src/
    lib/
      contracts.ts         # (D owns) shared TYPES + hook signatures. Edit only by announcing first.
      supabase.ts          # (D) db client + queries
    recognition/           # (A) webcam + MediaPipe + sign classifier + Gemini coach call
      useSignRecognition.ts
      handLandmarker.ts
      signClassifier.ts
      geminiCoach.ts
      mock.ts              # A provides a fake recognizer so B can build before A is done
    voice/                 # (C) ElevenLabs TTS + STT
      useVoice.ts
      mock.ts
    games/                 # (B) Lesson, SpeedChallenge, MathMode, scoring
      Lesson.tsx
      SpeedChallenge.tsx
      MathMode.tsx
      gameLogic.ts
    meta/                  # (D) Leaderboard, Streak, Profile, PersonaGate, solanaBadge (stretch)
    app/                   # (D) App shell, routing, Home, Nav, onboarding
    components/ui/         # shared dumb components (Button, Card, Timer). Agree before adding.
  .env.example
  CLAUDE.md
  PLAN.md
```

## The golden rule for four parallel coders
1. `src/lib/contracts.ts` is merged to `main` FIRST, before feature work. It defines every type and hook signature that crosses a folder boundary.
2. Each workstream builds against MOCKS from other folders, not the real thing. Integration happens at a scheduled checkpoint, not continuously.
3. You edit only your own folder. If you need a change in `contracts.ts`, announce it in the team chat, make it, and push immediately so everyone rebases.
4. Pull `main` before you start any session and before you open a PR.

## Git workflow
- One shared GitHub repo. `main` must always run and always be demoable.
- Branch per workstream: `feat/recognition`, `feat/voice`, `feat/games`, `feat/meta`.
- Small, frequent PRs. Anyone can merge after a quick look, but never merge something that breaks `npm run dev`.
- Never commit secrets. Keys live in `.env.local` (git-ignored) and in Vercel env vars.
- Commits and pushes run as the human driving the session, full stop. Claude Code must never add itself (or any AI) as an author or co-author on a commit — no `Co-Authored-By` trailer, no separate identity, nothing that would list an AI as a contributor on the GitHub repo. If your Claude Code setup normally appends that trailer, drop it for this repo.
- Don't commit non-code hackathon docs (handbooks, slide decks, etc.) — see `.gitignore`.

## Secrets (put in .env.local, never commit)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_PERSONA_TEMPLATE_ID=
# server-side only, set in Vercel, used by /api functions:
GEMINI_API_KEY=
ELEVENLABS_API_KEY=
```

## Coding conventions
- TypeScript strict mode on. No `any` unless truly unavoidable.
- Keep files small and single-purpose. A component over ~150 lines should be split.
- Tailwind for styling. No separate CSS files except one globals.css.
- Every cross-folder value flows through a type in `contracts.ts`.
- Comment the WHY, not the what.

## North star
Judging is Technical Rigor, Originality, UX and Design, Practicality and Impact, and Relevance, scored in a 2-minute live demo. A polished, working, accessible ASL game that clearly serves Deaf and hard-of-hearing communities beats a sprawling app that half-works. Build the loop, make it beautiful, tell the story.
