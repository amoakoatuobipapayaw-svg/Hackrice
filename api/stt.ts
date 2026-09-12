// POST { audioBase64: string, mimeType?: string } -> { transcript: string }
// Proxies ElevenLabs speech-to-text so ELEVENLABS_API_KEY never reaches the
// browser. Used for Math mode voice answers.
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ELEVENLABS_API_KEY not set" });

  const { audioBase64, mimeType = "audio/webm" } = req.body ?? {};
  if (typeof audioBase64 !== "string" || !audioBase64) {
    return res.status(400).json({ error: "audioBase64 (string) is required" });
  }

  const audioBuffer = Buffer.from(audioBase64, "base64");
  const form = new FormData();
  // scribe_v1 is deprecated; scribe_v2 is the current batch model (same
  // request/response shape). Answers here are always English digits, so
  // skip language auto-detection.
  form.append("model_id", "scribe_v2");
  form.append("language_code", "en");
  form.append("file", new Blob([audioBuffer], { type: mimeType }), "audio");

  const elevenRes = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: form,
  });

  if (!elevenRes.ok) {
    const detail = await elevenRes.text();
    return res.status(502).json({ error: "ElevenLabs STT failed", detail });
  }

  const data = (await elevenRes.json()) as { text?: string };
  return res.status(200).json({ transcript: data.text ?? "" });
}
