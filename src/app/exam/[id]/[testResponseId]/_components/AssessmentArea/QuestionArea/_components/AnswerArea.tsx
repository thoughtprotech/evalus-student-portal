import { GetQuestionByIdResponse } from "@/utils/api/types";
import RenderOptions from "../../../RenderQuestions";

export default function AnswerArea({
  question,
  setQuestion,
}: {
  question: GetQuestionByIdResponse;
  setQuestion: any;
}) {
  return (
    <div
      className="w-full h-full flex flex-col gap-3 overflow-y-auto"
      id="answerBox"
    >
      <div>
        <h1 className="font-bold text-2xl">Answer</h1>
      </div>
      <div className="mb-10">
        <RenderOptions question={question} setQuestion={setQuestion} />
      </div>
    </div>
  );
}
