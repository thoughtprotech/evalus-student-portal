"use client";

import React from "react";
import type { QuestionPayload } from "../engine/types";

export type RendererProps = {
  question: QuestionPayload;
  value?: string | null;
  onChange: (val: string) => void;
};

export function DefaultQuestionRenderer({ question, value, onChange }: RendererProps) {
  const html = question?.questionText ?? "";
  const optionsJson = question?.questionOptionsJson ?? null;

  let options: string[] = [];
  try {
    const parsed = optionsJson ? JSON.parse(optionsJson) : null;
    if (parsed && Array.isArray(parsed.options)) options = parsed.options as string[];
  } catch {}

  return (
    <div className="space-y-4">
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html || "<p>No question text</p>" }} />
      {options.length > 0 && (
        <div className="space-y-2">
          {options.map((opt, idx) => (
            <label key={idx} className="flex items-center gap-2">
              <input
                type="radio"
                name={`answer-${question?.id ?? "q"}`}
                value={opt}
                checked={value === opt}
                onChange={(e) => onChange(e.target.value)}
              />
              <span dangerouslySetInnerHTML={{ __html: opt }} />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// Future: export getRenderer(question) to switch by question type
