// Phase 1 checkpoint: confirm we can read the ASL Citizen zip's central
// directory over HTTP range requests without downloading the 42.8 GB file,
// and see the REAL internal layout (folder names, metadata filenames)
// instead of guessing. Run: node src/dictionary/tools/probeAslCitizen.mjs
import { openAslCitizenZip } from './aslCitizenReader.mjs';

const { zipfile, totalSize, reader } = await openAslCitizenZip();
console.log(`Zip size: ${(totalSize / 1e9).toFixed(2)} GB`);
console.log(`Entry count (from central directory): ${zipfile.entryCount}`);

let count = 0;
const csvLike = [];
const samples = [];
const extensionCounts = {};

for await (const entry of zipfile.eachEntry()) {
  count++;
  const ext = (entry.fileName.match(/\.[^./]+$/)?.[0] ?? '(none)').toLowerCase();
  extensionCounts[ext] = (extensionCounts[ext] ?? 0) + 1;
  if (/\.csv$/i.test(entry.fileName)) csvLike.push({ name: entry.fileName, size: entry.uncompressedSize });
  if (samples.length < 20) samples.push(entry.fileName);
  if (count % 20000 === 0) console.log(`  ...scanned ${count} entries`);
}

console.log(`\nTotal entries scanned: ${count}`);
console.log('\nExtension breakdown:', extensionCounts);
console.log('\nCSV/metadata files found:');
for (const f of csvLike) console.log(`  ${f.name} (${f.size} bytes)`);
console.log('\nSample entries (first 20):');
for (const s of samples) console.log(`  ${s}`);
console.log(`\nTotal HTTP range fetches used: ${reader.requestCount}`);
