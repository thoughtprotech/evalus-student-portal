"use client";

import React, { ReactNode, useCallback } from "react";
import { Check } from "lucide-react";

type Step = {
  key: string;
  title: string;
  description?: string;
  icon?: ReactNode;
};

export interface StepWizardProps {
  steps: Step[];
  current: number;
  onStepChange?: (idx: number) => void;
  children: ReactNode;
  headerRight?: ReactNode;
}

export default function StepWizard({ steps, current, onStepChange, children, headerRight }: StepWizardProps) {
  const pct = ((current + 1) / steps.length) * 100;

  const handleKey = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!onStepChange) return;
      if (e.key === "ArrowRight") {
        onStepChange(Math.min(current + 1, steps.length - 1));
      } else if (e.key === "ArrowLeft") {
        onStepChange(Math.max(current - 1, 0));
      }
    },
    [current, onStepChange, steps.length]
  );

  return (
    <div className="w-full">
      {/* Header Stepper */}
      <div className="sticky top-0 z-30 -mx-2 sm:-mx-3 md:mx-0">
        <div className="relative mb-4 bg-white/70 supports-[backdrop-filter]:bg-white/60 backdrop-blur border-b border-gray-200 px-2 sm:px-3 md:px-0 pt-2">
          {headerRight ? (
            <div className="absolute right-2 sm:right-3 md:right-0 -top-2 md:top-2">
              {headerRight}
            </div>
          ) : null}
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-1 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
              aria-hidden
            />
          </div>
          <span className="sr-only" role="status" aria-live="polite">
            {`Progress: ${Math.round(pct)}%`}
          </span>
          <nav
            className="mt-3 grid gap-2 overflow-x-auto pb-2"
            style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0,1fr))` }}
            aria-label="Steps"
            onKeyDown={handleKey}
            tabIndex={0}
          >
            {steps.map((s, idx) => {
              const state = idx < current ? "done" : idx === current ? "active" : "todo";
              const base = "flex items-center gap-3 px-2 py-2 rounded-lg select-none";
              const interactivity = "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-colors";
              const clickable = typeof onStepChange === "function";
              const cls =
                state === "active"
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs"
                  : state === "done"
                  ? "bg-green-50 text-green-700 border border-green-200 shadow-xs"
                  : "text-gray-700 hover:bg-gray-50 border border-gray-200";
              return (
                <button
                  key={s.key}
                  type="button"
                  className={`${base} ${cls} ${interactivity} justify-start ${clickable ? "cursor-pointer" : "cursor-default"}`}
                  onClick={() => onStepChange?.(idx)}
                  aria-current={state === "active" ? "step" : undefined}
                  aria-label={`${s.title} (${state})`}
                  title={s.description || s.title}
                >
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-sm font-semibold shrink-0 ${
                      state === "done"
                        ? "bg-green-600 text-white border-green-600"
                        : state === "active"
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-gray-100 text-gray-700 border-gray-300"
                    }`}
                  >
                    {state === "done" ? (
                      <Check className="w-4 h-4" />
                    ) : s.icon ? (
                      s.icon
                    ) : (
                      idx + 1
                    )}
                  </span>
                  <span className="flex flex-col items-start leading-tight truncate min-w-0">
                    <span className="text-[11px] md:text-xs font-medium uppercase tracking-wide opacity-70">{`Step ${idx + 1}`}</span>
                    <span className="text-sm md:text-base font-semibold truncate max-w-[10rem] md:max-w-[14rem]">
                      {s.title}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {children}
      </div>
    </div>
  );
}
