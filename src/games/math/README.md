# Math Lab (`src/games/math/`)

`/math` used to be a single addition game. It is now a **hub of nine games**,
three per difficulty tier, each on a different area of maths. Every game ends
the same way: sign the answer to the camera (or say it), get a worked
explanation, score points, earn XP toward the shared leaderboard.

Everything here lives under `src/games/`. `MathMode.tsx` reads a `?game=<id>`
query param — no route, `App.tsx`, or other workstream's file was touched.

| Tier | Game | Topic | Answer |
| --- | --- | --- | --- |
| Easy | Add & Subtract | Arithmetic | 1 digit |
| Easy | Count the Dots | Counting | 1 digit |
| Easy | Bigger or Smaller | Comparison | 1 digit |
| Medium | Times Tables | Multiplication & division | 1 digit |
| Medium | Pattern Finder | Sequences & patterns | 1 digit |
| Medium | Fraction Bites | Fractions & percentages | 1 digit |
| Hard | Solve for x | Algebra | up to 2 digits |
| Hard | Logic Gate | Logic & sets | 1 digit |
| Hard | Calculus Corner | Differential & integral calculus | up to 2 digits |

## The rule every generator obeys

The classifier confirms digits **1–9** only, so **no answer may contain a 0**
(`isSignable()` in `types.ts`). Two-digit answers are signed one digit at a
time, left to right, each digit its own hold-to-confirm. `tests/math.test.ts`
generates ~18,000 problems across all nine games and asserts this, plus that
each displayed expression actually equals its stated answer.

## Files

| File | Purpose |
| --- | --- |
| `types.ts` | `MathGameDef`, `Problem`, `ProblemDisplay` (display data, never JSX), `isSignable`, `answerDigits`. |
| `easyGames.ts` / `mediumGames.ts` / `hardGames.ts` | The nine pure generators. Each takes `(index, rng)` — `index` ramps difficulty inside a round, `rng` is injectable for tests. |
| `games.ts` | The catalog: `MATH_GAMES`, `findGame`, `gamesByDifficulty`, `gameHref`. |
| `scoring.ts` | Combo multiplier, difficulty weight, XP, `toRoundResult` → contracts' `RoundResult`. |
| `useMathRound.ts` | Round state machine: problems, digits entered, attempt outcome, finish → `completeRound()`. |
| `MathHub.tsx` | The nine panels, grouped by tier, plus lab progress and the "more games in development" note. |
| `MathGame.tsx` | One screen that plays any game; wires camera + mic. |
| `MathIntro.tsx`, `GameHeader.tsx`, `ProblemView.tsx`, `AnswerSlots.tsx`, `AnswerInputs.tsx`, `CoachCard.tsx`, `MathResults.tsx` | The game UI. |
| `HandHint.tsx` | Fitted hand diagram for a digit — reads `handPoses.ts`, scales the pose to fill its frame so it stays legible small. |
| `NumberSigns.tsx` | Collapsible 1–9 reference strip. |
| `GameGlyph.tsx`, `DifficultyBadge.tsx`, `tierStyle.ts` | Per-game maths symbol and tier colours. |
| `bestScores.ts` | Per-game personal bests in `localStorage` (local nicety; XP/leaderboard still go through `completeRound()`). |

## Integration points (unchanged contracts)

- **A (recognition):** `useSignRecognition({ target: '<digit>', vocabulary: 'numbers', coaching: true, onConfirm })`, one digit at a time. `useGameRecognition.ts` swaps in A's mock when the URL has `?mock=1`.
- **C (voice):** every problem is read aloud with `speak()`; the mic path is `MicButton` → `parseSpokenNumber()` (`../mathProblems.ts`), which now understands 0–99 plus the homophones STT returns ("for", "to", "ate").
- **D (meta):** `completeRound()` is the only cross-folder write — XP, streak, and (when verified) the leaderboard post.

## Demo without a camera

Append `?mock=1`: `/math?game=calculus&mock=1`. The mock recognizer is fed the
digit the game is waiting for, so every answer confirms after the normal
one-second hold. Used by the Playwright smoke test and handy as a stage
fallback.

## Checks

```bash
node src/games/tests/run.mjs   # 7 suites, ~18k generated problems
npm run build
npm run lint
```

Real-camera testing still needs a person: start a game, sign a digit, confirm
the hold, and check a two-digit answer in Solve for x or Calculus Corner.
