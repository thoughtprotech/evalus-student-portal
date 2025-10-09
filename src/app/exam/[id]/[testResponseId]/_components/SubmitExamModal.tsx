import {
  SectionsMetaDataInterface,
  QuestionsMetaDataInterface,
} from "@/utils/api/types";
import { QUESTION_STATUS } from "@/utils/constants";
import React, { useMemo, useState } from "react";
import {
  HelpCircle,
  ListChecks,
  ClipboardList,
  CircleHelp,
  CheckCircle2,
  CircleX,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Clock,
  Bookmark,
  BookmarkCheck,
  LayoutList,
  Gauge,
} from "lucide-react";
import ConfirmationModal from "./ConfirmationModal";
import toast from "react-hot-toast";

type Props = {
  sections: SectionsMetaDataInterface[];
  showModal: boolean;
  confirmSubmit: () => void;
  cancelSubmit: () => void;
  checkIfMinimumTimeReached: () => boolean;
};

type SectionCounts = {
  total: number;
  answered: number;
  notAnswered: number;
  notVisited: number;
  markedForReview: number;
  answeredAndMarked: number;
};

function countByStatus(
  questions: QuestionsMetaDataInterface[] = []
): SectionCounts {
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

function percentage(n: number, d: number) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

function StatusBadge({ label, count }: { label: string; count: number }) {
  const color =
    label === "Answered"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : label === "Not Answered"
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : label === "Not Visited"
      ? "bg-gray-50 text-gray-700 ring-gray-200"
      : label === "Marked"
      ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
      : label === "Answered & Marked"
      ? "bg-blue-50 text-blue-700 ring-blue-200"
      : "bg-gray-50 text-gray-700 ring-gray-200";

  // Pick small inline icon based on label (purely visual)
  const Icon =
    label === "Answered"
      ? CheckCircle2
      : label === "Not Answered"
      ? CircleX
      : label === "Not Visited"
      ? HelpCircle
      : label === "Marked"
      ? Bookmark
      : label === "Answered & Marked"
      ? BookmarkCheck
      : HelpCircle;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${color}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
      <span className="font-semibold">{count}</span>
    </span>
  );
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

export default function SubmitExamModal({
  sections,
  showModal,
  confirmSubmit,
  cancelSubmit,
  checkIfMinimumTimeReached,
}: Props) {
  const [openSectionIds, setOpenSectionIds] = useState<Record<number, boolean>>(
    {}
  );

  const summaries = useMemo(() => {
    return (sections ?? []).map((s) => ({
      sectionId: s.sectionId,
      sectionName: s.sectionName,
      counts: countByStatus(s.questions ?? []),
      questions: s.questions ?? [],
    }));
  }, [sections]);

  const totals = useMemo(() => {
    return summaries.reduce<SectionCounts>(
      (acc, s) => {
        acc.total += s.counts.total;
        acc.answered += s.counts.answered;
        acc.notAnswered += s.counts.notAnswered;
        acc.notVisited += s.counts.notVisited;
        acc.markedForReview += s.counts.markedForReview;
        acc.answeredAndMarked += s.counts.answeredAndMarked;
        return acc;
      },
      {
        total: 0,
        answered: 0,
        notAnswered: 0,
        notVisited: 0,
        markedForReview: 0,
        answeredAndMarked: 0,
      }
    );
  }, [summaries]);

  const hasSections = summaries.length > 0;

  const toggleSection = (id: number) =>
    setOpenSectionIds((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <ConfirmationModal
      isOpen={showModal}
      title="Submit Test?"
      message="Are you sure you want to submit the test?"
      onConfirm={() => {
        if (checkIfMinimumTimeReached()) {
          confirmSubmit();
        } else {
          toast.error("Minimum test time not reached yet.");
        }
      }}
      onCancel={cancelSubmit}
      className="w-full max-w-5xl max-h-11/12 overflow-auto"
    >
      <div className="my-6 space-y-4">
        {/* Overall summary header */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <LayoutList className="h-4 w-4 text-gray-500" />
              Total Questions
            </div>
            <div className="mt-1 text-2xl font-semibold">{totals.total}</div>
            <div className="mt-2">
              <LinearProgress
                value={percentage(totals.answered, totals.total)}
                title="Answered %"
              />
              <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                <Gauge className="h-3.5 w-3.5" />
                {percentage(totals.answered, totals.total)}% Answered
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ClipboardList className="h-4 w-4 text-gray-500" />
              Pending
            </div>
            <div className="mt-1 text-2xl font-semibold">
              {totals.total - totals.answered}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge label="Not Answered" count={totals.notAnswered} />
              <StatusBadge label="Not Visited" count={totals.notVisited} />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ListChecks className="h-4 w-4 text-gray-500" />
              Review
            </div>
            <div className="mt-1 text-2xl font-semibold">
              {totals.markedForReview + totals.answeredAndMarked}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge label="Marked" count={totals.markedForReview} />
              <StatusBadge
                label="Answered & Marked"
                count={totals.answeredAndMarked}
              />
            </div>
          </div>
        </div>

        {/* Section-wise table */}
        <div className="overflow-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <LayoutList className="h-4 w-4" />
                    Section
                  </div>
                </th>
                <th className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4" />
                    Progress
                  </div>
                </th>
                <th className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                </th>
                <th className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <CircleX className="h-4 w-4 text-amber-600" />
                  </div>
                </th>
                <th className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <CircleHelp className="h-4 w-4 text-gray-600" />
                  </div>
                </th>
                <th className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-indigo-600" />
                  </div>
                </th>
                <th className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <BookmarkCheck className="h-4 w-4 text-blue-600" />
                  </div>
                </th>
                <th className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!hasSections && (
                <tr>
                  <td className="px-4 py-4 text-gray-500 italic" colSpan={8}>
                    No sections available.
                  </td>
                </tr>
              )}

              {summaries.map((s, idx) => {
                const pct = percentage(s.counts.answered, s.counts.total);
                const isOpen = !!openSectionIds[s.sectionId];

                return (
                  <React.Fragment key={s.sectionId ?? idx}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {s.sectionName || `Section ${idx + 1}`}{" "}
                        <span className="ml-2 text-xs text-gray-500">
                          ({s.counts.total} questions)
                        </span>
                      </td>
                      <td className="px-4 py-3 w-56">
                        <div className="flex items-center gap-3">
                          <LinearProgress value={pct} />
                          <span className="text-xs text-gray-600 w-10 text-right">
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-emerald-700 font-medium">
                        {s.counts.answered}
                      </td>
                      <td className="px-4 py-3 text-amber-700 font-medium">
                        {s.counts.notAnswered}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {s.counts.notVisited}
                      </td>
                      <td className="px-4 py-3 text-indigo-700 font-medium">
                        {s.counts.markedForReview}
                      </td>
                      <td className="px-4 py-3 text-blue-700 font-medium">
                        {s.counts.answeredAndMarked}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleSection(s.sectionId)}
                          className="cursor-pointer"
                        >
                          {isOpen ? (
                            <>
                              <EyeOff className="h-3.5 w-3.5" />
                            </>
                          ) : (
                            <>
                              <Eye className="h-3.5 w-3.5" />
                            </>
                          )}
                        </button>
                      </td>
                    </tr>

                    {isOpen && (
                      <tr className="bg-gray-50/50">
                        <td colSpan={8} className="px-4 py-3">
                          {s.questions.length === 0 ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Clock className="h-4 w-4" />
                              No questions in this section.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {s.questions.map((q) => {
                                const badge =
                                  q.status === QUESTION_STATUS.ATTEMPTED
                                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                    : q.status === QUESTION_STATUS.UNATTEMPTED
                                    ? "bg-amber-50 text-amber-700 ring-amber-200"
                                    : q.status === QUESTION_STATUS.NOT_VISITED
                                    ? "bg-gray-50 text-gray-700 ring-gray-200"
                                    : q.status === QUESTION_STATUS.TO_REVIEW
                                    ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
                                    : q.status ===
                                      QUESTION_STATUS.ANSWERED_TO_REVIEW
                                    ? "bg-blue-50 text-blue-700 ring-blue-200"
                                    : "bg-gray-50 text-gray-700 ring-gray-200";

                                const StatusIcon =
                                  q.status === QUESTION_STATUS.ATTEMPTED
                                    ? CheckCircle2
                                    : q.status === QUESTION_STATUS.UNATTEMPTED
                                    ? CircleX
                                    : q.status === QUESTION_STATUS.NOT_VISITED
                                    ? HelpCircle
                                    : q.status === QUESTION_STATUS.TO_REVIEW
                                    ? Bookmark
                                    : q.status ===
                                      QUESTION_STATUS.ANSWERED_TO_REVIEW
                                    ? BookmarkCheck
                                    : HelpCircle;

                                return (
                                  <div
                                    key={q.questionId}
                                    className="flex items-start justify-between gap-3 rounded-md border border-gray-200 bg-white p-3 shadow-sm"
                                  >
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <ClipboardList className="h-3.5 w-3.5" />
                                        Q{q.questionId}
                                      </div>
                                      <div className="truncate text-sm font-medium text-gray-900">
                                        {q.questionText}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <ListChecks className="h-3.5 w-3.5" />
                                        Type: {q.questionType}
                                      </div>
                                    </div>
                                    <span
                                      className={`inline-flex items-center gap-1.5 shrink-0 rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${badge}`}
                                      title={q.status}
                                    >
                                      <StatusIcon className="h-3.5 w-3.5" />
                                      {q.status}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {hasSections && (
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-4 py-3">All Sections</td>
                  <td className="px-4 py-3 w-56">
                    <div className="flex items-center gap-3">
                      <LinearProgress
                        value={percentage(totals.answered, totals.total)}
                      />
                      <span className="text-xs text-gray-700 w-10 text-right">
                        {percentage(totals.answered, totals.total)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-emerald-700">
                    {totals.answered}
                  </td>
                  <td className="px-4 py-3 text-amber-700">
                    {totals.notAnswered}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {totals.notVisited}
                  </td>
                  <td className="px-4 py-3 text-indigo-700">
                    {totals.markedForReview}
                  </td>
                  <td className="px-4 py-3 text-blue-700">
                    {totals.answeredAndMarked}
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="p-2 flex items-center w-full justify-between gap-4">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <h1>Answered</h1>
            </div>
            <div className="flex items-center gap-1">
              <CircleX className="h-4 w-4 text-amber-600" />
              <h1>Unanswered</h1>
            </div>
            <div className="flex items-center gap-1">
              <CircleHelp className="h-4 w-4 text-gray-600" />
              <h1>Not Attempted</h1>
            </div>
            <div className="flex items-center gap-1">
              <Bookmark className="h-4 w-4 text-indigo-600" />
              <h1>Marked For Review</h1>
            </div>
            <div className="flex items-center gap-1">
              <BookmarkCheck className="h-4 w-4 text-blue-600" />
              <h1>Answered But Marked For Review</h1>
            </div>
          </div>
        </div>
      </div>
    </ConfirmationModal>
  );
}
