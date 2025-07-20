"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import CountdownTimer from "@/components/CountdownTimer";
import { Info, Menu, X } from "lucide-react";
import { InstructionData } from "../instructions/[id]/page";
import mockInstructions from "@/mock/mockInstructions.json";
import {
  GetQuestionByIdResponse,
  QuestionsMetaResponse,
} from "@/utils/api/types";
import Loader from "@/components/Loader";
import { fetchQuestionsMetaAction } from "@/app/actions/exam/questions/getQuestionsMeta";
import { fetchQuestionByIdAction } from "@/app/actions/exam/questions/getQuestionById";
import ScrollToggleButton from "@/components/ScrollToggleButton";
import { TextOrHtml } from "@/components/TextOrHtml";
import ScrollXToggleButton from "@/components/ScrollXToggleButton";
import OnHover from "@/components/OnHover";
import QuestionCountPreview from "./_components/QuestionCountPreview";
import Header from "./_components/Header/Header";
import SubmitExamModal from "./_components/SubmitExamModal";
import InstructionsModal from "./_components/Header/InstructioncsModal";
import QuestionPreviewModal from "./_components/Header/QuestionsPreviewModal";
import renderQuestion from "./_components/RenderQuestions";
import Sidebar from "./_components/Sidebar/Sidebar";
import { ExamTabsContent, ExamTabsList, ExamTabsRoot } from "./_components/ExamTabs";

