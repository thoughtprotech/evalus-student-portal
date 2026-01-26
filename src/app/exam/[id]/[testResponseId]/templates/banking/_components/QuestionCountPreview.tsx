import { CheckCheck } from "lucide-react";

export default function QuestionCountPreview({
  answeredCount,
  unansweredCount,
  notVisitedCount,
  reviewCount,
  ansToReviewCount,
}: {
  answeredCount: number;
  unansweredCount: number;
  notVisitedCount: number;
  reviewCount: number;
  ansToReviewCount: number;
}) {
  return (
    <>
      <div className="w-full grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 p-2 flex items-center justify-center bg-green-500 rounded-md font-bold text-white text-sm">
            {answeredCount}
          </div>
          <span className="text-xs text-black">Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 p-2 flex items-center justify-center bg-red-500 rounded-md font-bold text-white text-sm">
            {unansweredCount}
          </div>
          <span className="text-xs text-black">Not Answered</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 p-2 flex items-center justify-center bg-gray-300 rounded-md font-bold text-sm text-black">
            {notVisitedCount}
          </div>
          <span className="text-xs text-black">Not Visited</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 p-2 flex items-center justify-center bg-purple-500 rounded-full font-bold text-white text-sm">
            {reviewCount}
          </div>
          <span className="text-xs text-black">Marked For Review</span>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div className="w-9 h-8 p-2 flex items-center justify-center bg-purple-500 rounded-full font-bold text-white relative">
          <div>
            <CheckCheck className="text-green-500 w-5 h-5 absolute -top-3 -right-3" />
          </div>
          {ansToReviewCount}
        </div>
        <div className="w-full ml-2">
          <span className="w-full text-xs text-black">
            Answered And Marked For Review (Will Be Considered For Evaluation)
          </span>
        </div>
      </div>
    </>
  );
}
