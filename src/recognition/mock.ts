// Fake recognizer so B can build game modes before A's real classifier
// exists. Cycles through a fixed label every couple seconds. Owned by A —
// replace the internals, keep the SignRecognition shape from contracts.ts.
import { useEffect, useRef, useState } from "react";
import type { SignRecognition, SignResult } from "../lib/contracts";

const FAKE_LABELS = ["A", "B", "THANK YOU", "1", "5"];

export function useMockSignRecognition(): SignRecognition {
  const [current, setCurrent] = useState<SignResult | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function start() {
    let i = 0;
    intervalRef.current = setInterval(() => {
      setCurrent({ label: FAKE_LABELS[i % FAKE_LABELS.length], confidence: 0.9 });
      i++;
    }, 2000);
  }

  function stop() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setCurrent(null);
  }

  useEffect(() => stop, []);

  return { current, start, stop };
}
