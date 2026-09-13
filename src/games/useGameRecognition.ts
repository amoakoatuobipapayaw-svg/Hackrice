// Thin switch between A's real recognizer and A's mock. Append `?mock=1` to
// a game URL to play without a camera (demo fallback, UI work on a machine
// with no webcam, automated smoke tests). The mock is fed the current target
// so every prompt confirms after the normal one-second hold.
//
// `?mock=stall` is the same mock feeding a sign that is NEVER the prompt, so
// nothing ever confirms — the way to exercise the "keep trying" coaching
// states and Practice's stuck-sign skip offer without a camera.
import { useMockSignRecognition } from "../recognition/mock";
import { useSignRecognition } from "../recognition/useSignRecognition";
import type { Recognition, RecognitionOptions } from "../recognition/types";

const PARAMS = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;

export const USE_MOCK_RECOGNITION = PARAMS?.has("mock") ?? false;
const STALL = PARAMS?.get("mock") === "stall";

export function useGameRecognition(options: RecognitionOptions): Recognition {
  // The flag is constant for the page's lifetime, so hook order never changes.
  const recognize = USE_MOCK_RECOGNITION ? useMockSignRecognition : useSignRecognition;
  const label = STALL ? (options.target === "S" ? "A" : "S") : options.target;
  const sequence = options.target ? [{ label: label as string, confidence: 0.95 }, null] : [null];
  return recognize(USE_MOCK_RECOGNITION ? { ...options, sequence } : options);
}
