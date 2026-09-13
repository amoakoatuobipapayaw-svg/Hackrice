// A "how do you sign this" video lookup backed by the Microsoft ASL Citizen
// dataset (github.com/microsoft/ASL-citizen-code; non-commercial research
// license — fine for this demo, would need Microsoft's separate sign-off
// for any future commercial use): 83k+ videos across ~2,675 signs in one
// 42.8 GB zip. Extraction is done offline by src/dictionary/tools/ — nothing
// fetches the original zip at runtime.
//
// The actual video BYTES live in Supabase Storage (the "dictionary" public
// bucket), not in this repo: the full vocabulary is ~600-700MB, which would
// blow Vercel's Hobby-plan 100MB static-file-upload cap if bundled into the
// build. Only this small index.json (public/sign-videos/index.json — word
// -> { file, bytes }) is a committed static asset; video URLs are built
// from it at runtime via videoUrl() below.
//
// The static index lives under /sign-videos, not /dictionary, deliberately:
// the app's /dictionary ROUTE and a same-named /dictionary STATIC directory
// collided on Vercel — a reload on the /dictionary page served the raw
// index.json (Vercel resolved the directory to its one file) instead of the
// SPA's index.html. Keep this name distinct from every route in App.tsx.
export type DictionaryEntry = { file: string; bytes: number };
export type DictionaryIndex = Record<string, DictionaryEntry>;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const DICTIONARY_BUCKET = 'dictionary';

/** Builds a dictionary video's public Supabase Storage URL from its index.json `file` path. */
export function videoUrl(file: string): string {
  if (!SUPABASE_URL) throw new Error('VITE_SUPABASE_URL not set — dictionary videos are hosted on Supabase Storage');
  return `${SUPABASE_URL}/storage/v1/object/public/${DICTIONARY_BUCKET}/${file}`;
}

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
