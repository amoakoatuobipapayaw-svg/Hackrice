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
confirm threshold until tested live and promoted. `Lesson.tsx` reads a `?unit=<id>`
query param (set by `Roadmap.tsx`'s links) to scope its five targets to one unit,
falling back to the full unlocked letter catalog if the param is absent, unknown,
or not yet unlocked.

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
- `Roadmap.tsx`: the unit path rendered on Home; locked/unlocked state per unit.
- `Welcome.tsx`: the "Welcome to ASL" content unit (grammar orientation + everyday-sign preview).
- `SignGuide.tsx`: three-step hand-shape instructions and lesson milestones,
  covering every static letter (not just the currently-unlocked ones) so a unit
  is ready to use the moment it unlocks.
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
