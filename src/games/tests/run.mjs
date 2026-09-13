// Mirrors src/recognition/tests/run.mjs: transpile the pure modules with the
// repo's TypeScript and run them under Node's built-in test runner.
//   node src/games/tests/run.mjs
import ts from "typescript";
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const FILES = [
  "math/types.ts",
  "math/random.ts",
  "math/easyGames.ts",
  "math/mediumGames.ts",
  "math/hardGames.ts",
  "math/games.ts",
  "math/scoring.ts",
  "mathProblems.ts",
  "tests/math.test.ts",
];

const temporary = mkdtempSync(join(tmpdir(), "signly-games-tests-"));
try {
  mkdirSync(join(temporary, "tests"));
  mkdirSync(join(temporary, "math"));
  for (const name of FILES) {
    const source = readFileSync(new URL(`../${name}`, import.meta.url), "utf8");
    const compiled = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023, esModuleInterop: true },
    });
    writeFileSync(join(temporary, name.replace(/\.ts$/, ".js")), compiled.outputText);
  }
  execFileSync(process.execPath, ["--test", join(temporary, "tests/math.test.js")], { stdio: "inherit" });
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
