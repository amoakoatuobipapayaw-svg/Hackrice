// One-time migration: the 292 words already extracted locally (public/
// sign-videos/videos/*.mp4, committed to git from before the dictionary
// moved to Supabase Storage) get uploaded from disk straight to the
// "dictionary" bucket — no need to re-fetch them from the 42.8 GB remote
// zip since we already have the bytes. Run this BEFORE
// extractAllToSupabase.mjs, which treats any word already in index.json as
// already-uploaded and skips it.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../..');

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
// service_role, not anon: this bypasses the bucket's RLS policies entirely,
// which is exactly what a trusted one-time bulk-upload script needs — never
// use this key in app code, only in dev-time tooling like this.
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'dictionary';
if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error('VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set (checked .env.local and process.env)');
}

const indexPath = join(repoRoot, 'public/sign-videos/index.json');
const index = JSON.parse(readFileSync(indexPath, 'utf8'));
const words = Object.entries(index);
console.log(`Uploading ${words.length} already-extracted clips from disk to Supabase Storage...`);

let done = 0;
for (const [word, entry] of words) {
  const localPath = join(repoRoot, 'public/sign-videos', entry.file);
  const buffer = readFileSync(localPath);
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${entry.file}`, {
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
    console.warn(`FAILED ${word}: HTTP ${res.status} ${await res.text()}`);
    continue;
  }
  done++;
  if (done % 25 === 0) console.log(`[${done}/${words.length}] uploaded...`);
}
console.log(`Done: ${done}/${words.length} uploaded.`);
