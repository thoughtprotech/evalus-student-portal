import { TextOrHtml } from "@/components/TextOrHtml";
import { GetQuestionByIdResponse, QuestionsMetaDataInterface } from "@/utils/api/types";
import DirectionsArea from "./DirectionsArea";
import ScrollXToggleButton from "@/components/ScrollXToggleButton";
import ScrollToggleButton from "@/components/ScrollToggleButton";

export default function QuestionArea({
  question,
}: {
  question: QuestionsMetaDataInterface;
}) {
  return (
    <div className="w-full flex flex-col gap-4 h-fit relative px-4">
      <div
        className="w-full flex flex-col gap-1 h-fit overflow-x-scroll"
        id="questionBox"
      >
        <div className="w-300 h-fit relative flex flex-col gap-4">
          <DirectionsArea question={question} />
          {/* <div>
            <h1 className="font-bold text-2xl">Question</h1>
          </div> */}
          <div className="h-fit">
            <div className="text-md sm:text-lg font-medium">
              <TextOrHtml content={question.questionText} />
            </div>
          </div>
          <ScrollXToggleButton containerSelector="#questionBox" />
        </div>
      </div>
      <ScrollToggleButton containerSelector="#questionBox" />
    </div>
  );
}
