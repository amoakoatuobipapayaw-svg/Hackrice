// POST { text: string } -> audio/mpeg bytes
// Proxies ElevenLabs text-to-speech so ELEVENLABS_API_KEY never reaches the
// browser. Used to speak recognized signs and read prompts aloud.
import type { VercelRequest, VercelResponse } from "@vercel/node";

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM"; // "Rachel"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ELEVENLABS_API_KEY not set" });

  const { text } = req.body ?? {};
  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "text (string) is required" });
  }

  const elevenRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({ text, model_id: "eleven_turbo_v2_5" }),
    },
  );

  if (!elevenRes.ok) {
    const detail = await elevenRes.text();
    return res.status(502).json({ error: "ElevenLabs TTS failed", detail });
  }

  const audio = Buffer.from(await elevenRes.arrayBuffer());
  res.setHeader("Content-Type", "audio/mpeg");
  return res.status(200).send(audio);
}
