// Mirrors src/recognition/tests/run.mjs: transpile the pure modules with the
// repo's TypeScript and run them under Node's built-in test runner.
//   node src/games/tests/run.mjs
//
// Paths are relative to src/ and the temp tree mirrors it, so a module that
// imports across folders (signCatalog -> recognition/signClassifier) resolves
// exactly as it does in the app. Only React-free, side-effect-free modules
// belong here; anything that needs a DOM or the network is tested in a browser.
import ts from "typescript";
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";

const FILES = [
  "recognition/signClassifier.ts",
  "games/signCatalog.ts",
  "games/practice/levels.ts",
  "games/practice/practiceProgress.ts",
  "games/speed/deck.ts",
  "games/speed/modes.ts",
  "games/math/types.ts",
  "games/math/random.ts",
  "games/math/easyGames.ts",
  "games/math/mediumGames.ts",
  "games/math/hardGames.ts",
  "games/math/games.ts",
  "games/math/scoring.ts",
  "games/mathProblems.ts",
  "games/tests/math.test.ts",
  "games/tests/practiceSpeed.test.ts",
];

const TESTS = ["games/tests/math.test.js", "games/tests/practiceSpeed.test.js"];

const temporary = mkdtempSync(join(tmpdir(), "signly-games-tests-"));
try {
  for (const name of FILES) {
    const source = readFileSync(new URL(`../../${name}`, import.meta.url), "utf8");
    const compiled = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023, esModuleInterop: true },
    });
    const destination = join(temporary, name.replace(/\.ts$/, ".js"));
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, compiled.outputText);
  }
  execFileSync(process.execPath, ["--test", ...TESTS.map((name) => join(temporary, name))], { stdio: "inherit" });
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
