// Renders a word/phrase as a row of real ASL video clips (one per matched
// word), falling back to plain labeled text for words with no clip yet —
// never silently drops a word. Shared by Welcome.tsx's everyday-signs
// preview and SignLookup.tsx's search results, both backed by the same
// curated ASL Citizen subset (src/dictionary/index.ts).
import { useEffect, useState } from "react";
import { loadDictionaryIndex, matchPhrase, type PhraseMatch } from "../dictionary";

export function SignPhrase({ text }: { text: string }) {
  const [matches, setMatches] = useState<PhraseMatch[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadDictionaryIndex()
      .then((index) => { if (!cancelled) setMatches(matchPhrase(index, text)); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [text]);

  if (error) return <p className="text-sm text-muted">Sign videos aren’t available right now.</p>;
  if (!matches) return <p className="text-sm text-muted" aria-live="polite">Loading sign videos…</p>;

  return (
    <div className="flex flex-wrap items-start gap-3" aria-label={`ASL video for "${text}"`}>
      {matches.map((match, i) =>
        match.type === "video" ? (
          <figure key={`${match.word}-${i}`} className="w-28 shrink-0">
            <video
              src={`/dictionary/${match.file}`}
              controls
              muted
              playsInline
              preload="none"
              className="w-full rounded-lg border border-line bg-canvas"
            />
            <figcaption className="mt-1 text-center text-[11px] font-bold tracking-wide text-muted uppercase">{match.word}</figcaption>
          </figure>
        ) : (
          <span key={`${match.word}-${i}`} className="mt-2 rounded-md bg-soft px-2 py-1 text-xs text-muted" title="No sign video yet">
            {match.word} <span aria-hidden="true">·</span> <span className="italic">no video yet</span>
          </span>
        ),
      )}
    </div>
  );
}
