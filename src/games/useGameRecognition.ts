// Thin switch between A's real recognizer and A's mock. Append `?mock=1` to
// a game URL to play without a camera (demo fallback, UI work on a machine
// with no webcam, automated smoke tests). The mock is fed the current target
// so every prompt confirms after the normal one-second hold.
import { useMockSignRecognition } from "../recognition/mock";
import { useSignRecognition } from "../recognition/useSignRecognition";
import type { Recognition, RecognitionOptions } from "../recognition/types";

export const USE_MOCK_RECOGNITION =
  typeof window !== "undefined" && new URLSearchParams(window.location.search).has("mock");

export function useGameRecognition(options: RecognitionOptions): Recognition {
  // The flag is constant for the page's lifetime, so hook order never changes.
  const recognize = USE_MOCK_RECOGNITION ? useMockSignRecognition : useSignRecognition;
  const sequence = options.target ? [{ label: options.target, confidence: 0.95 }, null] : [null];
  return recognize(USE_MOCK_RECOGNITION ? { ...options, sequence } : options);
}
