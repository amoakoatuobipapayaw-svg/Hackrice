// Dev tool: check whether a word exists in ASL Citizen's 2,731-gloss
// vocabulary (and under what exact spelling — the dataset sometimes uses a
// different token than the plain English word, e.g. "THANK YOU" not
// "THANK-YOU", or only numbered variants like "WHAT 1"/"WHAT 2") before
// adding it to buildIndex.mjs's TARGET_WORDS. Edit SUBSTRINGS below and run:
// node src/dictionary/tools/searchGlosses.mjs
import { openAslCitizenZip } from './aslCitizenReader.mjs';

const SUBSTRINGS = ['THANK', 'WHAT', 'HELLO'];

const { zipfile } = await openAslCitizenZip();
const ENTRY_RE = /^ASL_Citizen\/videos\/([^/]+)-([A-Z0-9 .'-]+)\.mp4$/;
const glosses = new Set();
for await (const entry of zipfile.eachEntry()) {
  const m = entry.fileName.match(ENTRY_RE);
  if (m) glosses.add(m[2].trim());
}
console.log(`Total distinct glosses: ${glosses.size}`);
for (const term of SUBSTRINGS) {
  const hits = [...glosses].filter((g) => (term instanceof RegExp ? term.test(g) : g.includes(term)));
  console.log(`\nMatches for ${term}:`, hits.slice(0, 15));
}
