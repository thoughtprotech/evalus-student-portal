import { QuestionsMetaResponse } from "@/utils/api/types";
import { QUESTION_STATUS } from "@/utils/constants";
import { CheckCheck } from "lucide-react";

export default function Legend({
  questionsMeta,
}: {
  questionsMeta: QuestionsMetaResponse[];
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-t-gray-300 border-b border-b-gray-300 py-4">
      <div className="space-y-2 text-sm">
        <div className="w-full grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 p-2 flex items-center justify-center bg-green-500 rounded-md font-bold text-white">
              {
                questionsMeta.filter(
                  (question) => question.status === QUESTION_STATUS.ATTEMPTED
                ).length
              }
            </div>
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 p-2 flex items-center justify-center bg-red-500 rounded-md font-bold text-white">
              {
                questionsMeta.filter(
                  (question) => question.status === QUESTION_STATUS.UNATTEMPTED
                ).length
              }
            </div>
            <span>Not Answered</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 p-2 flex items-center justify-center bg-gray-300 rounded-md font-bold">
              {
                questionsMeta.filter(
                  (question) => question.status === QUESTION_STATUS.NOT_VISITED
                ).length
              }
            </div>
            <span>Not Visited</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 p-2 flex items-center justify-center bg-purple-500 rounded-full font-bold text-white">
              {
                questionsMeta.filter(
                  (question) => question.status === QUESTION_STATUS.TO_REVIEW
                ).length
              }
            </div>
            <span>Marked For Review</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-8 p-2 flex items-center justify-center bg-purple-500 rounded-full font-bold text-white relative">
            <div>
              <CheckCheck className="text-green-500 w-5 h-5 absolute -top-3 -right-3" />
            </div>
            {
              questionsMeta.filter(
                (question) =>
                  question.status === QUESTION_STATUS.ANSWERED_TO_REVIEW
              ).length
            }
          </div>
          <div className="w-full ml-2">
            <span className="w-full">
              Answered And Marked For Review (Will Be Considered For Evaluation)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
