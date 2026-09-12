// Second-resolution countdown used by Speed Challenge (whole round) and Math
// mode (per problem). Ticks off wall-clock time rather than counting
// intervals so a throttled background tab still ends on time.
import { useCallback, useEffect, useRef, useState } from "react";

export function useCountdown(seconds: number, onExpire?: () => void) {
  const [secondsLeft, setSecondsLeft] = useState(seconds);
  const [running, setRunning] = useState(false);
  const deadline = useRef<number>(0);
  const expireRef = useRef(onExpire);
  useEffect(() => {
    expireRef.current = onExpire;
  });

  const start = useCallback(
    (total = seconds) => {
      deadline.current = Date.now() + total * 1000;
      setSecondsLeft(total);
      setRunning(true);
    },
    [seconds],
  );

  const stop = useCallback(() => setRunning(false), []);

  const reset = useCallback(
    (total = seconds) => {
      setRunning(false);
      setSecondsLeft(total);
    },
    [seconds],
  );

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        clearInterval(id);
        setRunning(false);
        expireRef.current?.();
      }
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  return { secondsLeft, running, start, stop, reset };
}
