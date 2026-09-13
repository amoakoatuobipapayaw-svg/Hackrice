// Unit tests for the pure logic behind the levelled Practice mode and the
// three-clock Speed mode. Run with the rest of the games suite:
//   node src/games/tests/run.mjs
//
// Nothing here touches React, the camera, or the network. The invariants
// under test are the ones a player would notice breaking: a level never asks
// for a sign outside its own pool, a Speed deck never repeats a sign until
// every one has been used, and a locked level stays locked.
import test from "node:test";
import assert from "node:assert/strict";

import {
  ALPHABET,
  confirmFloor,
  DIGITS,
  sampleSigns,
  shuffle,
  vocabularyFor,
} from "../signCatalog";
import { CONFIDENCE_CAP, CONFIRM_THRESHOLD, DEMO_LETTERS, DEMO_NUMBERS } from "../../recognition/signClassifier";
import { findLevel, LEVEL_COUNT, LEVELS, levelForSigns, levelHref, levelTargets, nextLevel, THIRTEEN_LETTERS } from "../practice/levels";
import { createDeck, signsLeft, SPEED_POOL } from "../speed/deck";
import { DEFAULT_SPEED_MODE, findSpeedMode, SPEED_MODES, speedHref, speedPoints } from "../speed/modes";

// --- pools -----------------------------------------------------------------

