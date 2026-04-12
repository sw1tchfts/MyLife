"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface RestTimerProps {
  defaultSeconds?: number;
  onComplete?: () => void;
}

export default function RestTimer({
  defaultSeconds = 90,
  onComplete,
}: RestTimerProps) {
  const [seconds, setSeconds] = useState(defaultSeconds);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
    setRemaining(0);
  }, []);

  const start = useCallback(() => {
    stop();
    setRemaining(seconds);
    setRunning(true);
  }, [seconds, stop]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          setRunning(false);
          onCompleteRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = seconds > 0 ? (remaining / seconds) * 100 : 0;

  const PRESETS = [30, 60, 90, 120, 180];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
        Rest Timer
      </h3>

      {/* Preset buttons */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => {
              setSeconds(p);
              if (!running) setRemaining(0);
            }}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              seconds === p
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            {p >= 60 ? `${Math.floor(p / 60)}:${String(p % 60).padStart(2, "0")}` : `${p}s`}
          </button>
        ))}
      </div>

      {/* Timer display */}
      <div className="relative mb-3">
        <div className="flex items-center justify-center py-4">
          <span
            className={`font-mono text-4xl font-bold ${
              running
                ? remaining <= 5
                  ? "text-red-500"
                  : "text-blue-600 dark:text-blue-400"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            {mins}:{String(secs).padStart(2, "0")}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              remaining <= 5 && running
                ? "bg-red-500"
                : "bg-blue-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {!running ? (
          <button
            onClick={start}
            className="flex-1 rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Start
          </button>
        ) : (
          <>
            <button
              onClick={stop}
              className="flex-1 rounded-md bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Stop
            </button>
            <button
              onClick={() => {
                stop();
                start();
              }}
              className="flex-1 rounded-md bg-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}
