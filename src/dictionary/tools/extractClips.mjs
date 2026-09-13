// Phase 3: pull the specific video entries picked in buildIndex.mjs's
// glossMatches.json out of the remote zip (by re-scanning entries and
// opening a read stream only for the ones we want — yauzl decompresses
// on the fly), and write the committed dictionary assets.
import { createWriteStream, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { openAslCitizenZip } from './aslCitizenReader.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const matches = JSON.parse(readFileSync(join(here, 'raw/glossMatches.json'), 'utf8'));

const safeName = (word) => word.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// fileName -> { word, outFile }
const wanted = new Map();
for (const [word, { entries }] of Object.entries(matches)) {
  const smallest = entries.reduce((a, b) => (a.size < b.size ? a : b));
  wanted.set(smallest.fileName, { word, outFile: `${safeName(word)}.mp4` });
}

const videosDir = join(here, '../../../public/sign-videos/videos');
mkdirSync(videosDir, { recursive: true });

const { zipfile } = await openAslCitizenZip();
const index = {};
let found = 0;

for await (const entry of zipfile.eachEntry()) {
  const target = wanted.get(entry.fileName);
  if (!target) continue;
  const outPath = join(videosDir, target.outFile);
  const readStream = await zipfile.openReadStreamPromise(entry);
  await pipeline(readStream, createWriteStream(outPath));
  const size = statSync(outPath).size;
  index[target.word] = { file: `videos/${target.outFile}`, bytes: size };
  found++;
  console.log(`[${found}/${wanted.size}] ${target.word} -> ${target.outFile} (${(size / 1024).toFixed(0)} KB)`);
  if (found === wanted.size) break;
}

if (found < wanted.size) {
  const missing = [...wanted.values()].map((v) => v.word).filter((w) => !index[w]);
  console.warn(`Warning: only found ${found}/${wanted.size} entries during scan. Missing: ${missing.join(', ')}`);
}

const indexPath = join(here, '../../../public/sign-videos/index.json');
writeFileSync(indexPath, JSON.stringify(index, null, 2));
const totalBytes = Object.values(index).reduce((sum, v) => sum + v.bytes, 0);
console.log(`\nWrote ${indexPath}`);
console.log(`Total video payload: ${(totalBytes / 1e6).toFixed(2)} MB across ${found} clips`);
