// A small "how do you sign this" video lookup backed by a curated subset of
// the Microsoft ASL Citizen dataset (github.com/microsoft/ASL-citizen-code;
// non-commercial research license — fine for this demo, would need
// Microsoft's separate sign-off for any future commercial use). The full
// dataset is 83k+ videos across 2,731 signs in one 42.8 GB zip; extracting
// just the words below is done offline by src/dictionary/tools/, which
// commits only the resulting clips (public/sign-videos/videos/) and this
// index (public/sign-videos/index.json) — nothing fetches the original zip
// at runtime.
//
// The static assets live under /sign-videos, not /dictionary, deliberately:
// the app's /dictionary ROUTE and a same-named /dictionary STATIC directory
// collided on Vercel — a reload on the /dictionary page served the raw
// index.json (Vercel resolved the directory to its one file) instead of the
// SPA's index.html. Keep this name distinct from every route in App.tsx.
export type DictionaryEntry = { file: string; bytes: number };
export type DictionaryIndex = Record<string, DictionaryEntry>;

let cached: Promise<DictionaryIndex> | null = null;

export function loadDictionaryIndex(): Promise<DictionaryIndex> {
  cached ??= fetch('/sign-videos/index.json').then((res) => {
    if (!res.ok) throw new Error(`Failed to load sign dictionary index: HTTP ${res.status}`);
    return res.json() as Promise<DictionaryIndex>;
  });
  return cached;
}

export type MatchedWord = { type: 'video'; word: string; file: string };
export type MissingWord = { type: 'missing'; word: string };
export type PhraseMatch = MatchedWord | MissingWord;

/** ASL Citizen indexes isolated single-word signs, not phrases — a couple of
 * our own target words happen to be two-word glosses (e.g. "THANK YOU"), so
 * this greedily tries a 2-word window before falling back to one word at a
 * time. Words with no matching clip are never dropped, just marked missing,
 * so a caller can render them as plain text instead of silently vanishing. */
export function matchPhrase(index: DictionaryIndex, text: string): PhraseMatch[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const results: PhraseMatch[] = [];
  const clean = (w: string) => w.toUpperCase().replace(/[^A-Z0-9']/g, '');

  let i = 0;
  while (i < words.length) {
    if (i + 1 < words.length) {
      const two = `${clean(words[i])} ${clean(words[i + 1])}`;
      const entry = index[two];
      if (entry) {
        results.push({ type: 'video', word: two, file: entry.file });
        i += 2;
        continue;
      }
    }
    const one = clean(words[i]);
    const entry = one ? index[one] : undefined;
    results.push(entry ? { type: 'video', word: one, file: entry.file } : { type: 'missing', word: words[i] });
    i += 1;
  }
  return results;
}
