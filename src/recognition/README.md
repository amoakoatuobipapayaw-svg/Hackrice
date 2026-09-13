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

J/Z use an opt-in stroke detector (`experimentalMotion: true`, enabled in the
lab and in Lesson/SpeedChallenge). A stable seed pose starts tracking, then
temporary finger flexion is tolerated. Corner searches check a downward-and-rising
hook for J or horizontal/down-diagonal/horizontal strokes for Z. Paths may take
200–4500 ms. Small jitter is removed in palm-size units; broken tracking, invalid
samples and large scale jumps are rejected. A completed gesture confirms directly
once if its target and score match. It is not replayed through the static
one-second hold. Release before repeating. The motion score is geometric
evidence, not calibrated accuracy or the static cap. Both letters are now
live-tested and promoted to demo tier (see the trained-model section below).

### J/Z: a trained model layered on top of the heuristic

`useSignRecognition` also loads a small trained model (`motionModel.ts`) alongside
MediaPipe at `start()` and tries it first for J/Z; the geometric heuristic above
(`classifyMotion`) is the automatic fallback whenever the model hasn't loaded,
errors, or doesn't clear its own confidence floor — nothing about the heuristic
changed, and `createMotionTracker().update()` still works exactly as before if
no model is passed in (its 3rd argument is optional). Pass
`disableMotionML: true` to force pure-heuristic scoring if the model ever needs
to be ruled out under demo pressure.

The model is a tiny 1D-CNN trained entirely on **synthetic** trajectories
(`src/recognition/ml/generateDataset.mjs` procedurally generates thousands of
randomized candidate strokes and labels them by running them through the
existing `classifyMotion` heuristic — the heuristic acts as the ground-truth
labeler, so the model can only learn a smoother generalization of a decision
boundary the team already validated, never something worse). No hand-collected
webcam data was used. `src/recognition/ml/train.mjs` trains the model with
`@tensorflow/tfjs-node` and re-validates it against `tests/motion.test.ts`'s
hand-written `jPath()`/`zPath()`/`staticJitter()` fixtures before saving.

To regenerate the dataset and retrain:
```bash
node src/recognition/ml/generateDataset.mjs
node src/recognition/ml/train.mjs
```
This overwrites `public/models/motion-model/model.json` + `weights.bin` (committed,
~16 KB total) — the browser loads that path directly with `tf.loadLayersModel()`,
and `@tensorflow/tfjs` itself is loaded from jsDelivr at runtime (`motionModel.ts`),
the same pattern `handLandmarker.ts` uses for MediaPipe. `@tensorflow/tfjs-node` is
a devDependency used only by the two scripts above — it is never bundled.

**Live-tested and promoted**: both J and Z have since been confirmed working on
a real webcam (not just synthetic trajectories and the hand-written fixtures),
and `signClassifier.ts`'s `CONFIDENCE_CAP` for both is now at demo tier — the
"Motion letters" lesson unit is unlocked. The thresholds in `classifyMotion`
were loosened from their original synthetic-only tuning during that live
testing (see the comments in `motionClassifier.ts`); if real-world accuracy
ever regresses, that's the first place to look, and `disableMotionML` remains
available to force pure-heuristic scoring without a code change.

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
`@tensorflow/tfjs@4.22.0` is loaded the same way (jsDelivr's `+esm` build) for the
J/Z motion model's inference. Internet access is needed on first use. A
deployment's CSP must allow these hosts. No root package or lockfile change is
required for either browser-loader approach — `@tensorflow/tfjs-node` is a
devDependency for the offline training scripts only (see above), never shipped
to the browser. Inference is throttled to about 15 fps on the main thread; a
worker is a future performance improvement if testing shows UI stalls.

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
(17 tests in `motion.test.ts`), plus the ML feature extractor's normalization,
the ML/heuristic dispatch gate, and — if `ml/train.mjs` has produced a model
artifact — the trained model against the exact `jPath()`/`zPath()`/`staticJitter()`
fixtures above (4 tests in `motionModel.test.ts`, the last one skipping quietly
without an artifact or `@tensorflow/tfjs-node`) — 34 total.

Setup note for D: with npm 12, the incoming lockfile failed `npm ci` because two
`@emnapi` entries were missing. This session used `npm install --package-lock=false`
to install locally without rewriting shared files. The lockfile still needs review
by its owner. Node/npm were supplied through this desktop task's bundled runtime;
if your terminal says `npm: command not found`, install a current Node LTS runtime.

References: [MediaPipe web guide](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js),
[ASL fingerspelling reference](https://www.lifeprint.com/asl101/pages-layout/fingerspelling.htm).

Motion rewrite validation: 30 tests total, including partial-path rejection,
uneven timing, mirror/scale invariance and one-shot streaming completion.
