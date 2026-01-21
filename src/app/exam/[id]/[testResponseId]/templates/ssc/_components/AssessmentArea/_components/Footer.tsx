import clsx from "clsx";
import SectionTabs from "../../Header/_components/SectionTabs";
import {
  GetTestMetaDataResponse,
  QuestionsMetaDataInterface,
  SectionsMetaDataInterface,
} from "@/utils/api/types";
import ActionsBar from "../../Header/_components/ActionBar";
import { useEffect, useState } from "react";
import { getUserAction } from "@/app/actions/getUser";
import InstructionsModal from "../../Header/_components/InstructionsModal";
import QuestionsPreviewModal from "../../Header/_components/QuestionPreviewModal";
import { QUESTION_STATUS } from "@/utils/constants";
import TimerChip from "../../Header/_components/TimerChip";

export default function AssessmentFooter({
  handleNextQuestion,
  toggleMarkForReview,
  clearResponse,
  data,
  currentSectionId,
  onSelectSection,
  handlePreviousQuestion,
  handleSubmit,
  formattedTimeSection,
  question,
  handleSubmitSection,
}: {
  handleNextQuestion: any;
  toggleMarkForReview: any;
  clearResponse: any;
  data: GetTestMetaDataResponse;
  currentSectionId: SectionsMetaDataInterface;
  onSelectSection?: (section: SectionsMetaDataInterface) => void;
  handlePreviousQuestion: any;
  handleSubmit: any;
  formattedTimeSection: any;
  question: QuestionsMetaDataInterface;
  handleSubmitSection: any;
}) {
  const { testMeta, sections } = data;
  const { instruction } = testMeta;
  const [showInstructions, setShowInstructions] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [userName, setUserName] = useState<string>("");

  const lastSectionIndex = data.sections.length - 1;
  const lastSectionLastQuestionIndex =
    data.sections[lastSectionIndex].questions.length - 1;

  const fetchUserName = async () => {
    const user = await getUserAction();
    setUserName(user || "");
  };

  useEffect(() => {
    console.log({ formattedTimeSection });
    fetchUserName();
  }, []);

  return (
    <div className="w-full flex flex-col bg-white border-b border-b-gray-300">
      <div>
        <ActionsBar
          instructionsTitle={instruction?.primaryInstruction || "Instructions"}
          onOpenInstructions={() => setShowInstructions(true)}
          onOpenQuestions={() => setShowQuestions(true)}
          userName={userName}
        />
      </div>
      <div className="flex flex-col md:flex md:flex-row items-center justify-between px-4 py-2">
        <div>
          <SectionTabs
            sections={sections}
            activeSectionId={currentSectionId?.sectionId!}
            onSelectSection={onSelectSection}
          />
        </div>
        <div className="flex items-center gap-40">
          <div>
            <div className="w-full flex gap-3">
              <div className="w-full md:w-fit">
                <button
                  onClick={handlePreviousQuestion}
                  // disabled={currentIndex === 0}
                  className={clsx(
                    "w-full md:w-fit px-6 py-1 font-medium text-white transition cursor-pointer bg-[#4570CB] hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500",
                  )}
                >
                  Previous
                </button>
              </div>
              <button
                onClick={toggleMarkForReview}
                className={clsx(
                  "w-full md:w-fit px-6 py-1 font-medium text-white transition cursor-pointer bg-[#4570CB] hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500",
                )}
              >
                {question?.status !== QUESTION_STATUS.TO_REVIEW
                  ? "Mark For Review"
                  : "Unmark Review"}
              </button>
              {/* <button
            onClick={clearResponse}
            className={clsx(
              "w-full md:w-fit px-6 py-1 rounded-md font-medium text-white transition cursor-pointer bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 whitespace-nowrap text-sm"
            )}
          >
            Clear Response
          </button> */}
              <div className="w-full md:w-fit">
                <button
                  onClick={handleNextQuestion}
                  // disabled={
                  //   currentIndex + 1 === currentSection?.questions.length
                  // }
                  className={clsx(
                    "w-full md:w-fit px-6 py-1 font-medium text-white transition cursor-pointer bg-[#4570CB] hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500",
                  )}
                >
                  Save & Next
                </button>
              </div>
              {/* Render only if not the last question of test */}
              {data?.sections[lastSectionIndex].questions[
                lastSectionLastQuestionIndex
              ].questionId !== question?.questionId ? (
                <div className="w-full md:w-fit">
                  <button
                    onClick={handleSubmitSection}
                    className={clsx(
                      "w-full md:w-fit px-6 py-1 font-medium text-white transition cursor-pointer bg-[#4570CB] hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500",
                    )}
                  >
                    Submit Section
                  </button>
                </div>
              ) : (
                <div className="w-full md:w-fit">
                  <button
                    onClick={handleSubmit}
                    className={clsx(
                      "w-full md:w-fit px-6 py-1 font-medium text-white transition cursor-pointer bg-[#4570CB] hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500",
                    )}
                  >
                    Submit Test
                  </button>
                </div>
              )}
            </div>

            <div className="w-full md:w-fit flex gap-3">
              {/* {currentIndex + 1 === currentSection?.questions.length ? (
                      <div className="w-full md:w-fit">
                        <button
                          onClick={handleSubmit}
                          className="w-full text-nowrap px-6 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md font-medium cursor-pointer mb-16 md:mb-0 text-sm"
                        >
                          Submit Test
                        </button>
                      </div>
                    ) : ( */}

              {/* )} */}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div>
              <h1 className="font-bold text-xl">
                <span className="text-gray-600 text-base">
                  Total Questions Answered:{" "}
                </span>
                <span className="text-red-500 bg-yellow-200 px-2">
                  {
                    currentSectionId.questions.filter(
                      (q) => q.status === QUESTION_STATUS.ATTEMPTED,
                    ).length
                  }
                </span>
              </h1>
            </div>
          </div>
        </div>
      </div>
      {/* Modals */}
      <InstructionsModal
        title={"Instructions"}
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        content={instruction?.primaryInstruction || "No instructions provided."}
      />

      <QuestionsPreviewModal
        isOpen={showQuestions}
        onClose={() => setShowQuestions(false)}
        sections={sections}
        currentSectionId={
          currentSectionId?.sectionId ?? currentSectionId?.sectionId
        }
      />
    </div>
  );
}
