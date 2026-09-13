// Trims the already-extracted clip set down to a size budget, in priority
// order (TARGET_WORDS' own order in buildIndex.mjs — earlier-listed
// categories are more core vocabulary), without re-running the slow
// network extraction. Deletes dropped video files, rewrites index.json,
// and rewrites buildIndex.mjs's TARGET_WORDS to match what's actually kept
// (so a future rerun of the pipeline stays reproducible/consistent).
import { readFileSync, writeFileSync, unlinkSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const BUDGET_BYTES = Number(process.argv[2] ?? 70 * 1024 * 1024);
const here = dirname(fileURLToPath(import.meta.url));
const buildIndexPath = join(here, 'buildIndex.mjs');
const indexPath = join(here, '../../../public/sign-videos/index.json');
const videosDir = join(here, '../../../public/sign-videos/videos');

const source = readFileSync(buildIndexPath, 'utf8');
const arrayMatch = source.match(/const TARGET_WORDS = \[([\s\S]*?)\n\];/);
if (!arrayMatch) throw new Error('Could not find TARGET_WORDS array in buildIndex.mjs');
const priorityOrder = [...arrayMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

const index = JSON.parse(readFileSync(indexPath, 'utf8'));

let running = 0;
const keep = new Set();
for (const word of priorityOrder) {
  const entry = index[word];
  if (!entry) continue; // wasn't matched in the dataset at all
  if (running + entry.bytes > BUDGET_BYTES) continue; // over budget, skip (lower priority)
  running += entry.bytes;
  keep.add(word);
}

const dropped = Object.keys(index).filter((w) => !keep.has(w));
for (const word of dropped) {
  const file = join(here, '../../../public/sign-videos', index[word].file);
  try { unlinkSync(file); } catch { /* already gone */ }
  delete index[word];
}

writeFileSync(indexPath, JSON.stringify(index, null, 2));

// Rewrite TARGET_WORDS to only the kept words, same relative order, so the
// pipeline is reproducible (rerunning buildIndex.mjs won't re-propose the
// words we just cut for budget reasons).
const keptInOrder = priorityOrder.filter((w) => keep.has(w));
const newArrayBody = keptInOrder.map((w) => `'${w}'`).join(', ');
const newSource = source.replace(/const TARGET_WORDS = \[[\s\S]*?\n\];/, `const TARGET_WORDS = [\n  ${newArrayBody},\n];`);
writeFileSync(buildIndexPath, newSource);

console.log(`Kept ${keep.size}/${priorityOrder.length} words, ${(running / 1e6).toFixed(2)} MB (budget ${(BUDGET_BYTES / 1e6).toFixed(0)} MB)`);
console.log(`Dropped ${dropped.length} words: ${dropped.join(', ')}`);

const videosDirSize = statSync(videosDir); // sanity: dir still exists
void videosDirSize;
