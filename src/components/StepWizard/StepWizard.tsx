"use client";

import React, { ReactNode } from "react";

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
}

export default function StepWizard({ steps, current, onStepChange, children }: StepWizardProps) {
  const pct = ((current + 1) / steps.length) * 100;
  return (
    <div className="w-full">
      {/* Header Stepper */}
      <div className="relative mb-6">
        <div className="h-1 bg-gray-200 rounded-full" />
        <div className="absolute left-0 top-0 h-1 bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        <div className="mt-3 grid" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0,1fr))` }}>
          {steps.map((s, idx) => {
            const state = idx < current ? "done" : idx === current ? "active" : "todo";
            const base = "flex items-center gap-3 px-2 py-2 rounded-md select-none cursor-pointer";
            const cls = state === "active"
              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
              : state === "done"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "text-gray-600 hover:bg-gray-50 border border-transparent";
            return (
              <button
                key={s.key}
                type="button"
                className={`${base} ${cls} justify-start`}
                onClick={() => onStepChange?.(idx)}
                aria-current={state === "active"}
                title={s.description || s.title}
              >
                {s.icon ? (
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-md ${state === "done" ? "bg-green-600 text-white" : state === "active" ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700"}`}>
                    {/* icon */}
                    {s.icon}
                  </span>
                ) : (
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${state === "done" ? "bg-green-600 text-white" : state === "active" ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700"}`}>
                    {idx + 1}
                  </span>
                )}
                <span className="flex flex-col items-start leading-tight truncate">
                  <span className="text-sm md:text-base font-semibold">{`Step ${idx + 1}`}</span>
                  <span className="text-xs md:text-sm font-medium opacity-90 truncate max-w-[10rem] md:max-w-[14rem]">{s.title}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="rounded-lg border border-gray-200">
        {children}
      </div>
    </div>
  );
}
