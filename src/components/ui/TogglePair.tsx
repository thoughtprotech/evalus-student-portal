"use client";

import React from "react";
import clsx from "clsx";

type Value = string | number | boolean;

type Option<T extends Value> = {
  label: React.ReactNode;
  value: T;
};

type TogglePairProps<T extends Value> = {
  value: T;
  onChange: (val: T) => void;
  left: Option<T>;
  right: Option<T>;
  className?: string;
  size?: "sm" | "md";
  /**
   * Make both segments the same width for a consistent pill look
   */
  equalWidth?: boolean;
  /**
   * Tailwind width utility to control segment width when equalWidth is true
   * e.g. "w-20", "w-24", "w-28". Defaults to w-24 for better label fit.
   */
  segmentWidthClass?: string;
};

export default function TogglePair<T extends Value>({
  value,
  onChange,
  left,
  right,
  className = "",
  size = "sm",
  equalWidth = true,
  segmentWidthClass = "w-28",
}: TogglePairProps<T>) {
  const sizeClasses = size === "sm" ? "text-sm h-9 px-4" : "text-base h-12 px-5";

  const isLeft = value === left.value;
  const isRight = value === right.value;

  return (
    <div
      className={clsx(
  "inline-flex shrink-0 rounded-full border border-gray-200 bg-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.06)]",
        className
      )}
      role="group"
      aria-label="Toggle pair"
    >
      <button
        type="button"
        onClick={() => onChange(left.value)}
        aria-pressed={isLeft}
        className={clsx(
          "relative select-none transition-transform duration-150 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 flex items-center justify-center text-center leading-none font-semibold whitespace-nowrap first:rounded-l-full",
          sizeClasses,
          equalWidth && segmentWidthClass,
          isLeft ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-white text-gray-700 hover:bg-gray-50",
          "active:scale-[0.98]"
        )}
      >
        {left.label}
      </button>
      <button
        type="button"
        onClick={() => onChange(right.value)}
        aria-pressed={isRight}
        className={clsx(
          "relative select-none transition-transform duration-150 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 flex items-center justify-center text-center leading-none font-semibold whitespace-nowrap last:rounded-r-full",
          sizeClasses,
          equalWidth && segmentWidthClass,
          isRight ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-white text-gray-700 hover:bg-gray-50",
          "active:scale-[0.98]"
        )}
      >
        {right.label}
      </button>
    </div>
  );
}
