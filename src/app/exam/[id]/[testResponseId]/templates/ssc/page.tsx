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
  checkIfMinimumTimeReached,
  checkIfMinimumSectionTimeReached,
  sectionMaxTime
}: ExamPageProps) {
  const [language, setLanguage] =
    useState<{ value: string; label: string }[]>();

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

  useEffect(() => {
    fetchLanguages();
  }, []);

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
          sectionMaxTime={sectionMaxTime}
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
        question={question!}
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
                    settings={testMetaData?.testSettings!}
                  />
                  <div className="w-full pt-2 flex justify-end">
                    <div className="flex items-center gap-3">
                      <div>
                        <h1>Select Language: </h1>
                      </div>
                      <select
                        title="s"
                        className="border border-gray-300 px-4 py-1 rounded-md shadow-md cursor-pointer text-sm md:text:base"
                        onChange={(e) => {
                          handleLanguageChange(e.target.value);
                        }}
                      >
                        {language?.map((lan) => {
                          return (
                            <option value={lan.value} key={lan.value}>
                              {lan.label}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  <div className="w-full h-fit border border-gray-300 overflow-y-auto flex flex-col mt-4">
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
    </div>
  );
}
