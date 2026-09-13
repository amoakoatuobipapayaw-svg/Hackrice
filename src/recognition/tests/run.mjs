// Uses the template's TypeScript dependency and Node's built-in test runner.
import ts from 'typescript';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

// Sources get copied into a temp dir below, so `import.meta.url` inside a
// test would resolve to the copy, not the real repo — tests that need a real
// project-relative path (e.g. the trained model artifact) read this instead.
const projectRoot = fileURLToPath(new URL('../../..',import.meta.url));
// Nested under the real node_modules (not the OS tmpdir) so that Node's
// module resolution, walking up from the compiled test files, still finds
// real installed packages like @tensorflow/tfjs-node.
const temporary = mkdtempSync(join(projectRoot,'node_modules','.signly-tests-'));
try {
  mkdirSync(join(temporary,'tests'));
  for(const name of ['holdTracker.ts','signClassifier.ts','motionClassifier.ts','geminiCoach.ts',
    'motionFeatures.ts','motionModel.ts',
    'tests/core.test.ts','tests/motion.test.ts','tests/motionModel.test.ts']) {
    const source = readFileSync(new URL(`../${name}`,import.meta.url),'utf8');
    const compiled = ts.transpileModule(source, {compilerOptions:{
      module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2023,esModuleInterop:true,
    }});
    writeFileSync(join(temporary,name.replace(/\.ts$/,'.js')),compiled.outputText);
  }
  execFileSync(process.execPath,
    ['--test',join(temporary,'tests/core.test.js'),join(temporary,'tests/motion.test.js'),
      join(temporary,'tests/motionModel.test.js')],
    {stdio:'inherit', env:{...process.env, SIGNLY_ROOT:projectRoot}});
} finally { rmSync(temporary,{recursive:true,force:true}); }
