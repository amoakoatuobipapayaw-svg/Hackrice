// Same trick as tests/run.mjs: transpile the TS sources we need with the
// already-installed `typescript` package (no bundler, no ts-node) into a temp
// dir, then `require` the compiled JS. Type-only imports (`import type`) are
// erased by transpileModule per-file, so files that only cross-reference
// types (motionClassifier.ts, motionFeatures.ts) need no other files present.
import ts from 'typescript';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';

export function compileToTemp(relativePaths) {
  const temporary = mkdtempSync(join(tmpdir(), 'signly-ml-'));
  for (const name of relativePaths) {
    const source = readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
    const compiled = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023, esModuleInterop: true },
    });
    const outPath = join(temporary, name.replace(/\.ts$/, '.js'));
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, compiled.outputText);
  }
  return temporary;
}

/** Compile `relativePaths` (paths under src/recognition/, e.g. 'motionClassifier.ts')
 * to a temp dir, require the first one, then clean up. */
export function requireCompiled(relativePaths) {
  const temporary = compileToTemp(relativePaths);
  try {
    const require = createRequire(import.meta.url);
    return require(join(temporary, relativePaths[0].replace(/\.ts$/, '.js')));
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}
