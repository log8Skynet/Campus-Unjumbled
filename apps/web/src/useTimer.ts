import { useCallback, useEffect, useRef, useState } from "react";
import { formatDuration } from "../lib/format";

/**
 * Display-only stopwatch (the server measures the real duration).
 * Updates every 100ms from Date.now() so it never drifts.
 */
export function useTimer() {
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef<number | null>(null);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = () => {
    if (interval.current) clearInterval(interval.current);
    interval.current = null;
  };

  const start = useCallback(() => {
    if (interval.current) return; // already running
    startedAt.current = Date.now();
    setElapsed(0);
    interval.current = setInterval(() => {
      if (startedAt.current !== null) setElapsed(Date.now() - startedAt.current);
    }, 100);
  }, []);

  const stop = useCallback((): number => {
    clear();
    const final = startedAt.current === null ? 0 : Date.now() - startedAt.current;
    setElapsed(final);
    return final;
  }, []);

  useEffect(() => clear, []);

  return { elapsed, formatted: formatDuration(elapsed), start, stop };
}
