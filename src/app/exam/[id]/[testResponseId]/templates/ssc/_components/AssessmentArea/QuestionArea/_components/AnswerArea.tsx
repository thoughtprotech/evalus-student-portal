import { GetQuestionByIdResponse, QuestionsMetaDataInterface } from "@/utils/api/types";
import RenderOptions from "../../../RenderQuestions";

export default function AnswerArea({
  question,
  setQuestion,
}: {
  question: QuestionsMetaDataInterface;
  setQuestion: any;
}) {
  return (
    <div
      className="w-full h-fit flex flex-col gap-3 overflow-y-auto"
      id="answerBox"
    >
      {/* <div>
        <h1 className="font-bold text-2xl">Answer</h1>
      </div> */}
      <div>
        <RenderOptions question={question} setQuestion={setQuestion} />
      </div>
    </div>
  );
}
