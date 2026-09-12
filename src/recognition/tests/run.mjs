// Uses the template's TypeScript dependency and Node's built-in test runner.
import ts from 'typescript';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const temporary = mkdtempSync(join(tmpdir(),'signquest-tests-'));
try {
  mkdirSync(join(temporary,'tests'));
  for(const name of ['holdTracker.ts','signClassifier.ts','geminiCoach.ts','tests/core.test.ts']) {
    const source = readFileSync(new URL(`../${name}`,import.meta.url),'utf8');
    const compiled = ts.transpileModule(source, {compilerOptions:{
      module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2023,esModuleInterop:true,
    }});
    writeFileSync(join(temporary,name.replace(/\.ts$/,'.js')),compiled.outputText);
  }
  execFileSync(process.execPath,['--test',join(temporary,'tests/core.test.js')],{stdio:'inherit'});
} finally { rmSync(temporary,{recursive:true,force:true}); }
