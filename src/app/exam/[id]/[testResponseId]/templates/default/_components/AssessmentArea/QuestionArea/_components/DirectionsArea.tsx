import { TextOrHtml } from "@/components/TextOrHtml";
import { GetQuestionByIdResponse } from "@/utils/api/types";

export default function DirectionsArea({
  question,
}: {
  question: GetQuestionByIdResponse;
}) {
  return (
    <>
      {question.explanation && (
        <>
          <div>
            <h1 className="font-bold text-2xl">Directions</h1>
          </div>
          <div>
            <div className="text-md sm:text-lg font-medium">
              <TextOrHtml content={question.explanation} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
