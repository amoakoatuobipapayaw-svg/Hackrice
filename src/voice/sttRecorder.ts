// Records a short mic clip and sends it to /api/stt (ElevenLabs) for transcription.
// Fixed-duration recording keeps Math mode's voice answer flow simple: press
// listen, speak the number, get a transcript back.
const RECORD_MS = 4000;

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

export async function recordAndTranscribe(durationMs: number = RECORD_MS): Promise<string> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks: BlobPart[] = [];

  const recorded = new Promise<Blob>((resolve) => {
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType }));
  });

  recorder.start();
  await new Promise((resolve) => setTimeout(resolve, durationMs));
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
