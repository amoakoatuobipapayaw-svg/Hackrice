import { test } from "node:test";
import assert from "node:assert/strict";
import {
  accuracy,
  buildRoundResult,
  comboMultiplier,
  createRoundStats,
  pointsForRep,
  recordRep,
  repsToNextTier,
  speedBonus,
  xpForRound,
  BASE_POINTS,
  SPEED_BONUS_MAX,
  SPEED_BONUS_WINDOW_MS,
} from "../scoring";
import { generateMathProblem, parseSpokenNumber } from "../mathProblems";
import { LETTER_CATALOG, NUMBER_CATALOG, SIGNS, describeSign, pickSigns } from "../signCatalog";

test("combo multiplier steps up at 3, 5 and 10 chained reps", () => {
  assert.equal(comboMultiplier(0), 1);
  assert.equal(comboMultiplier(2), 1);
  assert.equal(comboMultiplier(3), 1.5);
  assert.equal(comboMultiplier(5), 2);
  assert.equal(comboMultiplier(10), 3);
  assert.equal(comboMultiplier(99), 3);
  assert.equal(repsToNextTier(0), 3);
  assert.equal(repsToNextTier(4), 1);
  assert.equal(repsToNextTier(10), null);
});

test("speed bonus decays linearly to zero at the window edge", () => {
  assert.equal(speedBonus(0), SPEED_BONUS_MAX);
  assert.equal(speedBonus(SPEED_BONUS_WINDOW_MS / 2), SPEED_BONUS_MAX / 2);
  assert.equal(speedBonus(SPEED_BONUS_WINDOW_MS), 0);
  assert.equal(speedBonus(SPEED_BONUS_WINDOW_MS * 4), 0);
  assert.equal(speedBonus(-5), 0);
  assert.equal(speedBonus(Number.NaN), 0);
});

test("points = (base + speed bonus) × multiplier; untimed reps get no bonus", () => {
  assert.equal(pointsForRep({ combo: 0 }), BASE_POINTS);
  assert.equal(pointsForRep({ combo: 0, elapsedMs: 0 }), BASE_POINTS + SPEED_BONUS_MAX);
  assert.equal(pointsForRep({ combo: 5, elapsedMs: 0 }), (BASE_POINTS + SPEED_BONUS_MAX) * 2);
  assert.equal(pointsForRep({ combo: 3 }), 15);
});

test("recordRep chains combos, tracks the best, and a miss breaks the chain", () => {
  let s = createRoundStats();
  for (let i = 0; i < 4; i++) s = recordRep(s, true);
  assert.deepEqual([s.correct, s.total, s.combo, s.bestCombo], [4, 4, 4, 4]);
  assert.equal(s.score, 10 + 10 + 10 + 15);
  assert.equal(s.lastPoints, 15);
  s = recordRep(s, false);
  assert.deepEqual([s.correct, s.total, s.combo, s.bestCombo, s.lastPoints], [4, 5, 0, 4, 0]);
  s = recordRep(s, true);
  assert.equal(s.combo, 1);
  assert.equal(s.bestCombo, 4);
});

test("recordRep never mutates its input", () => {
  const before = createRoundStats();
  const frozen = Object.freeze({ ...before });
  recordRep(frozen, true, 100);
  assert.deepEqual(frozen, before);
});

test("xp rewards correct reps, a perfect round, and speed score", () => {
  let s = createRoundStats();
  for (let i = 0; i < 5; i++) s = recordRep(s, true);
  assert.equal(xpForRound("lesson", s), 5 * 5 + 10);
  const imperfect = recordRep(s, false);
  assert.equal(xpForRound("lesson", imperfect), 25);
  assert.equal(xpForRound("speed", s), 35 + Math.floor(s.score / 20));
  assert.equal(xpForRound("math", createRoundStats()), 0);
});

test("buildRoundResult matches the RoundResult contract shape", () => {
  let s = createRoundStats();
  s = recordRep(s, true, 1000);
  s = recordRep(s, false);
  const result = buildRoundResult("math", s);
  assert.deepEqual(Object.keys(result).sort(), ["correct", "mode", "score", "total", "xp"]);
  assert.equal(result.mode, "math");
  assert.equal(result.correct, 1);
  assert.equal(result.total, 2);
  assert.equal(result.score, s.score);
  assert.equal(accuracy(result), 0.5);
  assert.equal(accuracy(createRoundStats()), 0);
});

test("math problems always have single-digit answers and ramp difficulty", () => {
  for (let index = 0; index < 8; index++) {
    for (let i = 0; i < 200; i++) {
      const p = generateMathProblem(index);
      assert.ok(Number.isInteger(p.answer) && p.answer >= 1 && p.answer <= 9, `${p.prompt} = ${p.answer}`);
      if (index < 2) assert.equal(p.op, "+");
      if (index < 4) assert.notEqual(p.op, "×");
    }
  }
  assert.equal(generateMathProblem(6, () => 0).op, "×");
});

test("spoken numbers parse digits, words, homophones, and sentences", () => {
  assert.equal(parseSpokenNumber("five"), 5);
  assert.equal(parseSpokenNumber("It's 7."), 7);
  assert.equal(parseSpokenNumber("The answer is four"), 4);
  assert.equal(parseSpokenNumber("for"), 4);
  assert.equal(parseSpokenNumber("to"), 2);
  assert.equal(parseSpokenNumber("Eight!"), 8);
  assert.equal(parseSpokenNumber("um, I think nine"), 9);
  assert.equal(parseSpokenNumber(""), null);
  assert.equal(parseSpokenNumber("banana"), null);
});

test("catalogs only contain signs the recognizer can confirm, each with a description", () => {
  for (const label of [...LETTER_CATALOG, ...NUMBER_CATALOG]) {
    assert.ok(SIGNS[label], `missing description for ${label}`);
    assert.ok(SIGNS[label].description.length > 10);
    assert.ok(SIGNS[label].tip.length > 5);
  }
  assert.equal(describeSign("Q").kind, "letter");
  assert.equal(describeSign("0").kind, "number");
});

test("pickSigns shuffles without immediate repeats and fills beyond the catalog", () => {
  const picks = pickSigns(12, LETTER_CATALOG, () => 0.3);
  assert.equal(picks.length, 12);
  for (let i = 1; i < picks.length; i++) assert.notEqual(picks[i], picks[i - 1]);
  const first = pickSigns(5, LETTER_CATALOG, () => 0.99);
  assert.deepEqual([...first].sort(), [...LETTER_CATALOG].sort());
  assert.deepEqual(pickSigns(0), []);
});
