"use client";

import React from "react";
import clsx from "clsx";

type YesNoToggleProps = {
  value: boolean;
  onChange: (val: boolean) => void;
  className?: string;
  size?: "sm" | "md";
  equalWidth?: boolean;
  segmentWidthClass?: string; // e.g., w-20 or min-w-[64px]
};

export default function YesNoToggle({ value, onChange, className = "", size = "sm", equalWidth = true, segmentWidthClass = "w-24" }: YesNoToggleProps) {
  const sizeClasses =
    size === "sm"
      ? "text-sm h-8 px-3.5"
      : "text-base h-12 px-5";
  const widthClasses = equalWidth ? `${segmentWidthClass}` : "";

  return (
    <div
      className={clsx(
  "inline-flex shrink-0 rounded-full border border-gray-200 bg-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.06)]",
        className
      )}
      role="group"
      aria-label="Yes or No"
    >
    <button
        type="button"
        aria-pressed={value}
        onClick={() => onChange(true)}
        className={clsx(
          "relative select-none transition-transform duration-150 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 flex items-center justify-center text-center leading-none font-semibold tracking-normal whitespace-nowrap first:rounded-l-full",
          sizeClasses,
          widthClasses,
      value ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-white text-gray-700 hover:bg-gray-50",
      "active:scale-[0.98]"
        )}
      >
        Yes
      </button>
    <button
        type="button"
        aria-pressed={!value}
        onClick={() => onChange(false)}
        className={clsx(
          "relative select-none transition-transform duration-150 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 flex items-center justify-center text-center leading-none font-semibold tracking-normal whitespace-nowrap last:rounded-r-full",
          sizeClasses,
          widthClasses,
      !value ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-white text-gray-700 hover:bg-gray-50",
      "active:scale-[0.98]"
        )}
      >
        No
      </button>
    </div>
  );
}
