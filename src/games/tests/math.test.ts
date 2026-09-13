import { test } from "node:test";
import assert from "node:assert/strict";
import { MATH_GAMES, findGame, gamesByDifficulty, gameHref } from "../math/games";
import { seeded } from "../math/random";
import { answerDigits, isSignable } from "../math/types";
import { accuracy, comboMultiplier, createStats, pointsFor, recordAttempt, toRoundResult, xpFor } from "../math/scoring";
import { parseSpokenNumber } from "../mathProblems";

const ROUNDS = 400; // × 5 problems × 9 games ≈ 18k generated problems

test("catalog: nine games, three per tier, nine distinct topics", () => {
  assert.equal(MATH_GAMES.length, 9);
  for (const { difficulty, games } of gamesByDifficulty()) {
    assert.equal(games.length, 3, `${difficulty} tier should have 3 games`);
  }
  assert.equal(new Set(MATH_GAMES.map((g) => g.id)).size, 9);
  assert.equal(new Set(MATH_GAMES.map((g) => g.topic)).size, 9);
  assert.equal(findGame("add-subtract")?.difficulty, "easy");
  assert.equal(findGame("nope"), undefined);
  assert.equal(gameHref(MATH_GAMES[0]), "/math?game=add-subtract");
});

test("every generated answer is signable (1–99, no zero digit) and within maxDigits", () => {
  for (const game of MATH_GAMES) {
    const rng = seeded(42);
    for (let r = 0; r < ROUNDS; r++) {
      for (let i = 0; i < game.length; i++) {
        const p = game.generate(i, rng);
        assert.ok(isSignable(p.answer), `${game.id}#${i}: answer ${p.answer} not signable (${JSON.stringify(p.display)})`);
        assert.ok(answerDigits(p.answer).length <= game.maxDigits, `${game.id}: ${p.answer} exceeds maxDigits`);
        assert.ok(p.spoken.length > 5 && p.explanation.length > 5, `${game.id}: missing spoken/explanation`);
      }
    }
  }
});

// Independent re-computation of the displayed math for every expression game,
// so a typo in a generator can't silently teach the wrong answer.
function evalExpression(text: string): number | null {
  const m = text.match(/^(\d+)\s*([+−×÷])\s*(\d+)$/);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[3]);
  return m[2] === "+" ? a + b : m[2] === "−" ? a - b : m[2] === "×" ? a * b : a / b;
}

test("displayed arithmetic matches the answer", () => {
  let checked = 0;
  for (const id of ["add-subtract", "times-tables"]) {
    const game = findGame(id)!;
    const rng = seeded(7);
    for (let r = 0; r < ROUNDS; r++) {
      for (let i = 0; i < game.length; i++) {
        const p = game.generate(i, rng);
        if (p.display.kind !== "expression") continue;
        const v = evalExpression(p.display.text);
        if (v === null) continue; // missing-factor form is checked below
        assert.equal(v, p.answer, `${id}: ${p.display.text} ≠ ${p.answer}`);
        checked++;
      }
    }
  }
  assert.ok(checked > 1000);
});

test("missing-factor, algebra and calculus problems solve to their answers", () => {
  const rng = seeded(3);
  const times = findGame("times-tables")!;
  for (let r = 0; r < ROUNDS; r++) {
    const p = times.generate(4, rng);
    if (p.display.kind === "expression") {
      const m = p.display.text.match(/^(\d+) × \? = (\d+)$/);
      if (m) assert.equal(Number(m[1]) * p.answer, Number(m[2]));
    }
  }
  const algebra = findGame("algebra")!;
  for (let r = 0; r < ROUNDS; r++) {
    for (let i = 0; i < 5; i++) {
      const p = algebra.generate(i, rng);
      if (p.display.kind !== "expression") continue;
      const t = p.display.text;
      const x = p.answer;
      let m: RegExpMatchArray | null;
      if ((m = t.match(/^x \+ (\d+) = (\d+)$/))) assert.equal(x + +m[1], +m[2], t);
      else if ((m = t.match(/^x − (\d+) = (\d+)$/))) assert.equal(x - +m[1], +m[2], t);
      else if ((m = t.match(/^x ÷ (\d+) = (\d+)$/))) assert.equal(x / +m[1], +m[2], t);
      else if ((m = t.match(/^(\d+)x \+ (\d+) = (\d+)$/))) assert.equal(+m[1] * x + +m[2], +m[3], t);
      else if ((m = t.match(/^(\d+)x = (\d+)$/))) assert.equal(+m[1] * x, +m[2], t);
      else assert.fail(`unrecognised algebra form: ${t}`);
    }
  }
  const calc = findGame("calculus")!;
  for (let r = 0; r < ROUNDS; r++) {
    for (let i = 0; i < 5; i++) {
      const p = calc.generate(i, rng);
      assert.equal(p.display.kind, "calculus");
      if (p.display.kind !== "calculus") continue;
      const { expression: e, instruction: ins } = p.display;
      let m: RegExpMatchArray | null;
      if ((m = e.match(/^f\(x\) = (\d+)x \+ (\d+)$/))) assert.equal(p.answer, +m[1], e);
      else if (e === "f(x) = x²") assert.equal(p.answer, 2 * +ins.match(/\((\d+)\)/)![1], e + ins);
      else if (e === "f(x) = x³") assert.equal(p.answer, 3 * (+ins.match(/\((\d+)\)/)![1]) ** 2, e + ins);
      else if ((m = e.match(/^f\(x\) = (\d+)x² \+ (\d+)x$/))) {
        const c = +ins.match(/\((\d+)\)/)![1];
        assert.equal(p.answer, 2 * +m[1] * c + +m[2], e + ins);
      } else if ((m = e.match(/^∫₀(.) 2x dx$/))) {
        const c = "₀₁₂₃₄₅₆₇₈₉".indexOf(m[1]);
        assert.equal(p.answer, c * c, e);
      } else if ((m = e.match(/^∫₀(.) (\d+) dx$/))) {
        const c = "₀₁₂₃₄₅₆₇₈₉".indexOf(m[1]);
        assert.equal(p.answer, +m[2] * c, e);
      } else if ((m = e.match(/^lim x→(\d+)/))) assert.equal(p.answer, 2 * +m[1], e);
      else assert.fail(`unrecognised calculus form: ${e}`);
    }
  }
});

