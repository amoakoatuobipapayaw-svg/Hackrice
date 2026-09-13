// POST { summary: string } -> { line: string }
// Proxies Google Gemini so GEMINI_API_KEY never reaches the browser.
// Used for periodic qualitative coaching only — never for real-time
// recognition (see CLAUDE.md).
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Gemini's Interactions API (generateContent is deprecated — see
// https://ai.google.dev/gemini-api/docs/interactions-breaking-changes-may-2026).
// gemini-3.5-flash-lite, not gemini-3.8-flash: free-tier quota is per-model,
// and heavy testing during the hackathon exhausted 3.8-flash's daily quota
// (confirmed exhausted across a long stretch of this session, not just a
// transient rate limit). Lite is plenty for a one-sentence coaching tip.
const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not set" });

  const { summary } = req.body ?? {};
  if (typeof summary !== "string" || !summary.trim()) {
    return res.status(400).json({ error: "summary (string) is required" });
  }

  const geminiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      model: MODEL,
      system_instruction:
        "You are a friendly ASL coach. In one short sentence (max 15 words), give one concrete tip to improve the user's attempt.",
      input: summary,
      store: false,
    }),
  });

  if (!geminiRes.ok) {
    const text = await geminiRes.text();
    return res.status(502).json({ error: "Gemini request failed", detail: text });
  }

  const data = (await geminiRes.json()) as {
    steps?: { type?: string; content?: { type?: string; text?: string }[] }[];
  };
  const modelOutput = data.steps?.find((step) => step.type === "model_output");
  const line: string =
    modelOutput?.content?.find((c) => c.type === "text")?.text?.trim() ?? "Keep practicing!";

  return res.status(200).json({ line });
}
