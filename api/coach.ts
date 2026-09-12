// POST { summary: string } -> { line: string }
// Proxies Google Gemini so GEMINI_API_KEY never reaches the browser.
// Used for periodic qualitative coaching only — never for real-time
// recognition (see CLAUDE.md).
import type { VercelRequest, VercelResponse } from "@vercel/node";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not set" });

  const { summary } = req.body ?? {};
  if (typeof summary !== "string" || !summary.trim()) {
    return res.status(400).json({ error: "summary (string) is required" });
  }

  const prompt = `You are a friendly ASL coach. In one short sentence (max 15 words), give one concrete tip to improve this attempt: ${summary}`;

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  );

  if (!geminiRes.ok) {
    const text = await geminiRes.text();
    return res.status(502).json({ error: "Gemini request failed", detail: text });
  }

  const data = (await geminiRes.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const line: string =
    data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "Keep practicing!";

  return res.status(200).json({ line });
}
