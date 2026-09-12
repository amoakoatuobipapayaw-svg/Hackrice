// Lightweight stand-in for recognition's eventual "hold to confirm" rule
// (see PLAN.md, workstream A): true once `current.label` has matched
// `target` continuously for HOLD_MS, so game screens don't flicker-advance
// on a single frame. Safe to keep even after A's real hold-to-confirm logic
// lands inside useSignRecognition() — this just adds a bit more debounce.
import { useEffect, useRef, useState } from "react";
import type { SignResult } from "../lib/contracts";

const HOLD_MS = 600;
const POLL_MS = 150;

export function useHoldToConfirm(current: SignResult | null, target: string): boolean {
  const matches = current?.label?.trim().toUpperCase() === target.trim().toUpperCase();
  const [confirmed, setConfirmed] = useState(false);
  const heldSinceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!matches) {
      heldSinceRef.current = null;
      setConfirmed(false);
      return;
    }
    if (heldSinceRef.current === null) heldSinceRef.current = Date.now();

    const id = setInterval(() => {
      if (heldSinceRef.current !== null && Date.now() - heldSinceRef.current >= HOLD_MS) {
        setConfirmed(true);
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [current, target, matches]);

  // `matches` is recomputed synchronously every render, so even if
  // `confirmed` state hasn't caught up yet (its effect runs after commit),
  // a target change can never leak a stale `true` into this render.
  return confirmed && matches;
}
