import { TextOrHtml } from "@/components/TextOrHtml";
import { GetQuestionByIdResponse } from "@/utils/api/types";
import DirectionsArea from "./DirectionsArea";
import ScrollXToggleButton from "@/components/ScrollXToggleButton";
import ScrollToggleButton from "@/components/ScrollToggleButton";

export default function QuestionArea({
  question,
}: {
  question: GetQuestionByIdResponse;
}) {
  return (
    <div className="w-full flex flex-col gap-4 h-full pr-4 relative">
      <div
        className="w-full flex flex-col gap-1 h-fit overflow-x-scroll mb-10"
        id="questionBox"
      >
        <div className="w-[1200px] mb-20 relative flex flex-col gap-4">
          <DirectionsArea question={question} />
          <div>
            <h1 className="font-bold text-2xl">Question</h1>
          </div>
          <div>
            <div className="text-md sm:text-lg font-medium">
              <TextOrHtml content={question.question} />
            </div>
          </div>
          <ScrollXToggleButton containerSelector="#questionBox" />
        </div>
      </div>
      <ScrollToggleButton containerSelector="#questionBox" />
    </div>
  );
}
