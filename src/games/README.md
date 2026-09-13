# Signly game experience

The visual layout follows the sidebar, winding learning path, raised buttons,
and progress-card patterns in https://github.com/sanidhyy/duolingo-clone.
The implementation is original React/Tailwind code; no assets or source code were
copied and no new packages were added. Home renders `Roadmap.tsx`, a unit path
grouped by handshape family (see `signCatalog.ts`'s `UNITS`); a unit shows locked
("coming soon") until every sign in it is confirmable.

White surfaces, green actions and blue selected navigation use shared semantic
tokens in `src/globals.css`, including high-contrast overrides. The sidebar becomes
a compact top navigation on phones. Camera and sign guide sit side by side from
tablet widths.

Lesson targets and unit lock state are DERIVED, not hardcoded: `signCatalog.ts`'s
`LETTER_CATALOG`/`NUMBER_CATALOG` and `isUnitUnlocked()` read straight from
`recognition/signClassifier.ts`'s `DEMO_LETTERS`/`DEMO_NUMBERS`. Promoting a sign
there (see that file's `CONFIDENCE_CAP` table) is what surfaces it in lessons and
unlocks its unit — nothing in `src/games/` needs to change for that. Today only
`core-five` (I/L/V/W/Y) and `numbers-1-9` (1-9) are unlocked; the rest of the
alphabet (including J/Z, which now have a real but equally untested motion-based
path — see `recognition/README.md`) has classifier rules but scores below the
confirm threshold until tested live and promoted.

**Practice and Speed reach past that set on purpose**, via `signCatalog.ts`'s
`confirmFloor(sign)`: a sign's score is capped at its `CONFIDENCE_CAP`, so gating
every sign at the shared 0.8 threshold would make a capped letter impossible to
confirm and hang a round forever. `confirmFloor` passes `minConfidence` per target
— 0.8 for a demo-quality sign, the sign's own cap for anything below it — which
keeps a real evidence floor (a 0.65-capped letter still needs ~0.38 weakest
evidence) at a bar matching how much that shape is trusted today. The caps
themselves are untouched, so Home's roadmap and Math keep reporting what has
actually been validated on a webcam.

## Practice levels

`/lesson` is a five-level course; everything for it is in `src/games/practice/`.
`Lesson.tsx` is now just a router: no params shows `PracticeHub` (the get-ready
card plus the level map), `?level=<n>` plays that level on its own page, and a
`?unit=<id>` link from `Roadmap.tsx` resolves to the smallest level covering that
unit (`levelForSigns`), so existing Home links keep working.

| Level | Pool | Round |
| --- | --- | --- |
| 1 · Your first five | I L V W Y | 5 prompts, in taught order |
| 2 · Thirteen shapes | the five plus the eight next-highest-confidence letters | 8 |
| 3 · The whole alphabet | all 26, J and Z included | 10 |
| 4 · Counting 0 to 9 | all 10 digits | 10 |
| 5 · Everything together | all 36 letters and digits | 12 |

Level 2's thirteen are derived by confidence, not listed, so promoting a sign
re-sorts the set instead of stranding it. A round samples its pool without
repeats; vocabulary (`letters`/`numbers`) is chosen **per target**, which is what
lets Level 5 mix the two. `practiceProgress.ts` keeps the furthest level finished
in localStorage (local-only, like `welcomeProgress.ts` — XP still flows through
`completeRound()`); a locked level refuses in place on the map and gets a whole
`LevelLocked` screen when reached by URL. Finishing a level unlocks the next,
shows `LevelCelebration` (fades on a click anywhere) over `LevelResults`, which
carries the Continue button. If one shape won't confirm, a skip is offered after
ten seconds of *camera* time — a stubborn hand shape can't dead-end a level, and
the results count confirmed and skipped separately.

## Speed modes

`/speed` runs one of three clocks, chosen from the panel at the top of the page
and carried as `?mode=`: Easy 60s ×1 (green), Medium 30s ×1.5 (amber), Hard 15s
×2 (red). The colours are existing semantic tokens, so high contrast swaps them
for free. Prompts come from `speed/deck.ts` — all 36 signs shuffled and dealt one
at a time, with no repeat until the deck is spent and none across a reshuffle
seam either (Speed used to cycle the same five letters forever). Per-mode personal
bests live in `speed/speedBests.ts`, local-only like the Math Lab's.

`UNITS` also holds one **content unit** (`kind: "content"`), rendered by
`Welcome.tsx` at `/welcome` instead of `Lesson.tsx` — a non-camera, non-scored
lesson covering ASL grammar/modality (it isn't signed English; facial expression,
body position, space and movement all carry meaning) plus a small preview of
everyday signs (HELLO, THANK YOU, PLEASE, SORRY, MY NAME IS, NICE TO MEET YOU).
Those signs are instructional content only — recognition doesn't support word
signs yet — and are explicitly flagged in the UI as unreviewed by a fluent ASL
signer or Deaf educator; treat them as a placeholder for real content review, not
as authoritative. `welcomeProgress.ts` tracks a local "seen it" flag (not XP/streak
state, kept out of `contracts.ts`/`localProfile.ts` on purpose) so `Roadmap.tsx`
can show "✓ READ" once visited. `isUnitUnlocked()` treats every content unit as
always unlocked.

## Math Lab

`/math` is a hub of nine games (three Easy, three Medium, three Hard), each on a
different area of maths — arithmetic, counting, comparison, times tables,
sequences, fractions, algebra, logic, calculus. `MathMode.tsx` renders the hub,
or one game when the URL carries `?game=<id>`. Everything for it lives in
`src/games/math/` — see `src/games/math/README.md`.

- `GameLayout.tsx`: mode navigation, page headings, progress and profile entry.
  Optional `backTo`/`backLabel` (a level page returns to its map), `progressClass`
  (Speed colours its own timer bar), `headerAside` (the Speed mode switcher) and
  `footnote` (a countdown is the one screen where "no timers on your learning"
  isn't true). All default to the previous behaviour.
- `Roadmap.tsx`: the unit path rendered on Home; locked/unlocked state per unit.
- `Welcome.tsx`: the "Welcome to ASL" content unit (grammar orientation + everyday-sign preview).
- `SignGuide.tsx`: three-step hand-shape instructions and lesson milestones,
  covering every letter — static plus J/Z — and every digit 0-9, so a level or a
  Speed deck never shows a prompt with no written guide. The milestone strip
  adapts to round lengths other than five.
- `useGameRecognition.ts`: `?mock=1` plays any mode without a camera;
  `?mock=stall` never matches the prompt, for testing the coaching states and
  Practice's stuck-sign skip.
- `CameraPanel.tsx`: camera setup, loading, error/retry, pause, detected shape,
  and hold feedback. Both video and overlay remain mounted before camera start.
- `RoundComplete.tsx`: earned XP, confirmed signs, score and retry navigation.
- Lesson stops its camera at completion; retry starts with the camera off.
- Speed pauses the clock during setup, camera errors, and camera pauses.
- Math cancels its pending advancement timer when leaving the screen.

Run `npm run dev` and visit `/lesson`, `/speed`, or `/math`. Choose a local profile
name first. Plain Vite does not serve voice or coaching APIs; those require a
configured Vercel development environment or deployment. Real camera tests should
cover a full lesson, retry, pausing/resuming Speed, and Math voice/sign answers.
The local preview is not a production deployment.
