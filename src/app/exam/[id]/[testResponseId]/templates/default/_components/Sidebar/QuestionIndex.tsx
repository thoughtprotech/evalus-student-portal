import { QuestionsMetaDataInterface } from "@/utils/api/types";
import { QUESTION_STATUS } from "@/utils/constants";
import { CheckCheck } from "lucide-react";
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
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div>
          <h1 className="font-bold text-xl">Questions Pallet</h1>
        </div>
      </div>
      <div className="grid grid-cols-8 md:grid-cols-4 gap-2 mb-4">
        {questionsMeta?.map((q, index) => (
          <button
            key={q.questionId}
            onClick={() => handleJumpTo(index, q.questionId)}
            className={clsx(
              "font-semibold text-xs sm:text-sm transition-colors cursor-pointer relative rounded-md",
              q.status === QUESTION_STATUS.NOT_VISITED &&
                "bg-gray-300 text-gray-700 hover:bg-gray-400 w-8 h-8 sm:w-full sm:h-10 rounded-md",
              q.status === QUESTION_STATUS.ATTEMPTED &&
                "bg-green-500 text-white hover:bg-green-600 w-8 h-8 sm:w-full sm:h-10 rounded-md",
              q.status === QUESTION_STATUS.TO_REVIEW &&
                "bg-purple-500 text-white hover:bg-purple-600 w-full h-10 rounded-full",
              q.status === QUESTION_STATUS.ANSWERED_TO_REVIEW &&
                "bg-purple-500 text-white hover:bg-purple-600 w-full h-10 rounded-full self-center",
              q.status === "unanswered" &&
                "bg-red-500 text-white hover:bg-red-600 w-8 h-8 sm:w-full sm:h-10 rounded-md",
              index === currentIndex
                ? "border-3 border-gray-600"
                : "border-3 border-transparent"
            )}
          >
            {q.status === QUESTION_STATUS.ANSWERED_TO_REVIEW && (
              <div>
                <CheckCheck className="text-green-500 w-5 h-5 absolute -top-3 -right-4" />
              </div>
            )}
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
