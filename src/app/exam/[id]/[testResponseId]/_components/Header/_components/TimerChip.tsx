"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Timer } from "lucide-react";

type TimerChipProps = {
  title: string;
  durationMs: number;         // e.g., 10 * 60_000 for 10 minutes
  className?: string;         // optional container class override
  onComplete?: () => void;    // optional callback when the timer reaches 0
};

export default function TimerChip({
  title,
  durationMs,
  className = "",
  onComplete,
}: TimerChipProps) {
  const safeDuration = useMemo(
    () => Math.max(0, Math.floor(durationMs)),
    [durationMs]
  );
  const [remainingMs, setRemainingMs] = useState<number>(safeDuration);
  const intervalRef = useRef<number | null>(null);

  // Reset countdown when duration changes
  useEffect(() => {
    setRemainingMs(safeDuration);
  }, [safeDuration]);

  // Countdown tick
  useEffect(() => {
    const tick = () => {
      setRemainingMs((prev) => {
        const next = Math.max(0, prev - 1_000);
        if (next === 0) {
          if (intervalRef.current != null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          onComplete?.();
        }
        return next;
      });
    };

    // Start immediately
    tick();
    intervalRef.current = window.setInterval(tick, 1_000) as unknown as number;

    return () => {
      if (intervalRef.current != null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [onComplete]);

  const formatted = formatMs(remainingMs);

  return (
    <div
      className={`h-fit inline-flex items-center gap-2 rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-800 bg-gray-50 shadow-inner ${className}`}
      aria-live="polite"
      aria-label={`${title}: ${formatted}`}
      role="timer"
    >
      <Timer className="w-5 h-5 text-gray-600" aria-hidden />
      <span className="font-medium text-gray-700">{title}</span>
      <time className="tabular-nums font-semibold" dateTime={toISODuration(formatted)}>
        {formatted}
      </time>
    </div>
  );
}

/* Helpers */

function formatMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  if (h > 0) {
    return [h, m, s].map((n, i) => (i === 0 ? String(n) : String(n).padStart(2, "0"))).join(":");
  }
  return [String(m).padStart(2, "0"), String(s).padStart(2, "0")].join(":");
}

// "MM:SS" or "HH:MM:SS" -> ISO 8601 duration (PT#H#M#S)
function toISODuration(formatted: string): string {
  const parts = formatted.split(":").map((p) => parseInt(p, 10));
  let h = 0, m = 0, s = 0;

  if (parts.length === 2) {
    [m, s] = parts;
  } else if (parts.length === 3) {
    [h, m, s] = parts;
  }

  const hStr = h > 0 ? `${h}H` : "";
  const mStr = m > 0 ? `${m}M` : "";
  const sSafe = isNaN(s) ? 0 : s;
  const sStr = `${sSafe}S`;
  return `PT${hStr}${mStr}${sStr}`;
}
