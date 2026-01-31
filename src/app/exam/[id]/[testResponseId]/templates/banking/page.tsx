"use client";

import Loader from "@/components/Loader";
import {
  GetQuestionByIdResponse,
  GetTestMetaDataResponse,
  QuestionsMetaDataInterface,
  SectionsMetaDataInterface,
} from "@/utils/api/types";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Header from "./_components/Header/Header";
import AssessmentFooter from "./_components/AssessmentArea/_components/Footer";
import AssessmentAreaHeader from "./_components/AssessmentArea/_components/Header";
import QuestionArea from "./_components/AssessmentArea/QuestionArea/_components/QuestionArea";
import AnswerArea from "./_components/AssessmentArea/QuestionArea/_components/AnswerArea";
import ScrollToggleButton from "@/components/ScrollToggleButton";
import Sidebar from "./_components/Sidebar/Sidebar";
import SubmitExamModal from "../../_components/SubmitExamModal";
import SubmitSectionModal from "../../_components/SubmitSectionModal";
import { fetchLanguagesAction } from "@/app/actions/dashboard/questions/fetchLanguages";
import toast from "react-hot-toast";
import ActionsBar from "./_components/Header/_components/ActionBar";
import { getUserAction } from "@/app/actions/getUser";
import InstructionsModal from "./_components/Header/_components/InstructionsModal";
import QuestionsPreviewModal from "./_components/Header/_components/QuestionPreviewModal";
import OnHover from "@/components/OnHover";
import { Info } from "lucide-react";
import QuestionCountPreview from "./_components/QuestionCountPreview";

// Complete ExamPage props interface
interface ExamPageProps {
  loaded: boolean;
  testMetaData: GetTestMetaDataResponse | null;
  question: QuestionsMetaDataInterface | undefined;
  currentSection: SectionsMetaDataInterface | null;
  setCurrentSection: Dispatch<SetStateAction<SectionsMetaDataInterface | null>>;
  currentIndex: number;
  errorMessage: string | null;
  clearResponse: () => void;
  handleNextQuestion: () => void;
  handlePreviousQuestion: () => void;
  toggleMarkForReview: () => void;
  setQuestion: Dispatch<SetStateAction<QuestionsMetaDataInterface | undefined>>;
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: () => void;
  handleJumpTo: (index: number, questionId: number) => void;
  showModal: boolean;
  submitTest: () => void;
  cancelSubmit: () => void;
  showSubmitSectionModal: boolean;
  goToNextSection: () => void;
  setSubmitSectionModal: (val: boolean) => void;
  cancelSubmitSectionModalSubmit: () => void;
  handleTimeout: () => void;
  handleSectionTimeout: () => void;
  checkIfMinimumTimeReached: () => boolean;
  checkIfMinimumSectionTimeReached: () => boolean;
  sectionMaxTime: number;
}

