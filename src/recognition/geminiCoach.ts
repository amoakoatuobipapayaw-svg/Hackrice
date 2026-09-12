/** Matches D's existing POST { summary } -> { line } API. No browser API key. */
export async function geminiCoach(summary: string, signal?: AbortSignal): Promise<string> {
  if (!summary.trim()) throw new Error('A hand summary is required for coaching.');
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort',abort,{once:true});
  const timer = setTimeout(abort,8000);
  try {
    const response = await fetch('/api/coach', {
      method:'POST', headers:{'Content-Type':'application/json'}, signal:controller.signal,
      body:JSON.stringify({summary}),
    });
    if (!response.ok) throw new Error(`Coaching unavailable (${response.status}).`);
    const body: unknown = await response.json();
    if (!body || typeof body !== 'object' || !('line' in body) ||
        typeof body.line !== 'string' || !body.line.trim()) {
      throw new Error('Coaching endpoint must return { line: string }.');
    }
    return body.line.trim().replace(/\s+/g,' ').slice(0,240);
  } finally {
    clearTimeout(timer); signal?.removeEventListener('abort',abort);
  }
}