test("count, compare, pattern and logic answers are consistent with their displays", () => {
  const rng = seeded(11);
  const count = findGame("count-dots")!;
  for (let r = 0; r < ROUNDS; r++) {
    const p = count.generate(0, rng);
    assert.equal(p.display.kind, "dots");
    if (p.display.kind === "dots") assert.equal(p.display.count, p.answer);
  }
  const compare = findGame("compare")!;
  for (let r = 0; r < ROUNDS; r++) {
    for (let i = 0; i < 5; i++) {
      const p = compare.generate(i, rng);
      if (p.display.kind !== "compare") continue;
      const val = (s: string) => s.split("+").reduce((sum, t) => sum + Number(t.trim()), 0);
      const l = val(p.display.left);
      const rr = val(p.display.right);
      assert.notEqual(l, rr);
      assert.equal(p.answer, p.display.ask.includes("bigger") ? Math.max(l, rr) : Math.min(l, rr), JSON.stringify(p.display));
    }
  }
  const patterns = findGame("patterns")!;
  for (let r = 0; r < ROUNDS; r++) {
    for (let i = 0; i < 5; i++) {
      const p = patterns.generate(i, rng);
      if (p.display.kind !== "sequence") continue;
      assert.equal(p.display.terms[p.display.missingIndex], "?");
      assert.ok(p.display.terms.length >= 3);
    }
  }
  const logic = findGame("logic")!;
  for (let r = 0; r < ROUNDS; r++) {
    for (let i = 0; i < 5; i++) {
      const p = logic.generate(i, rng);
      if (p.display.kind !== "options") continue;
      if (p.display.numbered !== false && p.display.options.length > 0) {
        assert.ok(p.answer >= 1 && p.answer <= p.display.options.length, `option ${p.answer} out of range`);
      }
      if (p.display.question.startsWith("Evaluate: ")) {
        // Re-evaluate the boolean expression with real JS operators.
        const js = p.display.question
          .slice("Evaluate: ".length)
          .replace(/TRUE/g, "true")
          .replace(/FALSE/g, "false")
          .replace(/AND/g, "&&")
          .replace(/OR/g, "||")
          .replace(/NOT /g, "!");
        const value = new Function(`return (${js});`)() as boolean;
        assert.equal(p.answer, value ? 1 : 2, js);
      }
    }
  }
});

test("scoring: combo, difficulty weight, XP, RoundResult contract", () => {
  assert.equal(comboMultiplier(0), 1);
  assert.equal(comboMultiplier(3), 1.5);
  assert.equal(comboMultiplier(5), 2);
  assert.equal(pointsFor("easy", 0), 10);
  assert.equal(pointsFor("medium", 0), 15);
  assert.equal(pointsFor("hard", 5), 40);
  let s = createStats();
  for (let i = 0; i < 4; i++) s = recordAttempt(s, "hard", true);
  assert.equal(s.score, 20 + 20 + 20 + 30);
  assert.equal(s.combo, 4);
  s = recordAttempt(s, "hard", false);
  assert.deepEqual([s.combo, s.bestCombo, s.total, s.correct, s.lastPoints], [0, 4, 5, 4, 0]);
  assert.equal(accuracy(s), 0.8);
  assert.equal(xpFor("hard", s), 40);
  const perfect = [1, 2, 3, 4, 5].reduce((acc) => recordAttempt(acc, "easy", true), createStats());
  assert.equal(xpFor("easy", perfect), 25 + 10);
  const result = toRoundResult("medium", s);
  assert.deepEqual(Object.keys(result).sort(), ["correct", "mode", "score", "total", "xp"]);
  assert.equal(result.mode, "math");
});

test("spoken numbers: digits, words, teens, tens, homophones, sentences", () => {
  assert.equal(parseSpokenNumber("five"), 5);
  assert.equal(parseSpokenNumber("It's 7."), 7);
  assert.equal(parseSpokenNumber("the answer is four"), 4);
  assert.equal(parseSpokenNumber("for"), 4);
  assert.equal(parseSpokenNumber("to"), 2);
  assert.equal(parseSpokenNumber("twelve"), 12);
  assert.equal(parseSpokenNumber("twenty one"), 21);
  assert.equal(parseSpokenNumber("twenty-seven"), 27);
  assert.equal(parseSpokenNumber("um, forty"), 40);
  assert.equal(parseSpokenNumber("eighty one!"), 81);
  assert.equal(parseSpokenNumber(""), null);
  assert.equal(parseSpokenNumber("banana"), null);
});
