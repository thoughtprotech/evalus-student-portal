"use client";

import Loader from "@/components/Loader";
import { GetQuestionByIdResponse, GetTestMetaDataResponse, QuestionsMetaDataInterface, SectionsMetaDataInterface } from "@/utils/api/types";
import { Dispatch, SetStateAction } from "react";
import Header from "./_components/Header/Header";
import AssessmentAreaHeader from "./_components/AssessmentArea/_components/Header";
import QuestionArea from "./_components/AssessmentArea/QuestionArea/_components/QuestionArea";
import AnswerArea from "./_components/AssessmentArea/QuestionArea/_components/AnswerArea";
import ScrollToggleButton from "@/components/ScrollToggleButton";
import AssessmentFooter from "./_components/AssessmentArea/_components/Footer";
import Sidebar from "./_components/Sidebar/Sidebar";
import SubmitExamModal from "../../_components/SubmitExamModal";
import SubmitSectionModal from "../../_components/SubmitSectionModal";

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
}

export default function DefaultTemplate({
  loaded,
  testMetaData,
  handleTimeout,
  handleSectionTimeout,
  currentSection,
  setCurrentSection,
  question,
  clearResponse,
  handleNextQuestion,
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
}: ExamPageProps) {
  if (!loaded) {
    return <Loader />;
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-100 overflow-hidden">
      {/* Header */}
      {testMetaData && (
        <Header
          data={testMetaData!}
          onTestTimeUp={handleTimeout}
          onSectionTimeUp={handleSectionTimeout}
          durationMs={Math.max(
            0,
            Math.floor(Number(testMetaData?.testMeta.testDuration)) * 60_000
          )}
          currentSectionId={currentSection!}
          setCurrentSection={setCurrentSection}
        />
      )}

      {/* Test Area */}
      <div className="w-full h-full overflow-auto flex flex-row pb-9">
        {/* Main */}
        <main className="w-full flex-1 p-2 flex flex-col gap-2 relative overflow-y-auto">
          <div className="w-full h-full">
            {question && (
              <div className="w-full h-full bg-white rounded-md shadow-md border border-gray-300 flex flex-col justify-between flex-1">
                <div className="w-full h-full overflow-hidden border-b border-b-gray-300 px-4 py-2">
                  <AssessmentAreaHeader
                    question={question}
                    currentIndex={currentIndex}
                  />
                  <div className="w-full h-full flex gap-5 pt-2">
                    <div className="relative w-3/4 h-full border-r border-r-gray-300">
                      <QuestionArea question={question} />
                    </div>
                    {errorMessage && (
                      <div className="mb-4 text-sm text-red-600 font-medium">
                        {errorMessage}
                      </div>
                    )}
                    <div className="relative w-1/4">
                      <AnswerArea
                        question={question}
                        setQuestion={setQuestion}
                      />
                      <ScrollToggleButton containerSelector="#answerBox" />
                    </div>
                  </div>
                </div>
                <AssessmentFooter
                  clearResponse={clearResponse}
                  handleNextQuestion={handleNextQuestion}
                  toggleMarkForReview={toggleMarkForReview}
                />
              </div>
            )}
          </div>
        </main>

        {/* Sidebar */}
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          questionsMeta={currentSection?.questions!}
          handleSubmit={handleSubmit}
          handleJumpTo={handleJumpTo}
          currentIndex={currentIndex}
        />
      </div>

      {/* Modals */}
      <SubmitExamModal
        sections={testMetaData?.sections!}
        showModal={showModal}
        confirmSubmit={submitTest}
        cancelSubmit={cancelSubmit}
      />

      <SubmitSectionModal
        sections={testMetaData?.sections!}
        showModal={showSubmitSectionModal}
        confirmSubmit={() => {
          goToNextSection();
          setSubmitSectionModal(false);
        }}
        cancelSubmit={cancelSubmitSectionModalSubmit}
        currentSectionId={currentSection?.sectionId}
      />
    </div>
  );
}
