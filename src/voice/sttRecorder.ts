// Records a mic clip and sends it to /api/stt (ElevenLabs) for transcription.
// Stops automatically once the speaker goes quiet, instead of a fixed
// duration — a fixed window either waits through dead air after a short
// answer (feels slow) or cuts off a longer one mid-word (misheard).
const SILENCE_RMS_THRESHOLD = 0.02;
const SILENCE_HOLD_MS = 900; // quiet time after speech before we call it done
const MIN_RECORD_MS = 400; // ignore the button-press instant as "silence"
const MAX_RECORD_MS = 8000; // safety cap if speech never stops/starts

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
 * safety cap is hit — whichever comes first. */
function waitForSilence(stream: MediaStream): Promise<void> {
  return new Promise((resolve) => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    const start = Date.now();
    let hasSpoken = false;
    let silenceSince: number | null = null;
    let frame: number;

    function finish() {
      cancelAnimationFrame(frame);
      void audioContext.close();
      resolve();
    }

    function tick() {
      analyser.getByteTimeDomainData(data);
      let sumSquares = 0;
      for (const value of data) {
        const centered = (value - 128) / 128;
        sumSquares += centered * centered;
      }
      const rms = Math.sqrt(sumSquares / data.length);
      const now = Date.now();
      const elapsed = now - start;

      if (rms > SILENCE_RMS_THRESHOLD) {
        hasSpoken = true;
        silenceSince = null;
      } else if (hasSpoken && silenceSince === null) {
        silenceSince = now;
      }

      const wentQuietAfterSpeech =
        hasSpoken && silenceSince !== null && now - silenceSince >= SILENCE_HOLD_MS && elapsed >= MIN_RECORD_MS;

      if (wentQuietAfterSpeech || elapsed >= MAX_RECORD_MS) {
        finish();
        return;
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
  });
}

export async function recordAndTranscribe(): Promise<string> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks: BlobPart[] = [];

  const recorded = new Promise<Blob>((resolve) => {
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType }));
  });

  recorder.start();
  await waitForSilence(stream);
  recorder.stop();
  stream.getTracks().forEach((track) => track.stop());

  const audioBlob = await recorded;
  const audioBase64 = await blobToBase64(audioBlob);

  const res = await fetch("/api/stt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audioBase64, mimeType: audioBlob.type || "audio/webm" }),
  });
  if (!res.ok) {
    throw new Error(`stt request failed: ${res.status}`);
  }

  const data = (await res.json()) as { transcript: string };
  return data.transcript;
}
