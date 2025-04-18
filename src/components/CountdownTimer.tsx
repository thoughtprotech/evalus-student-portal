"use client";

import { useEffect, useRef, useState } from "react";

interface CountdownTimerProps {
  /** Initial time in "HH:MM:SS" format */
  initialTime: string;
  /** Called once when timer reaches zero */
  onComplete: () => void;
  /** Optional className for styling */
  className?: string;
}

export default function CountdownTimer({
  initialTime,
  onComplete,
  className = "",
}: CountdownTimerProps) {
  // Parse "HH:MM:SS" into total seconds
  const parseTime = (time: string) => {
    const [h, m, s] = time.split(":").map(Number);
    return h * 3600 + m * 60 + s;
  };

  // Format seconds back into "HH:MM:SS"
  const formatTime = (secs: number) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const [remaining, setRemaining] = useState(() => parseTime(initialTime));
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // start countdown
    intervalRef.current = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          // we're at zero or below
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      // cleanup on unmount
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [onComplete]);

  return (
    <div className={className}>
      <span>{formatTime(remaining)}</span>
    </div>
  );
}
