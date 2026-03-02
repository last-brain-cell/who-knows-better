"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function useTimer(durationMs: number = 20000) {
  const [timeLeft, setTimeLeft] = useState(durationMs);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  }, []);

  const reset = useCallback(() => {
    setTimeLeft(durationMs);
    startTimeRef.current = Date.now();
  }, [durationMs]);

  useEffect(() => {
    if (!isRunning) return;

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, durationMs - elapsed);
      setTimeLeft(remaining);

      if (remaining > 0) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        setIsRunning(false);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isRunning, durationMs]);

  const seconds = Math.ceil(timeLeft / 1000);
  const progress = timeLeft / durationMs;

  return { timeLeft, seconds, progress, isRunning, start, stop, reset };
}
