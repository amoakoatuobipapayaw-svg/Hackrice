// Real hook A is building. Re-exports the mock for now so every other
// workstream can import a stable path — swap the body for the real
// webcam + handLandmarker + signClassifier pipeline, keep the same signature.
import type { SignRecognition } from "../lib/contracts";
import { useMockSignRecognition } from "./mock";

export function useSignRecognition(): SignRecognition {
  return useMockSignRecognition();
}
