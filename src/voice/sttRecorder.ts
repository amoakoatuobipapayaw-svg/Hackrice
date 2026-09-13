// Records a mic clip and sends it to /api/stt (ElevenLabs) for transcription.
// Answers here are always a single spoken word (a digit).
//
// This used to try to detect speech in real time (a volume threshold, then a
// frequency-band-limited version, then a wider band...) to stop recording as
// soon as you were done talking. Each tuning pass fixed one failure mode and
// quietly introduced another — a threshold tight enough to reject
// background noise also missed quieter or delayed speech; a frequency band
// narrow enough to reject whistling also under-weighted sibilant-heavy words
// like "six"/"seven"/"three". That's a hard signal-processing problem to get
// right without real hardware to tune against, and getting it wrong means
// actually missing what someone said — worse than the extra half-second a
// fixed window costs. So: just record for a fixed, generous duration every
// time. No detection, no threshold, nothing to mistune.
const RECORD_MS = 2800;

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

function log(message: string): void {
  console.debug(`[stt] ${message}`);
}

export type SttPhase = "recording" | "transcribing";

export async function recordAndTranscribe(onPhase?: (phase: SttPhase) => void): Promise<string> {
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
  await new Promise((resolve) => setTimeout(resolve, RECORD_MS));
  log("recording window done, stopping recorder");
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
