"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { InstructionData } from "../../instructions/[id]/[registrationId]/page";
import mockInstructions from "@/mock/mockInstructions.json";
import {
  GetQuestionByIdResponse,
  GetTestMetaDataResponse,
  SectionsMetaDataInterface,
} from "@/utils/api/types";
import Loader from "@/components/Loader";
import { fetchQuestionByIdAction } from "@/app/actions/exam/questions/getQuestionById";
import ScrollToggleButton from "@/components/ScrollToggleButton";
import { TextOrHtml } from "@/components/TextOrHtml";
import ScrollXToggleButton from "@/components/ScrollXToggleButton";
import { getUserAction } from "@/app/actions/getUser";
import { fetchTestMetaDataAction } from "@/app/actions/exam/questions/getTestMetaData";
import toast from "react-hot-toast";
import RenderQuestion from "./_components/RenderQuestions";
import Header from "./_components/Header/Header";
import Sidebar from "./_components/Sidebar/Sidebar";
import SubmitExamModal from "./_components/SubmitExamModal";
import { endCandidateSessionAction } from "@/app/actions/exam/session/endCandidateSession";
import { QUESTION_STATUS } from "@/utils/constants";
import { submitQuestionAction } from "@/app/actions/exam/session/submitQuestion";

export default function ExamPage() {
  const { id, testResponseId } = useParams();
  const [loaded, setLoaded] = useState<boolean>(false);

  const [question, setQuestion] = useState<GetQuestionByIdResponse>();
  const [showModal, setShowModal] = useState(false);
  const [errorMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const instructionsMap: Record<string, InstructionData> = mockInstructions;

  const router = useRouter();

  const fetchQuestionById = async (questionId: number) => {
    const res = await fetchQuestionByIdAction(questionId);
    const { data, status, error, errorMessage, message } = res;
    if (status === 200) {
      setQuestion(data!);
      // setTestList(data);
    } else {
      // Error fetching question
    }
  };

  const handleSubmit = () => setShowModal(true);

  const cancelSubmit = () => setShowModal(false);

  useEffect(() => {
    console.log({ id, testResponseId });
  }, [id, testResponseId]);

  const handleNextQuestion = async () => {
    console.log({ question });
    console.log("USER ANSWER: ", question?.options.answer);

    const userName = await getUserAction();

    if (userName) {
      const response = await submitQuestionAction(
        Number(testResponseId),
        question?.questionId!,
        question?.options.answer!,
        QUESTION_STATUS.ATTEMPTED,
        "",
        userName
      );

      if (response.status === 200) {
        fetchQuestionById(
          currentSection?.questions[currentIndex + 1].questionId!
        );
        setCurrentIndex(currentIndex + 1);
      } else {
        console.log(response.errorMessage);
        toast.error("Something Went Wrong");
      }
    } else {
      toast.error("Something Went Wrong");
    }
  };

  const clearResponse = async () => {
    switch (question!.questionsMeta.questionTypeName) {
      case "Single MCQ":
        setQuestion((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            options: {
              ...prev.options,
              answer: JSON.stringify([]),
            },
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
            options: {
              ...prev.options,
              answer: JSON.stringify([]),
            },
          };
        });
        break;
      case "Match Pairs Single":
        setQuestion((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            options: {
              ...prev.options,
              answer: JSON.stringify([]),
            },
          };
        });
        break;
      case "Match Pairs Multiple":
        setQuestion((prev) => {
          if (!prev) {
            return prev;
          }

          let emptyArr: string[][] = [];

          JSON.parse(question!.options.options)[0].map(() => {
            emptyArr.push([]);
          });

          return {
            ...prev,
            options: {
              ...prev.options,
              answer: JSON.stringify(emptyArr),
            },
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
            options: {
              ...prev.options,
              answer: "",
            },
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
            options: {
              ...prev.options,
              answer: "",
            },
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
            options: {
              ...prev.options,
              answer: "",
            },
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
            options: {
              ...prev.options,
              answer: "",
            },
          };
        });
        break;
    }
  };

  const handleJumpTo = (index: number, questionId: number) => {
    fetchQuestionById(questionId);
    setCurrentIndex(index);
  };

  const toggleMarkForReview = async () => {
    // TODO: Implement API here to update question status
  };

  const confirmSubmit = async () => {
    const username = await getUserAction();

    if (!username) {
      toast.error("Something Went Wrong");
    }

    const response = await endCandidateSessionAction(
      Number(testResponseId),
      username!
    );

    if (response.status === 200) {
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
    } else {
      toast.error("Something Went Wrong");
    }
  };

  // NEW
  const [currentSection, setCurrentSection] =
    useState<SectionsMetaDataInterface | null>(null);
  const [testMetaData, setTestMetaData] =
    useState<GetTestMetaDataResponse | null>(null);

  const fetchTestMetaData = async () => {
    setLoaded(false);
    const userId = await getUserAction();
    if (userId) {
      const res = await fetchTestMetaDataAction(Number(id), Number(userId));
      const { data, status, error, errorMessage, message } = res;
      if (status === 200 && data) {
        setTestMetaData(data);
        if (!currentSection) {
          setCurrentSection(data?.sections[0]);
        } else {
          const curSec = data.sections.find(
            (sec) => sec.sectionId === currentSection.sectionId
          );
          setCurrentSection(curSec!);
        }
        setLoaded(true);
      } else {
        setLoaded(true);
        toast.error("Something Went Wrong");
      }
    }
  };

  useEffect(() => {
    if (currentSection) {
      fetchQuestionById(currentSection?.questions[0]?.questionId!);
    }
  }, [currentSection]);

  useEffect(() => {
    console.log({ question });
  }, [question]);

  const handleTimeout = () => {
    // TODO: Handle timeout
  };

  function getCurrentSectionIndex(
    sections: SectionsMetaDataInterface[],
    current: SectionsMetaDataInterface
  ) {
    return sections.findIndex((s) => s.sectionId === current.sectionId);
  }
  const handleSectionTimeout = async () => {
    // Guard: needed data must exist
    if (!testMetaData || !testMetaData.sections?.length || !currentSection) {
      return;
    }

    const { sections } = testMetaData;

    const curIdx = getCurrentSectionIndex(sections, currentSection);
    if (curIdx === -1) {
      // Current section not found in latest metadata; optionally refetch or no-op
      return;
    }

    const isLast = curIdx === sections.length - 1;

    if (isLast) {
      // Last section -> submit
      await submitTest();
      return;
    }

    // Otherwise move to next section
    const nextSection = sections[curIdx + 1];
    if (nextSection) {
      setCurrentSection(nextSection);
    }
  };

  const submitTest = async () => {};

  useEffect(() => {
    fetchTestMetaData();
  }, []);

  useEffect(() => {
    console.log({ question });
  }, [question]);

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
                  <div className="w-full flex flex-col gap-2 md:flex md:flex-row items-center justify-between font-semibold border-b border-b-gray-300 pb-2">
                    <div>
                      <h1 className="text-sm text-gray-600">
                        Question {currentIndex + 1} -{" "}
                        {question?.questionsMeta?.questionTypeName}
                      </h1>
                    </div>
                    <div className="flex gap-3 items-center">
                      <div className="flex gap-3 text-xs md:text-sm">
                        <h1 className="text-green-500">Mark(s)</h1>
                        <h1>{question.questionsMeta.marks}</h1>
                      </div>
                      <h1 className="text-gray-500">|</h1>
                      <div className="flex gap-3 text-xs md:text-sm pr-1">
                        <h1 className="text-red-500 text-nowrap">
                          Negative Mark(s)
                        </h1>
                        <h1>{question.questionsMeta.negativeMarks}</h1>
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
                            {question.explanation && (
                              <>
                                <div>
                                  <h1 className="font-bold text-2xl">
                                    Directions
                                  </h1>
                                </div>
                                <div>
                                  <div className="text-md sm:text-lg font-medium">
                                    <TextOrHtml
                                      content={question.explanation}
                                    />
                                  </div>
                                </div>
                              </>
                            )}

                            <div>
                              <h1 className="font-bold text-2xl">Question</h1>
                            </div>
                            <div>
                              <div className="text-md sm:text-lg font-medium">
                                <TextOrHtml content={question.question} />
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
                          <RenderQuestion
                            question={question}
                            setQuestion={setQuestion}
                          />
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
                    <div className="w-full md:w-fit">
                      <button
                        onClick={handleNextQuestion}
                        // disabled={
                        //   currentIndex + 1 === currentSection?.questions.length
                        // }
                        className={clsx(
                          "w-full md:w-fit px-6 py-1 rounded-md font-medium text-white transition cursor-pointer bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 whitespace-nowrap text-sm"
                        )}
                      >
                        Save & Next
                      </button>
                    </div>
                    {/* )} */}
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
          handleSubmit={handleSubmit}
          handleJumpTo={handleJumpTo}
          currentIndex={currentIndex}
        />
      </div>

      {/* Modals */}
      <SubmitExamModal
        questionsMeta={currentSection?.questions!}
        showModal={showModal}
        confirmSubmit={confirmSubmit}
        cancelSubmit={cancelSubmit}
      />
    </div>
  );
}
