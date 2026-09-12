# SignQuest

> Name is not final — see `src/lib/constants.ts`. Read `CLAUDE.md` and `PLAN.md` first; they are the source of truth for scope and workflow.

## Quickstart

```bash
npm install
cp .env.example .env.local   # fill in keys as you get them; app runs fine with none set
npm run dev
```

The app runs with **zero env vars** — Supabase, Persona, Gemini, and ElevenLabs all fall back to mocks/warnings so `npm run dev` never breaks. Fill in `.env.local` as real keys become available (see `.env.example`).

**The Supabase database is already live** (one shared project for the whole team). Get `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from whoever holds the Vercel project — either they run `vercel env pull .env.local` and send you the two `VITE_` lines, or paste them in team chat (both are safe client-side per `CLAUDE.md`). Put them in your own `.env.local`; the schema is in `supabase/schema.sql` if you ever need to re-apply it.

## Where you work

Repo structure mirrors `CLAUDE.md`. Stay in your folder; import shared types from `src/lib/contracts.ts`.

| Workstream | Folder(s) | Owns |
|---|---|---|
| **A** — Recognition | `src/recognition/` | webcam, MediaPipe hand tracking, sign classifier, Gemini coach call |
| **B** — Games | `src/games/` | Lesson, Speed Challenge, Math Mode, scoring |
| **C** — Voice | `src/voice/` | ElevenLabs TTS/STT, accessibility |
| **D** — Shell/meta/backend | `src/lib/`, `src/meta/`, `src/app/`, `api/` | contracts, Supabase, serverless proxies, streaks/XP, leaderboard, Persona gate |

Every workstream folder already has real stub files wired into the app (routes in `src/app/App.tsx` point at `src/games/*` directly) plus a `mock.ts` your teammates build against until yours is ready. Replace the stub internals — keep the exported names and the types from `contracts.ts` the same so nobody else's imports break.

Shared dumb UI components live in `src/components/ui/` — agree in chat before adding to it.

## Commands

```bash
npm run dev      # start local dev server
npm run build    # typecheck (tsc -b) + production build
npm run lint     # oxlint
```

## Git workflow

- Branch per workstream: `feat/recognition`, `feat/games`, `feat/voice`, `feat/meta`.
- Pull `main` before starting a session and before opening a PR.
- Never commit `.env.local` or secrets — server keys (`GEMINI_API_KEY`, `ELEVENLABS_API_KEY`) live in Vercel env vars only.
- Changing `src/lib/contracts.ts`? Announce it first, then push immediately so everyone rebases.