export default function ExamPage() {
  const { id } = useParams();
  const [loaded, setLoaded] = useState<boolean>(false);
  const [questionsMeta, setQuestionsMeta] = useState<QuestionsMetaResponse[]>(
    []
  );
  const [question, setQuestion] = useState<GetQuestionByIdResponse>();
  const [showModal, setShowModal] = useState(false);
  const [errorMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] =
    useState<boolean>(false);
  const [instructionData, setInstructionData] =
    useState<InstructionData | null>(null);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<{
    questionId: number;
  }>();

  const instructionsMap: Record<string, InstructionData> = mockInstructions;

  const router = useRouter();

  useEffect(() => {
    if (id && instructionsMap[id as string]) {
      setInstructionData(instructionsMap[id as string]);
    }
  }, [id]);

  const fetchQuestionById = async (questionId: number) => {
    console.log({ questionId });
    const res = await fetchQuestionByIdAction(questionId);
    const { data, status, error, errorMessage, message } = res;
    if (status === 200) {
      setQuestion(data!);
      // setTestList(data);
    } else {
      console.log({ status, error, errorMessage });
    }
  };

  const fetchQuestionMeta = async () => {
    setLoaded(false);
    const res = await fetchQuestionsMetaAction(Number(id));
    const { data, status, error, errorMessage, message } = res;
    if (status === 200 && data) {
      setQuestionsMeta(data!);
      setCurrentQuestion({ questionId: data[0].questionId });
      setLoaded(true);
    } else {
      console.log({ status, error, errorMessage });
    }
  };

  // Load the test list once on mount
  useEffect(() => {
    fetchQuestionMeta();
  }, []);

  useEffect(() => {
    if (currentQuestion?.questionId) {
      fetchQuestionById(currentQuestion.questionId);
    }
  }, [currentQuestion]);

  const handleSubmit = () => setShowModal(true);

  const cancelSubmit = () => setShowModal(false);

  useEffect(() => {
    console.log({ question });
  }, [question]);

  const handleNextQuestion = async () => {
    fetchQuestionById(questionsMeta[currentIndex + 1].questionId);
    setCurrentIndex(currentIndex + 1);
  };

  const clearResponse = async () => {
    switch (question!.questionType.questionType) {
      case "Single MCQ":
        setQuestion((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            userAnswer: JSON.stringify([]),
          };
        });
        break;
      case "Multiple MCQ":
        setQuestion((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            userAnswer: JSON.stringify([]),
          };
        });
        break;
      case "Match Pairs Single":
        console.log("SINGLE MATCH");
        setQuestion((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            userAnswer: JSON.stringify([]),
          };
        });
        break;
      case "Match Pairs Multiple":
        console.log("MULTIPLE MATCH");
        setQuestion((prev) => {
          if (!prev) {
            return prev;
          }

          let emptyArr: string[][] = [];

          JSON.parse(question!.questionOptionsJson)[0].map(() => {
            emptyArr.push([]);
          });

          console.log({ emptyArr });
          console.log(JSON.stringify(emptyArr));

          return {
            ...prev,
            userAnswer: JSON.stringify(emptyArr),
          };
        });
        break;
      case "Write Up":
        setQuestion((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            userAnswer: "",
          };
        });
        break;
      case "Numeric":
        setQuestion((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            userAnswer: "",
          };
        });
        break;
      case "TrueFalse":
        setQuestion((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            userAnswer: "",
          };
        });
        break;
      case "Fill Answer":
        setQuestion((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            userAnswer: "",
          };
        });
        break;
    }
  };

  const handleJumpTo = (index: number, questionId: number) => {
    setCurrentQuestion({ questionId });
    setCurrentIndex(index);
  };

  const handleTimeout = () => {
    console.log("TIMEOUT");
    // TODO: Handle timeout
  };

  const toggleMarkForReview = async () => {
    // TODO: Implement API here to update question status
  };

  const confirmSubmit = () => {
    const targetUrl = `/dashboard/analytics/${id}`;

    // If this window was opened via window.open(), window.opener points back to the parent
    if (window.opener && !window.opener.closed) {
      // Navigate the parent
      window.opener.location.assign(targetUrl);
      // Then close this popup
      window.close();
    } else {
      // Fallback: same‐window navigation
      router.push(targetUrl);
    }
  };

  if (!loaded) {
    return <Loader />;
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-100 overflow-hidden">
      {/* Header */}
      <Header
        setShowQuestionsModal={setShowQuestionsModal}
        setShowInstructionsModal={setShowInstructionsModal}
      />

      {/* Test Area */}
      <div className="w-full h-full flex flex-row pb-9">
        {/* Main */}
        <main className="w-full flex-1 p-2 flex flex-col gap-2 relative overflow-y-auto">
          <div className="bg-white p-2 rounded-md shadow-md border border-gray-300 space-y-4">
            <div className="w-full flex justify-between">
              <div className="flex items-center gap-2">
                <div className="md:hidden">
                  <div onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? (
                      <X className="w-6 h-6" />
                    ) : (
                      <Menu className="w-6 h-6" />
                    )}
                  </div>
                </div>
                <div className="bg-indigo-100 rounded-md px-2 py-1 flex items-center gap-2">
                  <div>
                    <h1 className="text-sm md:text-base text-indigo-600">
                      Aptitude Test - 1
                    </h1>
                  </div>
                  <div className="flex items-center justify-center">
                    <OnHover
                      trigger={<Info className="w-5 h-5 text-indigo-600" />}
                      dropdownClassName="max-w-xs"
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
              </div>
            </div>
          </div>
          <ExamTabsRoot defaultIndex={0}>
            <div className="flex justify-between items-center bg-white rounded-md border border-gray-300 shadow-md">
              <ExamTabsList
                className="w-full"
                labels={["Section 1", "Section 2", "Section 3"]}
              />
              <div className="w-fit flex items-center gap-3 text-sm p-2 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-gray-600">Time Left: </h1>
                  <CountdownTimer
                    initialTime="00:05:00"
                    onComplete={handleTimeout}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            <ExamTabsContent className="w-full h-full overflow-hidden">
              <div className="w-full h-full">
                {question && (
                  <div className="w-full h-full bg-white rounded-md shadow-md border border-gray-300 flex flex-col justify-between flex-1">
                    <div className="w-full h-full overflow-hidden border-b border-b-gray-300 px-4 py-2">
                      <div className="w-full flex flex-col gap-2 md:flex md:flex-row items-center justify-between font-semibold border-b border-b-gray-300 pb-2">
                        <div>
                          <h1 className="text-sm text-gray-600">
                            Question {currentIndex + 1} -{" "}
                            {question?.questionType?.questionType}
                          </h1>
                        </div>
                        <div className="flex gap-3 items-center">
                          <div className="flex gap-3 text-xs md:text-sm">
                            <h1 className="text-green-500">Mark(s)</h1>
                            <h1>{question.marks}</h1>
                          </div>
                          <h1 className="text-gray-500">|</h1>
                          <div className="flex gap-3 text-xs md:text-sm pr-1">
                            <h1 className="text-red-500 text-nowrap">
                              Negative Mark(s)
                            </h1>
                            <h1>{question.negativeMarks}</h1>
                          </div>
                          <h1 className="text-gray-500">|</h1>
                          <div>
                            <select className="border border-gray-300 px-4 py-1 rounded-md shadow-md cursor-pointer text-sm md:text:base">
                              <option value="english">English</option>
                              <option value="telugu">Telugu</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="w-full h-full flex gap-5 pt-2">
                        <div className="relative w-3/4 h-full border-r border-r-gray-300">
                          <div className="w-full flex flex-col gap-4 h-full pr-4 relative">
                            <div
                              className="w-full flex flex-col gap-1 h-fit overflow-x-scroll mb-10"
                              id="questionBox"
                            >
                              <div className="w-[1200px] mb-20 relative flex flex-col gap-4">
                                {question.headerText && (
                                  <>
                                    <div>
                                      <h1 className="font-bold text-2xl">
                                        Directions
                                      </h1>
                                    </div>
                                    <div>
                                      <div className="text-md sm:text-lg font-medium">
                                        <TextOrHtml
                                          content={question.headerText}
                                        />
                                      </div>
                                    </div>
                                  </>
                                )}

                                <div>
                                  <h1 className="font-bold text-2xl">
                                    Question
                                  </h1>
                                </div>
                                <div>
                                  <div className="text-md sm:text-lg font-medium">
                                    <TextOrHtml
                                      content={question.questionText}
                                    />
                                  </div>
                                </div>
                                <ScrollXToggleButton containerSelector="#questionBox" />
                              </div>
                            </div>
                            <ScrollToggleButton containerSelector="#questionBox" />
                          </div>
                        </div>
                        {errorMessage && (
                          <div className="mb-4 text-sm text-red-600 font-medium">
                            {errorMessage}
                          </div>
                        )}
                        <div className="relative w-1/4">
                          <div
                            className="w-full h-full flex flex-col gap-3 overflow-y-auto"
                            id="answerBox"
                          >
                            <div>
                              <h1 className="font-bold text-2xl">Answer</h1>
                            </div>
                            <div className="mb-10">
                              {renderQuestion(question, setQuestion)}
                            </div>
                          </div>
                          <ScrollToggleButton containerSelector="#answerBox" />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex md:flex-row items-center justify-between bg-gray-100 px-4 py-2">
                      <div className="w-full flex gap-3">
                        <button
                          onClick={toggleMarkForReview}
                          className={clsx(
                            "w-full md:w-fit px-4 py-1 rounded-md font-medium cursor-pointer bg-white hover:bg-gray-200 border border-gray-300 text-sm"
                          )}
                        >
                          Mark For Review & Next
                          {/* {question. === "review" ||
                        question.status === "answeredMarkedForReview"
                          ? "Unmark Review"
                          : currentIndex < question.length - 1
                          ? "Mark For Review & Next"
                          : "Mark For Review"} */}
                        </button>
                        <button
                          onClick={clearResponse}
                          className={clsx(
                            "w-full md:w-fit px-4 py-1 rounded-md font-medium cursor-pointer bg-white hover:bg-gray-200 border border-gray-300 text-sm"
                          )}
                        >
                          Clear Response
                        </button>
                      </div>

                      <div className="w-full md:w-fit flex gap-3">
                        {/* <div className="w-full md:w-fit">
                        <button
                          onClick={handlePreviousQuestion}
                          disabled={currentIndex === 0}
                          className={clsx(
                            "w-full md:w-fit px-6 py-1 rounded-md font-medium text-white transition cursor-pointer bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                          )}
                        >
                          Previous
                        </button>
                      </div> */}
                        {currentIndex + 1 === questionsMeta.length ? (
                          <div className="w-full md:w-fit">
                            <button
                              onClick={handleSubmit}
                              className="w-full text-nowrap px-6 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md font-medium cursor-pointer mb-16 md:mb-0 text-sm"
                            >
                              Submit Test
                            </button>
                          </div>
                        ) : (
                          <div className="w-full md:w-fit">
                            <button
                              onClick={handleNextQuestion}
                              disabled={
                                currentIndex + 1 === questionsMeta.length
                              }
                              className={clsx(
                                "w-full md:w-fit px-6 py-1 rounded-md font-medium text-white transition cursor-pointer bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 whitespace-nowrap text-sm"
                              )}
                            >
                              Save & Next
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-md shadow-md border border-gray-300 space-y-4">
                <h1>Section 2</h1>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-md shadow-md border border-gray-300 space-y-4">
                <h1>Section 3</h1>
              </div>
            </ExamTabsContent>
          </ExamTabsRoot>
        </main>

        {/* Sidebar */}
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          questionsMeta={questionsMeta}
          handleSubmit={handleSubmit}
          handleJumpTo={handleJumpTo}
          currentIndex={currentIndex}
        />
      </div>

      {/* Modals */}
      <SubmitExamModal
        questionsMeta={questionsMeta}
        showModal={showModal}
        confirmSubmit={confirmSubmit}
        cancelSubmit={cancelSubmit}
      />

      <InstructionsModal
        instructionData={instructionData}
        showInstructionsModal={showInstructionsModal}
        setShowInstructionsModal={setShowInstructionsModal}
      />

      <QuestionPreviewModal
        questionsMeta={questionsMeta}
        showQuestionsModal={showQuestionsModal}
        setShowQuestionsModal={setShowQuestionsModal}
      />
    </div>
  );
}
