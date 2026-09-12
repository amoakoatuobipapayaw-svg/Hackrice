# CLAUDE.md — SignQuest

> Read this fully before writing any code. Four people are building this repo, each driving Claude Code from a separate account. This file is the shared brain that keeps all of us consistent. If you are about to do something this file does not cover, check PLAN.md, then ask in the team chat before inventing a new pattern.

## What we are building (one sentence)
SignQuest is a Duolingo-style web game that teaches American Sign Language: you sign to your webcam, the app scores your hand shape and coaches you, and it can speak your signs out loud, all wrapped in streaks, XP, and a bot-free leaderboard.

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
