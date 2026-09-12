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

/** A user's persistent profile: streak, XP, level, and Persona verification. */
export type UserProfile = {
  id: string;
  name: string;
  streak: number;
  xp: number;
  level: number;
  verified: boolean;
};
