// Phase 2: scan the ASL Citizen zip's entry list (cheap — a couple of HTTP
// range fetches via the read-ahead cache, not per-entry requests) and find
// which of our target words actually exist as isolated signs, plus how many
// clips/signers are available for each. Video filenames are
// `ASL_Citizen/videos/<id>-<GLOSS>.mp4`, so the gloss is right there — no
// CSV parsing needed for matching.
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { openAslCitizenZip } from './aslCitizenReader.mjs';

// Common greeting/introduction vocabulary — covers the existing Welcome
// unit's "HELLO", "THANK YOU", "PLEASE", "SORRY", "MY NAME IS",
// "NICE TO MEET YOU" once tokenized, plus a few extra common words to make
// free-text phrase lookup less sparse. Real hits/misses reported below —
// nothing here is assumed to exist in the dataset.
const TARGET_WORDS = [
  // Greetings / introductions
  'HELLO', 'THANK YOU', 'PLEASE', 'SORRY', 'BYE', 'MORNING', 'NIGHT',
  'MY', 'NAME', 'NICE', 'MEET', 'YOU', 'ME', 'WE', 'THEY', 'HE', 'IT',
  'FRIEND', 'FAMILY', 'MOTHER', 'FATHER', 'BROTHER', 'SISTER', 'CHILD', 'MAN', 'WOMAN',
  // Yes/no, feelings, common adjectives
  'YES', 'NO', 'GOOD', 'BAD', 'FINE', 'HAPPY', 'SAD', 'TIRED', 'SICK', 'HUNGRY',
  'BIG', 'SMALL', 'HOT', 'COLD', 'NEW', 'OLD', 'FAST', 'SLOW', 'EASY', 'HARD',
  'MORE', 'SAME', 'DIFFERENT', 'RIGHT', 'WRONG',
  // Question words
  'WHAT', 'HOW', 'WHERE', 'WHO', 'WHY', 'WHEN', 'WHICH',
  // Common verbs
  'HELP', 'WANT', 'LIKE', 'LOVE', 'NEED', 'HAVE', 'GO', 'COME', 'STOP', 'WAIT',
  'SEE', 'WATCH', 'LISTEN', 'TALK', 'ASK', 'ANSWER',
  'UNDERSTAND', 'KNOW', 'LEARN', 'TEACH', 'READ', 'WRITE', 'REMEMBER',
  'THINK', 'FEEL', 'WORK', 'PLAY', 'EAT', 'DRINK', 'SLEEP', 'MAKE', 'GET', 'GIVE', 'TAKE',
  'CAN', 'WILL', 'TRY', 'START', 'FINISH',
  // Everyday nouns / places / time
  'SIGN', 'DEAF', 'HEARING', 'HOME', 'SCHOOL', 'DAY', 'WEEK', 'YEAR',
  'TODAY', 'TOMORROW', 'YESTERDAY', 'NOW', 'LATER', 'TIME', 'WATER', 'MONEY',
  // Colors
  'RED', 'BLUE', 'GREEN', 'YELLOW', 'BLACK', 'WHITE', 'ORANGE', 'PURPLE', 'BROWN',
];

/** Some glosses only exist as numbered dialect/homonym variants (e.g. no
 * plain "WHAT", only "WHAT 1"/"WHAT 2") — fall back to the lowest-numbered
 * variant rather than treating the word as missing. */
function resolveGloss(byGloss, word) {
  if (byGloss.has(word)) return word;
  const variants = [...byGloss.keys()]
    .filter((g) => g.startsWith(`${word} `) && /^\d+$/.test(g.slice(word.length + 1)))
    .sort((a, b) => Number(a.slice(word.length + 1)) - Number(b.slice(word.length + 1)));
  return variants[0];
}

const here = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(here, 'raw'), { recursive: true });

const { zipfile } = await openAslCitizenZip();
const byGloss = new Map();
const ENTRY_RE = /^ASL_Citizen\/videos\/([^/]+)-([A-Z0-9 .'-]+)\.mp4$/;

for await (const entry of zipfile.eachEntry()) {
  const m = entry.fileName.match(ENTRY_RE);
  if (!m) continue;
  const [, id, glossRaw] = m;
  const gloss = glossRaw.trim();
  if (!byGloss.has(gloss)) byGloss.set(gloss, []);
  byGloss.get(gloss).push({ id, fileName: entry.fileName, size: entry.uncompressedSize });
}

console.log(`Distinct glosses found in dataset: ${byGloss.size}`);

const matched = {};
const missing = [];
for (const word of TARGET_WORDS) {
  const gloss = resolveGloss(byGloss, word);
  if (gloss) matched[word] = { gloss, entries: byGloss.get(gloss) };
  else missing.push(word);
}

console.log(`\nMatched ${Object.keys(matched).length}/${TARGET_WORDS.length} target words:`);
for (const [word, { gloss, entries }] of Object.entries(matched)) {
  const smallest = entries.reduce((a, b) => (a.size < b.size ? a : b));
  const via = gloss !== word ? ` (as "${gloss}")` : '';
  console.log(`  ${word.padEnd(12)}${via} ${String(entries.length).padStart(3)} clip(s), smallest ${(smallest.size / 1024).toFixed(0)} KB -> ${smallest.fileName}`);
}
console.log(`\nMissing (no exact gloss match): ${missing.join(', ') || '(none)'}`);

writeFileSync(join(here, 'raw/glossMatches.json'), JSON.stringify(matched, null, 2));
console.log(`\nWrote ${join(here, 'raw/glossMatches.json')}`);
