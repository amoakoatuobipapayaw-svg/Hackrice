// Records a mic clip and sends it to /api/stt (ElevenLabs) for transcription.
// Answers here are always a single spoken word (a digit), so this is tuned
// to grab that one word and get out: a short calibration window learns the
// room's actual noise floor (a fixed volume threshold either never triggers
// on a quiet mic or never quiets down in a noisy room), then it stops
// shortly after the speaker goes quiet instead of waiting out a long timer.
const CALIBRATION_MS = 200; // learn ambient noise before listening for speech
const NOISE_MARGIN = 0.025; // how much louder than ambient counts as "speaking"
const MIN_SPEECH_THRESHOLD = 0.015; // floor so a silent room doesn't self-trigger
const SILENCE_HOLD_MS = 350; // quiet time after speech before we call it done
const MAX_RECORD_MS = 2500; // one spoken number should never need more than this

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("failed to read recorded audio"));
    reader.readAsDataURL(blob);
  });
}

/** Resolves once the stream has gone quiet after speech was heard, or the
 * safety cap is hit — whichever comes first. Spends the first
 * CALIBRATION_MS learning this mic/room's ambient noise level rather than
 * guessing a fixed volume threshold. */
function waitForSilence(stream: MediaStream): Promise<void> {
  return new Promise((resolve) => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    const start = performance.now();
    let ambientSum = 0;
    let ambientSamples = 0;
    let threshold: number | null = null;
    let hasSpoken = false;
    let silenceSince: number | null = null;
    let frame: number;

    function finish() {
      cancelAnimationFrame(frame);
      void audioContext.close();
      resolve();
    }

    function currentRms(): number {
      analyser.getByteTimeDomainData(data);
      let sumSquares = 0;
      for (const value of data) {
        const centered = (value - 128) / 128;
        sumSquares += centered * centered;
      }
      return Math.sqrt(sumSquares / data.length);
    }

    function tick() {
      const now = performance.now();
      const elapsed = now - start;
      const level = currentRms();

      if (threshold === null) {
        ambientSum += level;
        ambientSamples += 1;
        if (elapsed >= CALIBRATION_MS) {
          threshold = Math.max(MIN_SPEECH_THRESHOLD, ambientSum / ambientSamples + NOISE_MARGIN);
        }
        frame = requestAnimationFrame(tick);
        return;
      }

      if (level > threshold) {
        hasSpoken = true;
        silenceSince = null;
      } else if (hasSpoken && silenceSince === null) {
        silenceSince = now;
      }

      const wentQuietAfterSpeech = hasSpoken && silenceSince !== null && now - silenceSince >= SILENCE_HOLD_MS;

      if (wentQuietAfterSpeech || elapsed >= MAX_RECORD_MS) {
        finish();
        return;
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
  });
}

function log(message: string): void {
  console.debug(`[stt] ${message}`);
}

export type SttPhase = "recording" | "transcribing";

export async function recordAndTranscribe(onPhase?: (phase: SttPhase) => void): Promise<string> {
  // Auto gain control actively works against a volume-threshold VAD — it
  // continuously renormalizes level, so speech and silence can end up
  // looking similarly "loud" after processing.
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
  });
  const recorder = new MediaRecorder(stream);
  const chunks: BlobPart[] = [];

  const recorded = new Promise<Blob>((resolve) => {
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType }));
  });

  recorder.start();
  onPhase?.("recording");
  await waitForSilence(stream);
  log("silence detected, stopping recorder");
  recorder.stop();
  stream.getTracks().forEach((track) => track.stop());

  const audioBlob = await recorded;
  log(`recorder flushed, blob size ${audioBlob.size}B`);
  const audioBase64 = await blobToBase64(audioBlob);
  log("base64-encoded, sending to /api/stt");
  onPhase?.("transcribing");

  const res = await fetch("/api/stt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audioBase64, mimeType: audioBlob.type || "audio/webm" }),
  });
  log(`/api/stt responded (${res.status})`);
  if (!res.ok) {
    throw new Error(`stt request failed: ${res.status}`);
  }

  const data = (await res.json()) as { transcript: string };
  log(`transcript: "${data.transcript}" — total`);
  return data.transcript;
}
