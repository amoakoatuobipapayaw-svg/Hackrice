// Records a mic clip and sends it to /api/stt (ElevenLabs) for transcription.
// Answers here are always a single spoken word (a digit), so this is tuned
// to grab that one word and get out: a short calibration window learns the
// room's actual noise floor (a fixed volume threshold either never triggers
// on a quiet mic or never quiets down in a noisy room), then it stops
// shortly after the speaker goes quiet instead of waiting out a long timer.
// Biased toward reliably capturing a real (if quiet or slightly delayed)
// answer over speed — a missed number is worse than a half-second of
// extra latency, and a false trigger from noise just costs a free retry
// (see MathMode's "didn't catch a number" path), not a wrong answer.
const CALIBRATION_MS = 200; // learn ambient noise before listening for speech
const NOISE_MARGIN = 0.02; // how much louder than ambient counts as "speaking"
const MIN_SPEECH_THRESHOLD = 0.02; // floor so a silent room doesn't self-trigger
const SILENCE_HOLD_MS = 500; // quiet time after speech before we call it done
const MAX_RECORD_MS = 4000; // time to react, start talking, and finish the word
const VOICE_BAND_LOW_HZ = 300; // vowels/formants live here...
const VOICE_BAND_HIGH_HZ = 8000; // ...but sibilants ("s" in six/seven, "th" in
// three) carry real energy up past the old 3400Hz telephone-band cutoff —
// excluding that range made those specific digits look quieter than
// vowel-heavy ones ("one", "four") and easy to miss. Widened it; the
// whistling rejection below doesn't depend on the band being narrow.
const TONAL_PEAK_RATIO = 6; // a pure tone (whistling) concentrates energy in
// one or two bins; speech — including its sibilant hiss — spreads energy
// across many bins, so this ratio still tells them apart in the wider band

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
 * guessing a fixed volume threshold. Measures level as energy in the human
 * voice band rather than raw full-spectrum loudness, so a loud whistle,
 * music, or low rumble is much less likely to be mistaken for speech than
 * a plain volume threshold would allow. */
function waitForSilence(stream: MediaStream): Promise<void> {
  return new Promise((resolve) => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    const binHz = audioContext.sampleRate / analyser.fftSize;
    const lowBin = Math.max(0, Math.floor(VOICE_BAND_LOW_HZ / binHz));
    const highBin = Math.min(data.length - 1, Math.ceil(VOICE_BAND_HIGH_HZ / binHz));

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

    function voiceBandLevel(): number {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      let max = 0;
      for (let i = lowBin; i <= highBin; i++) {
        const v = data[i] / 255;
        sum += v;
        if (v > max) max = v;
      }
      const avg = sum / (highBin - lowBin + 1);
      const isTonal = max > 0 && max / (avg + 1e-6) > TONAL_PEAK_RATIO;
      return isTonal ? avg * 0.3 : avg;
    }

    function tick() {
      const now = performance.now();
      const elapsed = now - start;
      const level = voiceBandLevel();

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
