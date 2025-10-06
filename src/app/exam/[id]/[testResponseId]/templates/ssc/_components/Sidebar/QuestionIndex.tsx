import { QuestionsMetaDataInterface } from "@/utils/api/types";
import { QUESTION_STATUS } from "@/utils/constants";
import { ArrowUpToLine, CheckCheck } from "lucide-react";
import clsx from "clsx";

export default function QuestionIndex({
  questionsMeta,
  handleJumpTo,
  currentIndex,
}: {
  questionsMeta: QuestionsMetaDataInterface[];
  handleJumpTo: (index: number, questionId: number) => void;
  currentIndex: number;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-b-gray-300 max-h-[26rem] overflow-y-auto">
      <div className="grid grid-cols-8 md:grid-cols-4 gap-2 mb-4">
        {questionsMeta?.map((q, index) => (
          <button
            key={q.questionId}
            onClick={() => handleJumpTo(index, q.questionId)}
            className={clsx(
              "font-semibold text-xs sm:text-sm transition-colors cursor-pointer relative",
              q.status === QUESTION_STATUS.NOT_VISITED &&
                "bg-[#0001f0] text-white w-full h-5",
              q.status === QUESTION_STATUS.ATTEMPTED &&
                "bg-green-700 text-white w-full h-5",
              q.status === QUESTION_STATUS.TO_REVIEW &&
                "bg-yellow-300 text-white w-full h-5",
              q.status === QUESTION_STATUS.ANSWERED_TO_REVIEW &&
                "bg-yellow-300 text-white w-full h-5",
              q.status === "unanswered" &&
                "bg-red-500 text-white w-full h-5",
              // index === currentIndex
                // ? "border-3 border-gray-600"
                // : "border-3 border-transparent"
            )}
          >
            {q.status === QUESTION_STATUS.ANSWERED_TO_REVIEW && (
              <div>
                <ArrowUpToLine className="text-black w-3 h-3 absolute -bottom-3 left-1/2 -translate-x-1/2" />
              </div>
            )}
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
