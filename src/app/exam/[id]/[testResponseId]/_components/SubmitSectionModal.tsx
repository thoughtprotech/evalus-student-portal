import {
  SectionsMetaDataInterface,
  QuestionsMetaDataInterface,
} from "@/utils/api/types";
import { QUESTION_STATUS } from "@/utils/constants";
import React, { useMemo } from "react";
import {
  CheckCircle2,
  CircleX,
  CircleHelp,
  Bookmark,
  BookmarkCheck,
  Gauge,
  ClipboardList,
  Info,
} from "lucide-react";
import { TextOrHtml } from "@/components/TextOrHtml";
import ConfirmationModal from "./ConfirmationModal";

type Props = {
  sections: SectionsMetaDataInterface[];
  showModal: boolean;
  confirmSubmit: () => void;
  cancelSubmit: () => void;
  // Optional: if you know which section is current, pass it in
  currentSectionId?: number;
};

type Counts = {
  total: number;
  answered: number;
  notAnswered: number;
  notVisited: number;
  markedForReview: number;
  answeredAndMarked: number;
};

function countStatuses(questions: QuestionsMetaDataInterface[] = []): Counts {
  const total = questions.length;
  let answered = 0;
  let notAnswered = 0;
  let notVisited = 0;
  let markedForReview = 0;
  let answeredAndMarked = 0;

  for (const q of questions) {
    switch (q.status) {
      case QUESTION_STATUS.ATTEMPTED:
        answered++;
        break;
      case QUESTION_STATUS.UNATTEMPTED:
        notAnswered++;
        break;
      case QUESTION_STATUS.NOT_VISITED:
        notVisited++;
        break;
      case QUESTION_STATUS.TO_REVIEW:
        markedForReview++;
        break;
      case QUESTION_STATUS.ANSWERED_TO_REVIEW:
        answeredAndMarked++;
        break;
      default:
        break;
    }
  }

  return {
    total,
    answered,
    notAnswered,
    notVisited,
    markedForReview,
    answeredAndMarked,
  };
}

function pct(n: number, d: number) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

function LinearProgress({
  value,
  trackClass = "bg-gray-100",
  barClass = "bg-emerald-500",
  title,
}: {
  value: number;
  trackClass?: string;
  barClass?: string;
  title?: string;
}) {
  return (
    <div className="w-full" title={title}>
      <div className={`h-2 w-full overflow-hidden rounded-full ${trackClass}`}>
        <div
          className={`h-2 rounded-full ${barClass}`}
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function SubmitSectionModal({
  sections,
  showModal,
  confirmSubmit,
  cancelSubmit,
  currentSectionId,
}: Props) {
  // Choose the relevant section (current) — fallback to the last in array if id not provided
  const currentSection = useMemo(() => {
    if (!sections?.length) return undefined;
    if (currentSectionId != null) {
      return (
        sections.find((s) => s.sectionId === currentSectionId) ??
        sections[sections.length - 1]
      );
    }
    return sections[sections.length - 1];
  }, [sections, currentSectionId]);

  const counts = useMemo(
    () => countStatuses(currentSection?.questions ?? []),
    [currentSection]
  );

  const unresolved = useMemo(() => {
    const q = currentSection?.questions ?? [];
    return q.filter(
      (it) =>
        it.status === QUESTION_STATUS.UNATTEMPTED ||
        it.status === QUESTION_STATUS.TO_REVIEW ||
        it.status === QUESTION_STATUS.ANSWERED_TO_REVIEW
    );
  }, [currentSection]);

  const answeredPct = pct(counts.answered, counts.total);

  return (
    <ConfirmationModal
      isOpen={showModal}
      title="Submit Section?"
      message="Once you submit this section you cannot come back and make any changes."
      onConfirm={confirmSubmit}
      onCancel={cancelSubmit}
      className="w-full max-w-4xl"
    >
      <div className="my-6 space-y-4">
        {/* Section header and progress */}
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="text-sm text-gray-600">Section</div>
              <div className="text-lg font-semibold text-gray-900">
                {currentSection?.sectionName ?? "Current Section"}
              </div>
              <div className="text-xs text-gray-500">
                Questions: {counts.total}
              </div>
            </div>

            <div className="w-full sm:w-1/2">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span className="inline-flex items-center gap-1">
                  <Gauge className="h-3.5 w-3.5" />
                  Progress
                </span>
                <span className="font-medium">{answeredPct}%</span>
              </div>
              <LinearProgress value={answeredPct} />
            </div>
          </div>
        </div>

        {/* Status strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
            <div className="flex items-center gap-1.5 text-emerald-700 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Answered
            </div>
            <div className="text-emerald-800 text-sm">{counts.answered}</div>
          </div>

          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
            <div className="flex items-center gap-1.5 text-amber-700 text-sm font-medium">
              <CircleX className="h-4 w-4" />
              Not Answered
            </div>
            <div className="text-amber-800 text-sm">{counts.notAnswered}</div>
          </div>

          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
            <div className="flex items-center gap-1.5 text-gray-700 text-sm font-medium">
              <CircleHelp className="h-4 w-4" />
              Not Visited
            </div>
            <div className="text-gray-800 text-sm">{counts.notVisited}</div>
          </div>

          <div className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2">
            <div className="flex items-center gap-1.5 text-indigo-700 text-sm font-medium">
              <Bookmark className="h-4 w-4" />
              Marked
            </div>
            <div className="text-indigo-800 text-sm">
              {counts.markedForReview}
            </div>
          </div>

          <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
            <div className="flex items-center gap-1.5 text-blue-700 text-sm font-medium">
              <BookmarkCheck className="h-4 w-4" />
              Answered & Marked
            </div>
            <div className="text-blue-800 text-sm">
              {counts.answeredAndMarked}
            </div>
          </div>
        </div>

        {/* Unresolved items list (only show if present) */}
        {unresolved.length > 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm mb-2">
              <Info className="h-4 w-4" />
              Unresolved in this section
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {unresolved.map((q, i) => {
                const tone =
                  q.status === QUESTION_STATUS.UNATTEMPTED
                    ? "text-amber-700 bg-white ring-amber-200"
                    : q.status === QUESTION_STATUS.TO_REVIEW
                    ? "text-indigo-700 bg-white ring-indigo-200"
                    : "text-blue-700 bg-white ring-blue-200";

                const Icon =
                  q.status === QUESTION_STATUS.UNATTEMPTED
                    ? CircleX
                    : q.status === QUESTION_STATUS.TO_REVIEW
                    ? Bookmark
                    : BookmarkCheck;

                return (
                  <div
                    key={q.questionId}
                    className="flex items-start justify-between gap-3 rounded-md border border-gray-200 bg-white p-3"
                  >
                    <div className="min-w-0">
                      {/* <div className="flex items-center gap-2 text-xs text-gray-500"> */}
                        {/* <ClipboardList className="h-3.5 w-3.5" />Q */}
                      {/* </div> */}
                      <div className="truncate text-sm font-medium text-gray-900 overflow-hidden h-10">
                        <TextOrHtml content={q.questionText} />
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 shrink-0 rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${tone}`}
                      title={q.status}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {q.status}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-amber-700">
              Review these before submitting if changes are needed. You cannot
              return to this section later.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800 text-sm">
            All questions in this section are finalized.
          </div>
        )}
      </div>
    </ConfirmationModal>
  );
}
