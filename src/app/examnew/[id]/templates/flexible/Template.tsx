"use client";

import React, { useMemo } from "react";
import type { ExamTemplateProps } from "../../engine/types";
import type { ExamPreset } from "../presets";
import { DefaultQuestionRenderer } from "../../renderers";

function classNames(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

function Timer({ ms }: { ms?: number }) {
  const text = useMemo(() => {
    if (!ms && ms !== 0) return "--:--";
    const total = Math.max(0, Math.floor(ms / 1000));
    const mm = Math.floor(total / 60)
      .toString()
      .padStart(2, "0");
    const ss = (total % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  }, [ms]);
  return <span className="font-mono tabular-nums">{text}</span>;
}

function Legend() {
  const item = (color: string, label: string) => (
    <div className="flex items-center gap-2 text-xs text-gray-600" key={label}>
      <span className={classNames("w-3 h-3 rounded", color)} />
      {label}
    </div>
  );
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
      {item("bg-gray-300", "Not Visited")}
      {item("bg-sky-300", "Viewed")}
      {item("bg-emerald-400", "Answered")}
      {item("bg-rose-400", "Not Answered")}
      {item("bg-amber-400", "Marked")}
      {item("bg-violet-400", "Ans + Marked")}
    </div>
  );
}

function StatusColor({ status }: { status: string }) {
  const map: Record<string, string> = {
    notVisited: "bg-gray-300",
    viewed: "bg-sky-300",
    answered: "bg-emerald-400",
    notAnswered: "bg-rose-400",
    markedForReview: "bg-amber-400",
    answeredMarkedForReview: "bg-violet-400",
  };
  return <span className={classNames("inline-block w-8 h-8 rounded grid place-items-center text-xs text-white", map[status] || "bg-gray-300")} />;
}

function Palette({
  total,
  currentIndex,
  getStatus,
  onJump,
}: {
  total: number;
  currentIndex: number;
  getStatus: (i: number) => string;
  onJump: (i: number) => void;
}) {
  const items = Array.from({ length: total });
  return (
    <div className="grid grid-cols-8 gap-2">
      {items.map((_, i) => (
        <button
          key={i}
          onClick={() => onJump(i)}
          className={classNames(
            "relative",
            i === currentIndex && "ring-2 ring-offset-2 ring-blue-500"
          )}
          title={`Question ${i + 1}`}
        >
          <StatusColor status={getStatus(i)} />
          <span className="absolute inset-0 text-[10px] text-white grid place-items-center">
            {i + 1}
          </span>
        </button>
      ))}
    </div>
  );
}

// DefaultQuestionRenderer used as the centralized question renderer

export function FlexibleTemplate({ state, actions, settings, preset }: ExamTemplateProps & { preset: ExamPreset }) {
  const brandBar = preset.brand === "blue" ? "bg-blue-600" : preset.brand === "orange" ? "bg-orange-600" : "bg-zinc-800";
  const headerPad = preset.headerDensity === "compact" ? "py-2" : "py-3";

  const total = state.meta.length;
  const current = state.current.index;
  const qid = state.current.questionId ?? undefined;
  const q = qid ? state.questions[qid] : undefined;

  const layout = preset.palettePosition; // right | left | bottom

  const shellCls = "h-[calc(100vh-64px)]"; // leave some room if header exists

  const main = (
    <div className="flex flex-col gap-3 p-4 overflow-auto">
      <div className="text-sm text-gray-500">Question {current + 1} of {total}</div>
      {q && (
        <DefaultQuestionRenderer
          question={q}
          value={state.attempts[qid ?? -1]?.answer}
          onChange={(val) => qid && actions.saveAnswer(qid, val)}
        />
      )}
      <div className="flex items-center gap-2 pt-2">
        <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={() => actions.next()}>Save & Next</button>
        <button className="px-3 py-2 rounded bg-amber-500 text-white" onClick={() => qid && actions.markForReview(qid)}>Mark for Review</button>
        <button className="px-3 py-2 rounded bg-rose-500 text-white" onClick={() => qid && actions.clearAnswer(qid)}>Clear</button>
        <div className="flex-1" />
        <button className="px-3 py-2 rounded bg-zinc-700 text-white" onClick={() => actions.previous()}>Prev</button>
        <button className="px-3 py-2 rounded bg-zinc-700 text-white" onClick={() => actions.next()}>Next</button>
      </div>
    </div>
  );

  const palette = (
    <div className="flex flex-col gap-3 p-4 overflow-auto">
      <div className="font-medium">Question Palette</div>
      <Palette
        total={total}
        currentIndex={current}
        getStatus={(i) => {
          const id = state.meta[i]?.questionId;
          if (!id) return "notVisited";
          return state.attempts[id]?.status || "notVisited";
        }}
        onJump={(i) => actions.jumpTo(i)}
      />
      {preset.showLegend && (
        <div className="pt-3 border-t border-gray-200">
          <Legend />
        </div>
      )}
      <div className="pt-3 border-t border-gray-200">
        <button className="px-3 py-2 w-full rounded bg-emerald-600 text-white" onClick={() => actions.submit()}>Submit</button>
      </div>
    </div>
  );

  const header = (
    <div className={`${brandBar} ${headerPad} px-4 text-white flex items-center gap-3`}>
      <div className="font-semibold">{state.title || "Exam"}</div>
      <div className="flex-1" />
      <div className="text-sm">Time Left: <Timer ms={state.timeLeftMs} /></div>
    </div>
  );

  return (
    <div className="w-full h-screen flex flex-col">
      {header}
      <div className={classNames("flex-1 grid", layout === "bottom" ? "grid-rows-[1fr_auto]" : "grid-cols-12", shellCls)}>
        {layout === "left" && <aside className="col-span-4 border-r border-gray-200 bg-gray-50">{palette}</aside>}
        <main className={classNames(layout === "bottom" ? "row-span-1" : layout === "left" || layout === "right" ? "col-span-8" : "col-span-12", "bg-white")}>{main}</main>
        {layout === "right" && <aside className="col-span-4 border-l border-gray-200 bg-gray-50">{palette}</aside>}
        {layout === "bottom" && <aside className="border-t border-gray-200 bg-gray-50">{palette}</aside>}
      </div>
    </div>
  );
}
