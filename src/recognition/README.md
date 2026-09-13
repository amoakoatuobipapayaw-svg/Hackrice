# Recognition workstream (A)

Read the repository's `CLAUDE.md` and `PLAN.md` before changing the integration.
This module preserves `SignRecognition` and `SignResult` from `src/lib/contracts.ts`.
All changes in this workstream are inside `src/recognition/`.

## Try the recognition lab

With the team's dependencies installed, run `npm run dev` at the repo root and
open `http://localhost:5173/src/recognition/index.html` (use Vite's printed port).
This is a development-only entry; the production app still uses B's game screens.

1. Leave Mock mode checked and press Start. A, B, THANK YOU, 1, and 5 cycle with
   release intervals. Each stable hold confirms once after one second.
2. Press Stop, uncheck Mock mode, choose a target, and press Start.
3. Allow the webcam. The first start downloads MediaPipe JS/WASM and its model.
4. Hold your full hand upright in good lighting. Try L, I, or Y first. Both video
   and overlay are mirrored, while classification uses unmirrored coordinates.
5. Stop releases the camera. Switching modes, leaving the tab, or unmounting also
   releases it. Use Start again when returning to the tab.

The readout explains weak guesses, target mismatches and the release needed after
a confirmed hold. "Show experimental targets" adds the remaining static letters
and zero for inspection; it does not lower the 0.8 confirmation threshold.

## Integration for B

The mock is ready now:

```tsx
import { useMockSignRecognition } from '../recognition/mock';

const recognition = useMockSignRecognition({
  target: 'A',
  onConfirm: result => console.log('Confirmed', result.label),
});
// Start/stop from buttons or an effect. start() is idempotent.
```

For the real recognizer, mount the video/canvas before calling start:

```tsx
import { useSignRecognition } from '../recognition/useSignRecognition';

const recognition = useSignRecognition({
  vocabulary: 'letters', // use 'numbers' for Math mode
  target: 'L',
  onConfirm: result => console.log('Correct rep', result.label),
});

return <>
  <div className="relative aspect-[4/3] max-w-2xl">
    <video ref={recognition.videoRef} muted playsInline
      className="h-full w-full -scale-x-100" />
    <canvas ref={recognition.canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100" />
  </div>
  <button onClick={recognition.start}>Start</button>
  <button onClick={recognition.stop}>Stop</button>
</>;
```

- `current`: current best guess or null. Do not award points for every frame.
- `onConfirm`: one callback per stable, confident hold matching `target`.
- `holdProgress`: 0–1; `confirmed`: last confirmed result; `correctReps`: session count.
- Without a target, any stable supported label can confirm; this is recognition,
  not a correctness judgment. Games should always supply their target.
- Release or change the sign to repeat the same target. Call `reset()` for a new round.
- Defaults: 1000 ms hold and 0.8 rule-match threshold. Tracking gaps over 250 ms,
  unknown/weak/wrong guesses, and target changes reset accumulated evidence.
- `status` and `error` expose loading, permission, camera and model failures.
- No automatic camera start. Starting twice doesn't create duplicate streams.

## What is and isn't implemented

There are prototype static rules for A–I, K–Y and digits 0–9. Letter rules beyond
I/L/V/W/Y and the zero rule return deliberately lower scores, so they do not confirm
at the default threshold. This is an initial heuristic baseline, not validated accuracy.
`confidence` is a heuristic match score, not a calibrated probability.
It now varies with joint straightness, thumb placement, contact distance and
finger separation instead of returning a fixed 85%. The weakest required feature
limits the score; near-threshold contact or ambiguous fingers cannot earn a rep
just because they barely pass the label rule. Clear matches can reach 98%, which
is still a geometric score and does not mean 98% measured accuracy.

The letter/number vocabulary separates overlapping shapes (for example V versus 2).
The desired target never forces the classifier's answer. The thumb and occlusion
rules for A/E/M/N/S/T in particular need real-camera calibration or a trained classifier.

J and Z now have a real (but equally untested) recognition path: `motionClassifier.ts`
buffers the tracked fingertip's position while the hand holds a motion-candidate
handshape (`motionCandidateShape()` — the I shape for J, a bare index point for Z),
then scores the resulting trajectory against a small geometric template for each
letter (a downward hook for J, a horizontal-diagonal-horizontal zigzag for Z),
direction-agnostic so it doesn't assume a particular handedness or camera-mirroring
convention. `useSignRecognition.ts` latches a detected gesture as `current` for
~1.3s so the existing hold-to-confirm tracker — built for a held pose, not a
momentary motion — gets a real window to confirm it; `holdTracker.ts` itself is
unchanged. J and Z share signClassifier's `CONFIDENCE_CAP` table and start at the
same untested 0.5 tier as any other never-live-tested letter — promote them the
same one-line way, after testing on a real camera. Word signs, including THANK YOU,
exist in the mock only; full-word recognition is not implemented.

No WLASL or other external training dataset has been adopted. Test fixtures are
synthetic coordinates and establish behavior, not ASL correctness. Validate signs
with an ASL-fluent person and test different signers, lighting and handedness.

## Gemini coaching and D's backend

`geminiCoach(summary, signal?)` preserves the existing contract:
`POST /api/coach` with `{ summary: string }`, expecting `{ line: string }`.
Requests time out after 8 seconds; malformed/error responses are rejected.

Coaching is opt-in (`coaching: true`). While a hand is visible, the real hook sends
a rounded landmark summary at most once every five seconds, with at most one
request outstanding. No raw camera frame is uploaded. Stopping cancels the request.
Recognition continues when coaching fails. A single snapshot cannot support claims
about movement; the summary explicitly tells the coach this.

Plain Vite does not serve Vercel's `/api` functions. To exercise real coaching, D must
provide a local Vercel environment or deployed integration with `GEMINI_API_KEY` set
server-side. There is no browser Gemini key. Live Gemini output is not yet verified.

## Dependencies and checks

MediaPipe is loaded from jsDelivr's pinned `@mediapipe/tasks-vision@0.10.32` browser
module with matching WASM; the model comes from Google's MediaPipe model storage.
Internet access is needed on first use. A deployment's CSP must allow these hosts.
No root package or lockfile change is required for this browser-loader approach.
Inference is throttled to about 15 fps on the main thread; a worker is a future
performance improvement if testing shows UI stalls.

```bash
node src/recognition/tests/run.mjs
npm run build
npm run lint
```

The tests use the existing TypeScript dependency and Node's built-in test runner.
They check hold timing/release, tracking loss, target changes, basic geometric
invariance, vocabulary separation, digits 1–9, thumb-related V/W false positives,
video aspect ratio, invalid landmarks, varying contact scores, rejection of
near-miss reps and the coaching API contract (13 tests in `core.test.ts`), plus
J/Z trajectory recognition, mirror/scale invariance, J-vs-Z disambiguation, static
holds never registering as motion, and motion-candidate handshape gating
(11 tests in `motion.test.ts`) — 24 total.

Setup note for D: with npm 12, the incoming lockfile failed `npm ci` because two
`@emnapi` entries were missing. This session used `npm install --package-lock=false`
to install locally without rewriting shared files. The lockfile still needs review
by its owner. Node/npm were supplied through this desktop task's bundled runtime;
if your terminal says `npm: command not found`, install a current Node LTS runtime.

References: [MediaPipe web guide](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js),
[ASL fingerspelling reference](https://www.lifeprint.com/asl101/pages-layout/fingerspelling.htm).

## Motion robustness update

J/Z paths are resampled by distance travelled rather than frame count, so uneven
signing speed and brief pauses do not shift the apparent stroke boundaries.
Z requires a downward middle stroke; horizontal mirroring is still supported.
Nonfinite samples, non-increasing timestamps, gaps over 250 ms, and scale changes
over 1.8× are rejected. Candidate poses retain the local 250 ms jitter tolerance
and two-second buffer. The gesture duration limit is 1900 ms. A latched gesture
is cleared when the hand disappears, and its trajectory is discarded when the
latch ends so the old motion cannot be reused.

The suite now has 28 tests. J/Z remain capped at 0.5 pending live validation;
use the recognition lab's experimental targets to inspect predictions. Verify
both hands, slow/fast traces, ordinary waving, and release/repeat before promotion.
