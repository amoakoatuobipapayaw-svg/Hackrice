// TODO(A): given a frame of 21 hand landmarks, return the best-guess
// letter/number/word as a SignResult. Start rule-based on finger extension
// state for A-Z and 0-9 (see PLAN.md).
import type { SignResult } from "../lib/contracts";

export function classifySign(_landmarks: unknown): SignResult {
  throw new Error("classifySign not implemented — see src/recognition/signClassifier.ts");
}
