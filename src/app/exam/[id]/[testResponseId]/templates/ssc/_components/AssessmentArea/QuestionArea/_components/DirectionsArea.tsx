import { TextOrHtml } from "@/components/TextOrHtml";
import { GetQuestionByIdResponse, QuestionsMetaDataInterface } from "@/utils/api/types";

export default function DirectionsArea({
  question,
}: {
  question: QuestionsMetaDataInterface;
}) {
  return (
    <>
    {question.questionHeaderText && (
        <>
          <div>
            <h1 className="font-bold text-2xl">Directions</h1>
          </div>
          <div>
            <div className="text-md sm:text-lg font-medium">
              <TextOrHtml content={question.questionHeaderText} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
