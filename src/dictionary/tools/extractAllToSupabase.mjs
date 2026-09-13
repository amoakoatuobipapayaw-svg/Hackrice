// Extracts EVERY distinct sign gloss in the ASL Citizen dataset (not just a
// curated TARGET_WORDS subset — see buildIndex.mjs for that smaller, still
// git-committed set) and uploads one clip per gloss straight to Supabase
// Storage, streamed from the remote zip without ever writing video bytes to
// local disk. This is how the dictionary can cover the whole ~2,675-word
// vocabulary without blowing Vercel's 100MB static-file cap: the actual
// video bytes never enter the Vercel build, only this script's small
// resulting index.json does (public/sign-videos/index.json, still a
// git-committed static asset — just URLs now, not video files).
//
// Resumable: writes index.json after every successful upload, and skips any
// word already present in it on a re-run (with x-upsert on the PUT as a
// belt-and-suspenders in case a previous run died mid-upload).
//
// Usage: node src/dictionary/tools/extractAllToSupabase.mjs [--limit N]
//   --limit N   Stop after N successful uploads (for a quick smoke test).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { openAslCitizenZip } from './aslCitizenReader.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../..');

// .env.local isn't loaded automatically for a plain `node` script (that's a
// Vite-only behavior) — parse the few lines we need ourselves rather than
// add a dotenv dependency for this one dev-time tool.
function loadEnvLocal() {
  const path = join(repoRoot, '.env.local');
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

const env = { ...loadEnvLocal(), ...process.env };
const SUPABASE_URL = env.VITE_SUPABASE_URL;
// service_role, not anon: bypasses the bucket's RLS for this trusted
// one-time bulk upload — never use this key in app code, dev tooling only.
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'dictionary';
if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error('VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set (checked .env.local and process.env)');
}

const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg !== -1 ? Number(process.argv[limitArg + 1]) : Infinity;

const indexPath = join(repoRoot, 'public/sign-videos/index.json');
mkdirSync(dirname(indexPath), { recursive: true });
const index = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, 'utf8')) : {};
const alreadyDone = new Set(Object.keys(index));
console.log(`Resuming with ${alreadyDone.size} words already in ${indexPath}`);

const baseSafeName = (word) => word.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'sign';
const usedFileNames = new Set(Object.values(index).map((v) => v.file));

function uniqueSafeName(word) {
  const base = baseSafeName(word);
  let candidate = `${base}.mp4`;
  let n = 2;
  while (usedFileNames.has(`videos/${candidate}`)) {
    candidate = `${base}-${n}.mp4`;
    n++;
  }
  usedFileNames.add(`videos/${candidate}`);
  return candidate;
}

async function uploadToSupabase(outFile, buffer) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/videos/${outFile}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'video/mp4',
      'x-upsert': 'true',
    },
    body: buffer,
  });
  if (!res.ok) {
    throw new Error(`Upload failed (HTTP ${res.status}): ${await res.text()}`);
  }
}

console.log('Scanning the dataset for every distinct sign gloss...');
// A fresh zip connection per pass: yauzl's eachEntry() can only be called
// once per ZipFile, and we need a full pass to group entries by gloss
// (Phase 1) before we know which entry is "smallest" for each word, then a
// second full pass to actually open read streams for the ones we want
// (Phase 2). The read-ahead caching reader makes each pass's central-
// directory scan cheap (a couple of large range requests), so this doesn't
// meaningfully add to the real cost, which is the per-clip data transfer.
const scanZip = (await openAslCitizenZip()).zipfile;
const byGloss = new Map();
const ENTRY_RE = /^ASL_Citizen\/videos\/([^/]+)-([A-Z0-9 .'-]+)\.mp4$/;

for await (const entry of scanZip.eachEntry()) {
  const m = entry.fileName.match(ENTRY_RE);
  if (!m) continue;
  const [, id, glossRaw] = m;
  const gloss = glossRaw.trim();
  if (!byGloss.has(gloss)) byGloss.set(gloss, []);
  byGloss.get(gloss).push({ id, fileName: entry.fileName, size: entry.uncompressedSize });
}
console.log(`Distinct glosses found: ${byGloss.size}`);

// One pass per gloss: pick the smallest clip (keeps upload/storage lean —
// same choice buildIndex.mjs/extractClips.mjs already make for the curated
// subset), skip glosses already uploaded in a previous run.
const wanted = new Map(); // fileName -> { word, outFile }
for (const [word, entries] of byGloss) {
  if (alreadyDone.has(word)) continue;
  const smallest = entries.reduce((a, b) => (a.size < b.size ? a : b));
  wanted.set(smallest.fileName, { word, outFile: uniqueSafeName(word) });
}
console.log(`${wanted.size} words left to upload (${alreadyDone.size} already done, ${byGloss.size} total).`);

let uploaded = 0;
let failed = 0;
const startedAt = Date.now();

function persistIndex() {
  writeFileSync(indexPath, JSON.stringify(index, null, 2));
}

process.on('SIGINT', () => {
  console.log('\nInterrupted — saving progress...');
  persistIndex();
  process.exit(130);
});

const extractZip = (await openAslCitizenZip()).zipfile;
for await (const entry of extractZip.eachEntry()) {
  const target = wanted.get(entry.fileName);
  if (!target) continue;

  try {
    const readStream = await extractZip.openReadStreamPromise(entry);
    const chunks = [];
    for await (const chunk of readStream) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    await uploadToSupabase(target.outFile, buffer);

    index[target.word] = { file: `videos/${target.outFile}`, bytes: buffer.length };
    uploaded++;
    if (uploaded % 10 === 0) persistIndex();

    const elapsedMin = ((Date.now() - startedAt) / 60000).toFixed(1);
    console.log(`[${uploaded}/${wanted.size}] ${target.word} -> ${target.outFile} (${(buffer.length / 1024).toFixed(0)} KB) — ${elapsedMin} min elapsed`);
  } catch (err) {
    failed++;
    console.warn(`FAILED ${target.word}: ${err.message}`);
  }

  wanted.delete(entry.fileName);
  if (uploaded >= LIMIT || wanted.size === 0) break;
}

persistIndex();
const totalBytes = Object.values(index).reduce((sum, v) => sum + v.bytes, 0);
console.log(`\nDone. ${Object.keys(index).length} words in index.json total (${uploaded} uploaded this run, ${failed} failed).`);
console.log(`Total dataset payload now in Supabase Storage: ${(totalBytes / 1e6).toFixed(1)} MB`);
if (wanted.size > 0) console.log(`${wanted.size} words left (hit --limit or ran out of matching entries before scan end) — rerun to continue.`);
