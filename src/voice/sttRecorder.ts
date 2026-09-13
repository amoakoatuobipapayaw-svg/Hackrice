// Records a mic clip and sends it to /api/stt (ElevenLabs) for transcription.
// Answers here are always a single spoken word (a digit).
//
// This used to guess how long to record — first with a real-time
// voice-activity detector (a volume threshold, then frequency-band-limited,
// then widened...), later a fixed duration. Both approaches hit the same
// wall: nobody's reaction time and speech length is the same, so any guess
// either cuts someone off mid-word or leaves dead air for background noise
// to fill. beginRecording()/stopAndTranscribe() instead let the caller (a
// press-and-hold mic button) decide exactly when to start and stop, the way
// a walkie-talkie works — no detection, no duration to mistune.
const MIN_RECORD_MS = 300; // avoid sending a near-empty clip from a stray tap
const MAX_RECORD_MS = 8000; // safety cap if something forgets to call stop

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

export type RecordingHandle = {
  /** Stops the recording and returns the transcript. Waits out MIN_RECORD_MS
   * first if called too soon after starting. */
  stopAndTranscribe: () => Promise<string>;
};

export async function beginRecording(): Promise<RecordingHandle> {
  const startedAt = performance.now();
  // autoGainControl used to be off because it fought a real-time volume
  // threshold this file no longer has (recording is now purely press/
  // release, not amplitude-gated) — leaving it off just meant quieter or
  // farther-from-the-mic speech got sent to ElevenLabs at too low a level
  // to register as speech at all, while an already-loud clip (e.g. a
  // synthesized TTS clip) had no such problem. Nothing left for it to
  // fight now, so turn it back on.
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  const recorder = new MediaRecorder(stream);
  const chunks: BlobPart[] = [];

  const recorded = new Promise<Blob>((resolve) => {
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType }));
  });

  recorder.start();
  log("recording started");
  const safetyTimer = setTimeout(() => {
    if (recorder.state !== "inactive") recorder.stop();
  }, MAX_RECORD_MS);

  return {
    async stopAndTranscribe(): Promise<string> {
      const elapsed = performance.now() - startedAt;
      if (elapsed < MIN_RECORD_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_RECORD_MS - elapsed));
      }
      clearTimeout(safetyTimer);
      if (recorder.state !== "inactive") recorder.stop();
      stream.getTracks().forEach((track) => track.stop());
      log("recording stopped");

      const audioBlob = await recorded;
      log(`recorder flushed, blob size ${audioBlob.size}B`);
      const audioBase64 = await blobToBase64(audioBlob);
      log("base64-encoded, sending to /api/stt");

      const res = await fetch("/api/stt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64, mimeType: audioBlob.type || "audio/webm" }),
      });
      log(`/api/stt responded (${res.status})`);
      if (!res.ok) {
        // The proxy's error body carries ElevenLabs' actual reason (rate
        // limit, invalid audio, quota, etc.) — surface it instead of just
        // the status code, or every failure looks identical.
        const body = await res.json().catch(() => null) as { error?: string; detail?: string } | null;
        const reason = body?.detail || body?.error;
        throw new Error(reason ? `stt failed (${res.status}): ${reason}` : `stt request failed: ${res.status}`);
      }

      const data = (await res.json()) as { transcript: string };
      log(`transcript: "${data.transcript}" — total`);
      return data.transcript;
    },
  };
}

/** Fixed-duration fallback for a plain tap-once "listen" — kept for
 * VoiceApi.listen()'s contract, but MicButton uses beginRecording() above
 * for press-and-hold instead. */
export async function recordAndTranscribe(onPhase?: (phase: SttPhase) => void): Promise<string> {
  onPhase?.("recording");
  const handle = await beginRecording();
  await new Promise((resolve) => setTimeout(resolve, 2800));
  onPhase?.("transcribing");
  return handle.stopAndTranscribe();
}
