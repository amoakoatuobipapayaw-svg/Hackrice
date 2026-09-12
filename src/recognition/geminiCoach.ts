// TODO(A): call /api/coach with a landmark summary (or short frame
// description) every few seconds and return one short coaching line.
export async function geminiCoach(_summary: string): Promise<string> {
  const res = await fetch("/api/coach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ summary: _summary }),
  });
  if (!res.ok) throw new Error(`geminiCoach failed: ${res.status}`);
  const { line } = await res.json();
  return line;
}
