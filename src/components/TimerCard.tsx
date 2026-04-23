"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const DEFAULT_DURATION_SECONDS = 1 * 60;
const DEFAULT_DURATION_MS = DEFAULT_DURATION_SECONDS * 1000;
const CIRCLE_RADIUS = 88;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function TimerCard() {
  const [remainingMs, setRemainingMs] = useState(DEFAULT_DURATION_MS);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [expand, setExpand] = useState(false);

  useEffect(() => {
    if (!isRunning || endTime === null) return;
    if (remainingMs === 0) {
      setIsRunning(false);
      setEndTime(null);
      return;
    }

    let frameId = 0;

    const tick = () => {
      const nextRemainingMs = Math.max(0, endTime - Date.now());

      setRemainingMs(nextRemainingMs);

      if (nextRemainingMs === 0) {
        setIsRunning(false);
        setEndTime(null);
        return;
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, [endTime, isRunning, remainingMs]);

  const remainingSeconds = Math.ceil(remainingMs / 1000);

  const progress = useMemo(
    () => Math.max(0.00001, 1 - remainingMs / DEFAULT_DURATION_MS),
    [remainingMs],
  );
  const dashOffset = CIRCUMFERENCE * (1 - progress)

  return (
    <section className={`flex flex-col  w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-muted shadow-sm transition-all duration-300 ease-in-out ${expand ? "h-full" : "h-13"}`}>
      <header className="flex min-h-12 items-center justify-between border-b border-border bg-muted-hover px-4">
        <h2 className="text-2xl font-bold leading-tight text-foreground">
          Timer
        </h2>
        <button onClick={() => setExpand(!expand)} type="button">
          +
        </button>
      </header>

      <div className=" flex flex-col items-center justify-between flex-1 py-3">
        <p className=" text-4xl font-bold tracking-tight text-foreground">
          {formatTime(remainingSeconds)}
        </p>

        <div className="relative  flex size-56 items-center justify-center">
          <svg
            className="-rotate-90"
            viewBox="0 0 220 220"
            aria-hidden="true"
          >
            <circle
              cx="110"
              cy="110"
              r={CIRCLE_RADIUS}
              fill="none"
              className="stroke-border"
              strokeWidth="16"
            />
            <circle
              cx="110"
              cy="110"
              r={CIRCLE_RADIUS}
              fill="none"
              className={`stroke-primary ${!isRunning && "transition-all duration-1000"}`}
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
            />
          </svg>

          <button
            type="button"
            onClick={() => {
              if (isRunning) {
                setIsRunning(false);
                setEndTime(null);
                return;
              }

              const nextRemainingMs =
                remainingMs === 0 ? DEFAULT_DURATION_MS : remainingMs;

              if (remainingMs === 0) {
                setRemainingMs(DEFAULT_DURATION_MS);
              }

              setEndTime(Date.now() + nextRemainingMs);
              setIsRunning(true);
            }}
            className="absolute flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform duration-200 hover:scale-105"
            aria-label={isRunning ? "Pause timer" : "Start timer"}
          >
            {isRunning ? (
              <Pause className="size-10 fill-current" />
            ) : (
              <Play className="ml-1 size-10 fill-current" />
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsRunning(false);
            setEndTime(null);
            setRemainingMs(DEFAULT_DURATION_MS);
          }}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-base font-medium text-foreground transition-colors duration-200 hover:bg-muted-hover"
        >
          <RotateCcw className="size-4" />
          Reset
        </button>
      </div>
    </section>
  );
}
