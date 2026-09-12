# Games workstream (B)

Owns `src/games/`. Three modes share one scoring engine, one round lifecycle,
and one set of gameplay components, so they look and feel like the same game.

## Play it

- `/lesson` — pick Letters or Numbers, sign 5 targets. Each target shows the
  handshape description + tip, live score/combo, the Gemini coaching line, and
  the hold-to-confirm ring. Skip is always available so nothing dead-ends.
- `/speed` — 3-2-1 countdown (camera warms up during it), then 45 s of prompts.
  Points = (10 + speed bonus up to +10 within 6 s) × combo multiplier
  (x1.5 at 3, x2 at 5, x3 at 10). Skip breaks the combo.
- `/math` — 5 single-digit problems, 20 s each, difficulty ramps (+ → − → ×).
  Answer by signing the digit (numbers vocabulary) or tapping the mic
  (C's `MicButton` → `parseSpokenNumber`, homophones like "for"/"to" accepted).
  Timeout or wrong spoken answer = miss with the correct answer shown.

**No camera? Append `?mock=1`** to any mode URL (e.g. `/lesson?mock=1`). The
mock recognizer is fed the current target so every prompt confirms after the
normal 1 s hold — use it for demos on a laptop without a webcam and for UI work.

## Files

| File | Purpose |
| --- | --- |
| `scoring.ts` | Pure rules: combo multiplier, speed bonus, `recordRep`, XP, `buildRoundResult` (→ `RoundResult` from contracts). No React/browser imports. |
| `gameLogic.ts` | Re-exports `scoring.ts` + `completeRound()` (XP → profile, streak bump, leaderboard post when verified). Never throws. |
| `useRound.ts` | Profile + live `RoundStats` + finish-once semantics shared by all modes. |
| `useGameRecognition.ts` | Switches between A's real hook and A's mock (`?mock=1`). |
| `useCountdown.ts` | Wall-clock countdown (round timer, per-problem timer). |
| `signCatalog.ts` | Confirmable signs (I L V W Y, 1–9) with handshape descriptions; shuffled `pickSigns`. |
| `mathProblems.ts` | Single-digit problem generator with difficulty ramp; spoken-number parser. |
| `CameraPanel.tsx` | Webcam + overlay + start/loading/error states + live guess + hold ring. |
| `TargetCard.tsx`, `ScoreHud.tsx`, `ProgressDots.tsx`, `CoachLine.tsx`, `MathProblemCard.tsx`, `RoundComplete.tsx`, `RequireProfile.tsx` | Gameplay UI pieces. |
| `tests/` | `node src/games/tests/run.mjs` — 11 tests over scoring, math, catalog. |

## Checks

```bash
node src/games/tests/run.mjs
npm run build
npm run lint
```

## Integration notes for the team

- **A (recognition):** we pass `target`, `vocabulary`, `coaching: true` (Lesson only)
  and `onConfirm`. We call `reset()` on every new round and `stop()` when the
  results screen shows. If you add word signs (THANK YOU), add them to
  `signCatalog.ts` with a description and they'll appear in Lesson/Speed.
- **C (voice):** prompts and results are read aloud via `useVoice().speak`
  (captioned by `Caption`); Math voice answers go through `MicButton`.
- **D (meta):** the only cross-folder writes are `completeRound()` →
  `bumpStreak`, `saveLocalProfile`, `postScore` (verified users only). The
  `RoundResult.xp` value is what gets added to the profile.
