import Modal from "@/components/Modal";
import { TextOrHtml } from "@/components/TextOrHtml";
import renderOptions from "../RenderOptions";
import { QuestionsMetaResponse } from "@/utils/api/types";

export default function QuestionPreviewModal({
  questionsMeta,
  showQuestionsModal,
  setShowQuestionsModal,
}: {
  questionsMeta: QuestionsMetaResponse[];
  showQuestionsModal: any;
  setShowQuestionsModal: any;
}) {
  return (
    <Modal
      title={`Questions`}
      isOpen={showQuestionsModal}
      closeModal={() => setShowQuestionsModal(false)}
      className={"w-full h-full overflow-y-auto flex flex-col items-start"}
    >
      {questionsMeta.map((question, index) => {
        return (
          <div
            className={`w-full flex flex-col items-start text-start ${
              index !== questionsMeta.length - 1 && "border-b border-b-gray-300"
            } pb-4`}
            key={question.questionId}
          >
            <div>
              <h1 className="text-gray-600 font-bold text-sm">
                Question {index + 1}
              </h1>
            </div>
            <div>
              <TextOrHtml content={question.questionText} />
            </div>
            <div className="mt-4">
              {renderOptions(
                question.questionOptionsJson,
                question.questionType?.questionType
              )}
            </div>
          </div>
        );
      })}
    </Modal>
  );
}