export default function BankingTemplate({
  loaded,
  testMetaData,
  handleTimeout,
  handleSectionTimeout,
  currentSection,
  setCurrentSection,
  question,
  clearResponse,
  handleNextQuestion,
  handlePreviousQuestion,
  toggleMarkForReview,
  currentIndex,
  errorMessage,
  setQuestion,
  sidebarOpen,
  setSidebarOpen,
  handleSubmit,
  handleJumpTo,
  showModal,
  submitTest,
  cancelSubmit,
  showSubmitSectionModal,
  goToNextSection,
  setSubmitSectionModal,
  cancelSubmitSectionModalSubmit,
  checkIfMinimumTimeReached,
  checkIfMinimumSectionTimeReached,
  sectionMaxTime,
}: ExamPageProps) {
  const [language, setLanguage] =
    useState<{ value: string; label: string }[]>();

  const [showInstructions, setShowInstructions] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [userName, setUserName] = useState<string>("");

  const fetchLanguages = async () => {
    const res = await fetchLanguagesAction();

    if (res.status === 200) {
      const options = res.data?.map((lan) => ({
        value: lan.language,
        label: lan.language,
      }));

      setLanguage(options);
    }
  };

  const handleLanguageChange = async (language: any) => {
    console.log({ language });

    // TODO: Implement language change
  };

  const fetchUserName = async () => {
    const user = await getUserAction();
    setUserName(user || "");
  };

  useEffect(() => {
    fetchLanguages();
    fetchUserName();
  }, []);

  useEffect(() => {
    console.log({ userName });
  }, [userName]);

  if (!loaded) {
    return <Loader />;
  }

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <ActionsBar
        instructionsTitle={
          testMetaData?.testMeta.instruction?.primaryInstruction ||
          "Instructions"
        }
        onOpenInstructions={() => setShowInstructions(true)}
        onOpenQuestions={() => setShowQuestions(true)}
        userName={userName}
      />

      <div className="w-full h-full flex">
        <div className="w-full flex flex-col">
          <div className="w-full bg-white px-4 py-2">
            <div
              className={[
                "px-4 py-1 text-xs font-bold whitespace-nowrap` flex items-center gap-2 transition-colors text-white w-fit",
                "bg-sky-600 rounded-md py-2 px-6",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
              ].join(" ")}
            >
              <h1>{testMetaData?.testMeta.testName}</h1>
              <OnHover
                trigger={
                  <Info className="w-4 h-4 text-gray-100 hover:text-gray-600 transition-colors" />
                }
                dropdownClassName="w-96"
              >
                <QuestionCountPreview
                  answeredCount={0}
                  unansweredCount={0}
                  notVisitedCount={12}
                  reviewCount={0}
                  ansToReviewCount={0}
                />
              </OnHover>
            </div>
          </div>
          {testMetaData && (
            <Header
              data={testMetaData!}
              onTestTimeUp={handleTimeout}
              onSectionTimeUp={handleSectionTimeout}
              durationMs={Math.max(
                0,
                Math.floor(Number(testMetaData?.testMeta.testDuration)) *
                  60_000,
              )}
              currentSectionId={currentSection!}
              setCurrentSection={setCurrentSection}
              currentSection={currentSection!}
            />
          )}

          <div className="w-full h-full flex flex-col">
            {/* Test Area */}
            <div className="w-full h-full overflow-auto flex flex-row-reverse pb-9">
              {/* Main */}
              <main className="w-full flex-1 flex flex-col gap-2 relative overflow-y-auto">
                <div className="w-full h-full">
                  {question && (
                    <div className="w-full h-full bg-white rounded-md flex flex-col justify-between flex-1">
                      <div className="w-full h-full overflow-hidden">
                        <div className="w-full flex px-4 py-2">
                          <div>
                            <h1 className="text-red-500 text-sm whitespace-nowrap">
                              Question Type: {question.questionType}
                            </h1>
                          </div>
                          <div className="w-full flex gap-2 justify-end">
                            <div className="border-r border-r-gray-200 px-2">
                              <h1 className="font-medium text-xs">
                                Marks For Correct Answer:{" "}
                                <span className="text-green-500">
                                  {question.marks}
                                </span>
                              </h1>
                            </div>
                            <div>
                              <h1 className="font-medium text-xs">
                                Negative Mark:{" "}
                                <span className="text-green-500">
                                  {question.negativeMarks}
                                </span>
                              </h1>
                            </div>
                          </div>
                        </div>
                        <AssessmentAreaHeader
                          question={question}
                          currentIndex={currentIndex}
                          settings={testMetaData?.testSettings!}
                        />

                        <div className="w-full h-fit overflow-y-auto flex flex-col">
                          <div className="relative w-full h-fit p-2">
                            <QuestionArea question={question} />
                          </div>
                          {errorMessage && (
                            <div className="mb-4 text-sm text-red-600 font-medium">
                              {errorMessage}
                            </div>
                          )}
                          <div className="relative w-full">
                            <AnswerArea
                              question={question}
                              setQuestion={setQuestion}
                            />
                            <ScrollToggleButton containerSelector="#answerBox" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </main>
            </div>
            <AssessmentFooter
              data={testMetaData!}
              currentSectionId={currentSection!}
              clearResponse={clearResponse}
              handleNextQuestion={handleNextQuestion}
              toggleMarkForReview={toggleMarkForReview}
              handlePreviousQuestion={handlePreviousQuestion}
              handleSubmit={handleSubmit}
              formattedTimeSection={Number(
                currentSection?.sectionMaxTimeDuration,
              )}
              question={question!}
              handleSubmitSection={goToNextSection}
            />
          </div>
        </div>

        {/* Sidebar */}
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          questionsMeta={currentSection?.questions!}
          //   handleSubmit={handleSubmit}
          handleJumpTo={handleJumpTo}
          currentIndex={currentIndex}
          currentSection={currentSection!}
          userName={userName}
        />
      </div>

      {/* Modals */}
      <SubmitExamModal
        sections={testMetaData?.sections!}
        showModal={showModal}
        confirmSubmit={submitTest}
        cancelSubmit={cancelSubmit}
        checkIfMinimumTimeReached={checkIfMinimumTimeReached}
      />

      <SubmitSectionModal
        sections={testMetaData?.sections!}
        showModal={showSubmitSectionModal}
        confirmSubmit={() => {
          if (checkIfMinimumSectionTimeReached()) {
            goToNextSection();
            setSubmitSectionModal(false);
          } else {
            toast.error("Minimum section time not reached");
          }
        }}
        cancelSubmit={cancelSubmitSectionModalSubmit}
        currentSectionId={currentSection?.sectionId}
      />

      <InstructionsModal
        title={"Instructions"}
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        content={
          testMetaData?.testMeta.instruction?.primaryInstruction ||
          "No instructions provided."
        }
      />

      <QuestionsPreviewModal
        isOpen={showQuestions}
        onClose={() => setShowQuestions(false)}
        sections={testMetaData?.sections!}
        currentSectionId={
          currentSection?.sectionId ?? currentSection?.sectionId
        }
      />
    </div>
  );
}
