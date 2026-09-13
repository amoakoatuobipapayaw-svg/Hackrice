// Renders a word/phrase as a row of real ASL video clips, one per matched
// word. Words with no clip yet are simply skipped — ASL Citizen indexes
// isolated signs, not every English function word, and a phrase like
// "my name is" is never going to have a clip for "is". Shared by
// Welcome.tsx's everyday-signs preview and SignLookup.tsx's search results,
// both backed by the same curated ASL Citizen subset (src/dictionary/index.ts).
import { useEffect, useState } from "react";
import { loadDictionaryIndex, matchPhrase, videoUrl, type PhraseMatch } from "../dictionary";
import { SignVideoClip } from "./SignVideoClip";

export function SignPhrase({ text, fill = false }: {
  text: string;
  /** Lets clips grow to fill the row instead of sitting at a fixed small
   * width — Welcome's one-per-card layout otherwise leaves the rest of the
   * card empty next to a single small clip. Dictionary search results keep
   * the fixed width, since a long phrase there can return many clips. */
  fill?: boolean;
}) {
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

  const videos = matches.filter((match): match is Extract<PhraseMatch, { type: "video" }> => match.type === "video");
  if (videos.length === 0) return <p className="text-sm text-muted">No sign video for “{text}” yet.</p>;

  // One row, one column per clip — never wraps a longer phrase onto a second
  // row. A card with more clips needs more width to keep them the same size
  // as a shorter phrase's (Welcome.tsx gives a 3+-word entry the full row for
  // exactly this reason); this component just always lays them out in a
  // single line and lets the container decide how much room that gets.
  return (
    <div
      className={fill ? "grid items-start gap-4" : "flex flex-wrap items-start gap-4"}
      style={fill ? { gridTemplateColumns: `repeat(${videos.length}, 1fr)` } : undefined}
      aria-label={`ASL video for "${text}"`}
    >
      {videos.map((match, i) => (
        <figure key={`${match.word}-${i}`} className={!fill ? "w-36 shrink-0" : ""}>
          <SignVideoClip src={videoUrl(match.file)} word={match.word} />
          <figcaption className="mt-1.5 text-center text-[11px] font-bold tracking-wide text-muted uppercase">{match.word}</figcaption>
        </figure>
      ))}
    </div>
  );
}