test("the alphabet and digit pools are complete and sorted", () => {
  assert.equal(ALPHABET.length, 26);
  assert.equal(ALPHABET.join(""), "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  assert.equal(DIGITS.length, 10);
  assert.equal(DIGITS.join(""), "0123456789");
});

test("vocabularyFor routes digits and letters to the right classifier vocabulary", () => {
  for (const digit of DIGITS) assert.equal(vocabularyFor(digit), "numbers");
  for (const letter of ALPHABET) assert.equal(vocabularyFor(letter), "letters");
});

test("confirmFloor keeps the 0.8 gate for demo signs and lowers it only to a sign's own cap", () => {
  for (const sign of [...DEMO_LETTERS, ...DEMO_NUMBERS]) {
    assert.equal(confirmFloor(sign), CONFIRM_THRESHOLD, `${sign} should keep the default gate`);
  }
  for (const sign of [...ALPHABET, ...DIGITS]) {
    const floor = confirmFloor(sign);
    assert.ok(floor <= CONFIRM_THRESHOLD, `${sign} floor must never exceed the default gate`);
    // Reachable: a sign's score is capped at CONFIDENCE_CAP, so a floor above
    // its cap would make the sign impossible to confirm — the original bug.
    assert.ok(floor <= (CONFIDENCE_CAP[sign] ?? 0.65), `${sign} floor must be reachable`);
  }
});

test("shuffle returns a permutation and leaves the original alone", () => {
  const source = Object.freeze([...ALPHABET]);
  const shuffled = shuffle(source);
  assert.equal(shuffled.length, source.length);
  assert.deepEqual([...shuffled].sort(), [...source].sort());
  assert.equal(source.join(""), ALPHABET.join(""));
});

test("sampleSigns draws distinct signs while the pool allows it", () => {
  for (let run = 0; run < 200; run++) {
    const picks = sampleSigns(10, ALPHABET);
    assert.equal(picks.length, 10);
    assert.equal(new Set(picks).size, 10);
  }
  // Asking for more than the pool holds repeats rather than hanging.
  const overdraw = sampleSigns(7, ["A", "B", "C"]);
  assert.equal(overdraw.length, 7);
});

// --- practice levels -------------------------------------------------------

test("there are five levels, numbered 1-5 in order", () => {
  assert.equal(LEVEL_COUNT, 5);
  assert.deepEqual(LEVELS.map((l) => l.number), [1, 2, 3, 4, 5]);
});

test("each level's pool is exactly what the brief asked for", () => {
  const [one, two, three, four, five] = LEVELS;
  assert.deepEqual([...one.pool], ["I", "L", "V", "W", "Y"]);
  assert.equal(two.pool.length, 13);
  assert.deepEqual([...three.pool], [...ALPHABET]);
  assert.deepEqual([...four.pool], [...DIGITS]);
  assert.equal(five.pool.length, 36);
  assert.deepEqual([...five.pool].sort(), [...ALPHABET, ...DIGITS].sort());
});

test("level 2's thirteen include all five of level 1", () => {
  assert.equal(THIRTEEN_LETTERS.length, 13);
  for (const sign of ["I", "L", "V", "W", "Y"]) {
    assert.ok(THIRTEEN_LETTERS.includes(sign), `${sign} must carry over into level 2`);
  }
  assert.equal(new Set(THIRTEEN_LETTERS).size, 13);
});

test("each level's pool contains the previous level's, except the letters/digits split", () => {
  // Levels 1-3 nest; level 4 is the digits on their own; level 5 is everything.
  for (const [smaller, bigger] of [[LEVELS[0], LEVELS[1]], [LEVELS[1], LEVELS[2]], [LEVELS[2], LEVELS[4]], [LEVELS[3], LEVELS[4]]] as const) {
    for (const sign of smaller.pool) {
      assert.ok(bigger.pool.includes(sign), `level ${bigger.number} should contain ${sign}`);
    }
  }
});

test("a round only ever asks for signs from its own level, with no repeats", () => {
  for (const level of LEVELS) {
    for (let run = 0; run < 100; run++) {
      const targets = levelTargets(level);
      assert.equal(targets.length, level.length, `level ${level.number} round length`);
      assert.equal(new Set(targets).size, targets.length, `level ${level.number} repeated a sign`);
      for (const target of targets) {
        assert.ok(level.pool.includes(target), `level ${level.number} asked for ${target}, which isn't in its pool`);
      }
    }
  }
});

test("level 1 keeps its taught order so the first lesson never changes", () => {
  for (let run = 0; run < 20; run++) {
    assert.deepEqual(levelTargets(LEVELS[0]), ["I", "L", "V", "W", "Y"]);
  }
});

test("findLevel, levelHref and nextLevel line up", () => {
  assert.equal(findLevel("3"), LEVELS[2]);
  assert.equal(findLevel(3), LEVELS[2]);
  assert.equal(findLevel("0"), undefined);
  assert.equal(findLevel("6"), undefined);
  assert.equal(findLevel(null), undefined);
  assert.equal(findLevel("two"), undefined);
  assert.equal(levelHref(LEVELS[1]), "/lesson?level=2");
  assert.equal(nextLevel(LEVELS[0]), LEVELS[1]);
  assert.equal(nextLevel(LEVELS[4]), undefined);
});

test("a Roadmap unit resolves to the smallest level that covers it", () => {
  assert.equal(levelForSigns(["I", "L", "V", "W", "Y"]), LEVELS[0]);
  assert.equal(levelForSigns(["A", "E", "M", "N", "S", "T"]), LEVELS[2]);
  assert.equal(levelForSigns(["J", "Z"]), LEVELS[2]);
  assert.equal(levelForSigns(["1", "2", "3"]), LEVELS[3]);
  assert.equal(levelForSigns(["0"]), LEVELS[3]);
  // A word sign belongs to no level rather than silently landing on one.
  assert.equal(levelForSigns(["HELLO"]), undefined);
});

// --- unlocking -------------------------------------------------------------

test("levels unlock one at a time and never lock themselves again", async () => {
  const store = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
  const { currentLevelNumber, highestCompletedLevel, isLevelUnlocked, markLevelComplete, unlockedCount } =
    await import("../practice/practiceProgress");

  assert.equal(highestCompletedLevel(), 0);
  assert.equal(currentLevelNumber(), 1);
  assert.equal(unlockedCount(), 1);
  assert.ok(isLevelUnlocked(1));
  for (const locked of [2, 3, 4, 5]) assert.ok(!isLevelUnlocked(locked), `level ${locked} must start locked`);

  markLevelComplete(1);
  assert.ok(isLevelUnlocked(2));
  assert.ok(!isLevelUnlocked(3));
  assert.equal(currentLevelNumber(), 2);

  // Replaying an earlier level must not claw back progress.
  markLevelComplete(4);
  markLevelComplete(1);
  assert.equal(highestCompletedLevel(), 4);
  assert.ok(isLevelUnlocked(5));
  assert.equal(currentLevelNumber(), 5);

  markLevelComplete(5);
  assert.equal(currentLevelNumber(), 5, "the last level stays the destination once everything is done");
  assert.equal(unlockedCount(), 5);

  // A corrupted or out-of-range value can't unlock everything.
  store.set("signly:practice:level", "99");
  assert.equal(highestCompletedLevel(), 5);
  store.set("signly:practice:level", "not a number");
  assert.equal(highestCompletedLevel(), 0);
});

// --- speed -----------------------------------------------------------------

test("the speed deck holds every letter and digit exactly once", () => {
  assert.equal(SPEED_POOL.length, 36);
  const deck = createDeck();
  assert.equal(deck.length, 36);
  assert.equal(new Set(deck).size, 36);
  assert.deepEqual([...deck].sort(), [...SPEED_POOL].sort());
});

test("dealing a whole deck never repeats a sign, and a reshuffle never repeats across the seam", () => {
  for (let run = 0; run < 300; run++) {
    const first = createDeck();
    const second = createDeck(first[first.length - 1]);
    assert.notEqual(second[0], first[first.length - 1], "a sign came back immediately after a reshuffle");
    const dealt = [...first, ...second];
    // Within each deck every sign is unique; across the seam only the deck
    // boundary can repeat, which the check above rules out.
    assert.equal(new Set(dealt.slice(0, 36)).size, 36);
    assert.equal(new Set(dealt.slice(36)).size, 36);
  }
});

test("signsLeft counts down to zero on the last card", () => {
  const deck = createDeck();
  assert.equal(signsLeft(deck, 0), 35);
  assert.equal(signsLeft(deck, 35), 0);
  assert.equal(signsLeft(deck, 99), 0);
});

test("the three speed modes are 60/30/15 seconds with rising multipliers", () => {
  assert.deepEqual(SPEED_MODES.map((m) => m.id), ["easy", "medium", "hard"]);
  assert.deepEqual(SPEED_MODES.map((m) => m.seconds), [60, 30, 15]);
  assert.deepEqual(SPEED_MODES.map((m) => m.multiplier), [1, 1.5, 2]);
  // Every mode carries its own colour — that's what makes them tell apart.
  assert.equal(new Set(SPEED_MODES.map((m) => m.theme.bar)).size, 3);
});

test("an unknown or missing mode falls back to the default 30-second round", () => {
  assert.equal(findSpeedMode(null).id, DEFAULT_SPEED_MODE);
  assert.equal(findSpeedMode("impossible").id, DEFAULT_SPEED_MODE);
  assert.equal(findSpeedMode("hard").seconds, 15);
  assert.equal(speedHref("easy"), "/speed?mode=easy");
});

test("speed points scale with the mode and always land on a whole number", () => {
  const [easy, medium, hard] = SPEED_MODES;
  assert.equal(speedPoints(10, easy), 10);
  assert.equal(speedPoints(10, medium), 15);
  assert.equal(speedPoints(10, hard), 20);
  for (const base of [10, 20, 30]) {
    for (const mode of SPEED_MODES) {
      assert.ok(Number.isInteger(speedPoints(base, mode)), `${base} × ${mode.multiplier} must stay whole`);
    }
  }
});
