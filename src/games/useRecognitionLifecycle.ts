// Starts recognition once (while `active`) and stops it on cleanup, without
// needing recognition.start/stop to be referentially stable across renders
// — useSignRecognition() returns a fresh object each render.
import { useEffect, useRef } from "react";
import type { SignRecognition } from "../lib/contracts";

export function useRecognitionLifecycle(recognition: SignRecognition, active: boolean) {
  const ref = useRef(recognition);
  useEffect(() => {
    ref.current = recognition;
  });

  useEffect(() => {
    if (!active) return;
    ref.current.start();
    return () => ref.current.stop();
  }, [active]);
}
