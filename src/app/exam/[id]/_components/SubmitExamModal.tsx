import ConfirmationModal from "@/components/ConfirmationModal";
import { QuestionsMetaResponse } from "@/utils/api/types";
import { QUESTION_STATUS } from "@/utils/constants";

export default function SubmitExamModal({
  questionsMeta,
  showModal,
  confirmSubmit,
  cancelSubmit,
}: {
  questionsMeta: QuestionsMetaResponse[];
  showModal: any;
  confirmSubmit: any;
  cancelSubmit: any;
}) {
  return (
    <ConfirmationModal
      isOpen={showModal}
      title="Submit Test?"
      message="Are you sure you want to submit the test? You won't be able to change your answers after this."
      onConfirm={confirmSubmit}
      onCancel={cancelSubmit}
      className="max-w-1/2"
    >
      <div className="overflow-x-auto my-8">
        <table className="min-w-full text-left text-sm rounded-md">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2">Section Name</th>
              <th className="px-4 py-2">Total Questions</th>
              <th className="px-4 py-2">Answered</th>
              <th className="px-4 py-2">Not Answered</th>
              <th className="px-4 py-2">Not Visited</th>
              <th className="px-4 py-2">Marked for Review</th>
              <th className="px-4 py-2">Answered &amp; Marked</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-t border-gray-300 px-4 py-2">Math</td>
              <td className="border-t border-gray-300 px-4 py-2">
                {" "}
                {questionsMeta.length}
              </td>
              <td className="border-t border-gray-300 px-4 py-2">
                {
                  questionsMeta.filter(
                    (question) => question.status === QUESTION_STATUS.ATTEMPTED
                  ).length
                }
              </td>
              <td className="border-t border-gray-300 px-4 py-2">
                {
                  questionsMeta.filter(
                    (question) =>
                      question.status === QUESTION_STATUS.UNATTEMPTED
                  ).length
                }
              </td>
              <td className="border-t border-gray-300 px-4 py-2">
                {
                  questionsMeta.filter(
                    (question) =>
                      question.status === QUESTION_STATUS.NOT_VISITED
                  ).length
                }
              </td>
              <td className="border-t border-gray-300 px-4 py-2">
                {
                  questionsMeta.filter(
                    (question) => question.status === QUESTION_STATUS.TO_REVIEW
                  ).length
                }
              </td>
              <td className="border-t border-gray-300 px-4 py-2">
                {
                  questionsMeta.filter(
                    (question) =>
                      question.status === QUESTION_STATUS.ANSWERED_TO_REVIEW
                  ).length
                }
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ConfirmationModal>
  );
}
