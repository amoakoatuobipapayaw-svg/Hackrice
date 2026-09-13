// contracts.ts — shared types and hook signatures that cross workstream folder
// boundaries. Owned by Workstream D. Edit only by announcing first in the team
// chat, then push immediately so everyone rebases (see CLAUDE.md).
//
// Every workstream imports FROM here. Until a real module exists, import the
// MOCK from that workstream's folder (e.g. recognition/mock.ts) instead of
// building the real thing directly against another team's in-progress code.

// --- Recognition (A) ---------------------------------------------------

/** A single recognized sign frame: best-guess label + model confidence. */
export type SignResult = {
  label: string;
  confidence: number;
};

/** Shape of the hook A exposes as useSignRecognition(). */
export interface SignRecognition {
  current: SignResult | null;
  start(): void;
  stop(): void;
}

// --- Games (B) -----------------------------------------------------------

export type GameMode = "lesson" | "speed" | "math";

/** Outcome of one completed round, in any mode, used to award XP. */
export type RoundResult = {
  mode: GameMode;
  score: number;
  correct: number;
  total: number;
  xp: number;
};

// --- Voice (C) -------------------------------------------------------------

/** Shape of the hook C exposes as useVoice(). */
export interface VoiceApi {
  speak(t: string): Promise<void>;
  listen(): Promise<string>;
  isSpeaking: boolean;
}

// --- Meta / backend (D) ---------------------------------------------------

/** One row on the leaderboard. */
export type ScoreEntry = {
  userId: string;
  name: string;
  xp: number;
  verified: boolean;
  updatedAt: string;
};

/**
 * A user's persistent profile: streak, XP, level, and Persona verification.
 * `email` is present only for Google-authenticated accounts (see
 * lib/auth.ts) and absent for guests — that's the signal gameLogic.ts
 * uses to decide whether a completed round persists to Supabase at all.
 * `verified` (Persona) is a separate, independent gate: it only controls
 * whether an authenticated account's scores post to the public
 * leaderboard, matching the "Google gets you an account, Persona proves
 * you're human enough to compete" model.
 */
export type UserProfile = {
  id: string;
  name: string;
  email?: string;
  streak: number;
  xp: number;
  level: number;
  verified: boolean;
  /** IDs of games/signCatalog.ts UNITS the learner has finished, driving the
   * roadmap's sequential unlock (see isUnitUnlocked). Local-only for now —
   * not synced to Supabase (lib/supabase.ts's syncProfile upserts a fixed
   * column list), so this won't yet follow a signed-in user across devices.
   * Optional so existing stored profiles without it still parse. */
  completedUnits?: string[];
};
