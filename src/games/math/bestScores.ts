// Per-game personal bests, kept in localStorage so the hub can show "Best
// 120" on a card. Not part of the profile/XP contract on purpose — it's a
// local nicety, and the leaderboard remains XP-based via completeRound().
const KEY = "signly:math:best";

type BestMap = Record<string, { score: number; correct: number; total: number; plays: number }>;

function read(): BestMap {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as BestMap;
  } catch {
    return {};
  }
}

export function getBest(gameId: string): BestMap[string] | undefined {
  return read()[gameId];
}

export function recordBest(gameId: string, score: number, correct: number, total: number): void {
  try {
    const all = read();
    const prev = all[gameId];
    all[gameId] = {
      score: Math.max(prev?.score ?? 0, score),
      correct: score >= (prev?.score ?? 0) ? correct : (prev?.correct ?? correct),
      total,
      plays: (prev?.plays ?? 0) + 1,
    };
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // private mode etc. — bests just won't persist
  }
}
