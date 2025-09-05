"use client";

import Loader from "@/components/Loader";
import {
  GetQuestionByIdResponse,
  GetTestMetaDataResponse,
  QuestionsMetaDataInterface,
  SectionsMetaDataInterface,
} from "@/utils/api/types";
import { Dispatch, SetStateAction } from "react";
import Header from "./_components/Header/Header";
import AssessmentFooter from "./_components/AssessmentArea/_components/Footer";
import AssessmentAreaHeader from "./_components/AssessmentArea/_components/Header";
import QuestionArea from "./_components/AssessmentArea/QuestionArea/_components/QuestionArea";
import AnswerArea from "./_components/AssessmentArea/QuestionArea/_components/AnswerArea";
import ScrollToggleButton from "@/components/ScrollToggleButton";
import Sidebar from "./_components/Sidebar/Sidebar";
import SubmitExamModal from "../../_components/SubmitExamModal";
import SubmitSectionModal from "../../_components/SubmitSectionModal";

// Complete ExamPage props interface
interface ExamPageProps {
  loaded: boolean;
  testMetaData: GetTestMetaDataResponse | null;
  question: GetQuestionByIdResponse | undefined;
  currentSection: SectionsMetaDataInterface | null;
  setCurrentSection: Dispatch<SetStateAction<SectionsMetaDataInterface | null>>;
  currentIndex: number;
  errorMessage: string | null;
  clearResponse: () => void;
  handleNextQuestion: () => void;
  handlePreviousQuestion: () => void;
  toggleMarkForReview: () => void;
  setQuestion: Dispatch<SetStateAction<GetQuestionByIdResponse | undefined>>;
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

export default function SSCTemplate({
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
}: ExamPageProps) {
  if (!loaded) {
    return <Loader />;
  }

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
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

      <AssessmentFooter
        data={testMetaData!}
        currentSectionId={currentSection!}
        clearResponse={clearResponse}
        handleNextQuestion={handleNextQuestion}
        toggleMarkForReview={toggleMarkForReview}
        handlePreviousQuestion={handlePreviousQuestion}
        handleSubmit={handleSubmit}
        formattedTimeSection={Number(currentSection?.maxDuration)}
        onSectionTimeUp={handleSectionTimeout}
      />

      {/* Test Area */}
      <div className="w-full h-full overflow-auto flex flex-row-reverse pb-9">
        {/* Main */}
        <main className="w-full flex-1 flex flex-col gap-2 relative pl-4 overflow-y-auto">
          <div className="w-full h-full">
            {question && (
              <div className="w-full h-full bg-white rounded-md flex flex-col justify-between flex-1">
                <div className="w-full h-full overflow-hidden px-4 py-2">
                  <AssessmentAreaHeader
                    question={question}
                    currentIndex={currentIndex}
                  />

                  <div className="w-full h-full flex flex-col gap-5 pt-2">
                    <div className="relative w-full h-fit">
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

        {/* Sidebar */}
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          questionsMeta={currentSection?.questions!}
          //   handleSubmit={handleSubmit}
          handleJumpTo={handleJumpTo}
          currentIndex={currentIndex}
          currentSection={currentSection!}

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
