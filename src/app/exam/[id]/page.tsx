"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import ConfirmationModal from "@/components/ConfirmationModal";
import CountdownTimer from "@/components/CountdownTimer";
import {
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ShieldQuestion,
  Info,
  Menu,
  X,
} from "lucide-react";
import Modal from "@/components/Modal";
import { InstructionData } from "../instructions/[id]/page";
import mockInstructions from "@/mock/mockInstructions.json";
import { TabsContent, TabsList, TabsRoot } from "@/components/Tabs";
import {
  GetQuestionByIdResponse,
  QuestionsMetaResponse,
} from "@/utils/api/types";
import Loader from "@/components/Loader";
import { fetchQuestionsMetaAction } from "@/app/actions/exam/questions/getQuestionsMeta";
import { fetchQuestionByIdAction } from "@/app/actions/exam/questions/getQuestionById";
import { QUESTION_STATUS, QUESTION_TYPES } from "@/utils/constants";
import ScrollToggleButton from "@/components/ScrollToggleButton";
import RichTextEditor from "@/components/RichTextEditor";
import { TextOrHtml } from "@/components/TextOrHtml";
import ScrollXToggleButton from "@/components/ScrollXToggleButton";
import renderOptions from "./_components/RenderOptions";
import OnHover from "@/components/OnHover";
import QuestionCountPreview from "./_components/QuestionCountPreview";

export default function ExamPage() {
  const { id } = useParams();
  const [loaded, setLoaded] = useState<boolean>(false);
  const [questionsMeta, setQuestionsMeta] = useState<QuestionsMetaResponse[]>(
    []
  );
  const [question, setQuestion] = useState<GetQuestionByIdResponse>();
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

  // const questionsMeta = await fetchQuestionsMeta(Number(id));

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

  const renderQuestion = () => {
    switch (question?.questionType.questionType) {
      case QUESTION_TYPES.SINGLE_MCQ:
        return (
          <div className="flex flex-col gap-2">
            {JSON.parse(question!.questionOptionsJson).map(
              (option: string, index: number) => {
                return (
                  <label
                    key={index}
                    className={clsx(
                      "block border rounded-md px-4 py-2 cursor-pointer transition-all text-sm sm:text-base",
                      JSON?.parse(question!.userAnswer)?.includes(option)
                        ? "border-indigo-600 bg-indigo-100 text-indigo-900"
                        : "border-gray-300 hover:bg-gray-100"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      // checked={currentQuestion.selectedOption.includes(index)}
                      // onChange={() => handleToggleMultiple(index)}
                      onChange={() => {
                        setQuestion((prev) => {
                          if (!prev) {
                            return prev; // still undefined
                          }
                          return {
                            ...prev,
                            userAnswer: JSON.stringify([option]),
                          };
                        });

                        console.log(option);
                      }}
                    />
                    <TextOrHtml content={option} />
                  </label>
                );
              }
            )}
          </div>
        );
      case QUESTION_TYPES.MULTIPLE_MCQ:
        return (
          <div className="flex flex-col gap-2">
            {JSON.parse(question!.questionOptionsJson).map(
              (option: string, index: number) => {
                return (
                  <label
                    key={index}
                    className={clsx(
                      "block border rounded-md px-4 py-2 cursor-pointer transition-all text-sm sm:text-base",
                      JSON?.parse(question!.userAnswer)?.includes(option)
                        ? "border-indigo-600 bg-indigo-100 text-indigo-900"
                        : "border-gray-300 hover:bg-gray-100"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      // checked={currentQuestion.selectedOption.includes(index)}
                      // onChange={() => handleToggleMultiple(index)}
                      onChange={() => {
                        setQuestion((prev) => {
                          if (!prev) return prev;

                          // 1. Parse existing answers
                          let answers: string[];
                          try {
                            answers = JSON.parse(prev.userAnswer);
                            if (!Array.isArray(answers)) throw new Error();
                          } catch {
                            answers = [];
                          }

                          // 2. Toggle the current option
                          const idx = answers.indexOf(option);
                          if (idx >= 0) {
                            // already selected → remove
                            answers.splice(idx, 1);
                          } else {
                            // not selected → add
                            answers.push(option);
                          }

                          // 3. Return updated question
                          return {
                            ...prev,
                            userAnswer: JSON.stringify(answers),
                          };
                        });

                        console.log(option);
                      }}
                    />
                    <TextOrHtml content={option} />
                  </label>
                );
              }
            )}
          </div>
        );
      case QUESTION_TYPES.MATCH_PAIRS_SINGLE:
        return (
          <div className="w-full flex flex-col gap-5">
            <div className="w-full max-w-1/4 flex justify-between gap-2">
              {JSON.parse(question!.questionOptionsJson).map(
                (option: string[], index: number) => {
                  return (
                    <div className="flex flex-col gap-5" key={index}>
                      {option.map((col: string, index: number) => {
                        return (
                          <div key={index}>
                            <TextOrHtml content={col} />
                          </div>
                        );
                      })}
                    </div>
                  );
                }
              )}
            </div>
            <div>
              {JSON.parse(question!.questionOptionsJson)[0].map(
                (col: string, index: number) => {
                  return (
                    <div key={index}>
                      <h1>{col}</h1>
                      <div className="flex gap-2">
                        {JSON.parse(question!.questionOptionsJson)[1].map(
                          (row: string, idx: number) => {
                            return (
                              <div
                                className={`rounded-md border p-2 border-gray-300 cursor-pointer ${
                                  JSON.parse(question!.userAnswer)[index] ===
                                  row
                                    ? "border-indigo-600 bg-indigo-100 text-indigo-900"
                                    : "border-gray-300 hover:bg-gray-100"
                                }`}
                                key={idx}
                                onClick={() => {
                                  let updatedAnswer: string[] = JSON.parse(
                                    question!.userAnswer
                                  );
                                  if (updatedAnswer.includes(row)) {
                                    const rplIdx = updatedAnswer.indexOf(row);
                                    updatedAnswer[rplIdx] = "";
                                  }
                                  updatedAnswer[index] = row;
                                  setQuestion((prev) => {
                                    if (!prev) {
                                      return prev;
                                    }
                                    return {
                                      ...prev,
                                      userAnswer: JSON.stringify(updatedAnswer),
                                    };
                                  });
                                }}
                              >
                                <TextOrHtml content={row} />
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        );
      case QUESTION_TYPES.MATCH_PAIRS_MULTIPLE:
        return (
          <div className="w-full flex flex-col gap-5">
            <div className="w-full max-w-1/4 flex justify-between gap-2">
              {JSON.parse(question!.questionOptionsJson).map(
                (option: string[], index: number) => {
                  return (
                    <div className="flex flex-col gap-5" key={index}>
                      {option.map((col: string, index: number) => {
                        return (
                          <div key={index}>
                            <h1>{col}</h1>
                          </div>
                        );
                      })}
                    </div>
                  );
                }
              )}
            </div>
            <div>
              {JSON.parse(question!.questionOptionsJson)[0].map(
                (col: string, index: number) => {
                  return (
                    <div key={index}>
                      <h1>{col}</h1>
                      <div className="flex gap-2">
                        {JSON.parse(question!.questionOptionsJson)[1].map(
                          (row: string, idx: number) => {
                            return (
                              <div
                                className={`rounded-md border p-2 border-gray-300 cursor-pointer ${
                                  JSON.parse(question!.userAnswer)[
                                    index
                                  ].includes(row)
                                    ? "border-indigo-600 bg-indigo-100 text-indigo-900"
                                    : "border-gray-300 hover:bg-gray-100"
                                }`}
                                key={idx}
                                onClick={() => {
                                  setQuestion((prev) => {
                                    if (!prev) return prev;

                                    // 1. Parse the existing 2D userAnswer array
                                    const answers: string[][] = JSON.parse(
                                      prev.userAnswer
                                    );

                                    // 2. Work on a fresh copy of the sub-array at [index]
                                    const selection = [...answers[index]];

                                    // 3. Toggle this `row` in that sub-array
                                    const pos = selection.indexOf(row);
                                    if (pos >= 0) {
                                      selection.splice(pos, 1); // remove if already selected
                                    } else {
                                      selection.push(row); // add if not
                                    }

                                    // 4. Replace the sub-array back into `answers`
                                    answers[index] = selection;

                                    // 5. Write back the updated 2D array as a JSON string
                                    return {
                                      ...prev,
                                      userAnswer: JSON.stringify(answers),
                                    };
                                  });
                                }}
                              >
                                <TextOrHtml content={row} />
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        );
      case QUESTION_TYPES.WRITE_UP:
        return (
          <div className="w-full">
            <textarea
              className="w-full h-[40vh] rounded-md border border-gray-300 px-4 py-2"
              onChange={(e) => {
                setQuestion((prev) => {
                  if (!prev) {
                    return prev;
                  }
                  return {
                    ...prev,
                    userAnswer: e.target.value,
                  };
                });
                console.log(e.target.value);
              }}
              value={question?.userAnswer}
            />
          </div>
        );
      case QUESTION_TYPES.NUMERIC:
        return (
          <div className="w-full">
            <input
              type="text"
              inputMode="decimal"
              pattern="\d*(\.\d*)?"
              className="w-full rounded-md border border-gray-300 px-4 py-2"
              value={question?.userAnswer ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                // allow empty string or valid numeric/float
                if (val === "" || /^\d*\.?\d*$/.test(val)) {
                  setQuestion((prev) => {
                    if (!prev) return prev;
                    return { ...prev, userAnswer: val };
                  });
                }
              }}
            />
          </div>
        );
      case QUESTION_TYPES.TRUEFALSE:
        return (
          <div className="w-full flex flex-col gap-2">
            <label
              className={clsx(
                "block border rounded-md px-4 py-2 cursor-pointer transition-all text-sm sm:text-base",
                question!.userAnswer === "True"
                  ? "border-indigo-600 bg-indigo-100 text-indigo-900"
                  : "border-gray-300 hover:bg-gray-100"
              )}
            >
              <input
                type="checkbox"
                className="hidden"
                // checked={currentQuestion.selectedOption.includes(index)}
                // onChange={() => handleToggleMultiple(index)}
                onChange={() => {
                  setQuestion((prev) => {
                    if (!prev) {
                      return prev; // still undefined
                    }
                    return {
                      ...prev,
                      userAnswer: "True",
                    };
                  });
                }}
              />
              True
            </label>
            <label
              className={clsx(
                "block border rounded-md px-4 py-2 cursor-pointer transition-all text-sm sm:text-base",
                question!.userAnswer === "False"
                  ? "border-indigo-600 bg-indigo-100 text-indigo-900"
                  : "border-gray-300 hover:bg-gray-100"
              )}
            >
              <input
                type="checkbox"
                className="hidden"
                // checked={currentQuestion.selectedOption.includes(index)}
                // onChange={() => handleToggleMultiple(index)}
                onChange={() => {
                  setQuestion((prev) => {
                    if (!prev) {
                      return prev; // still undefined
                    }
                    return {
                      ...prev,
                      userAnswer: "False",
                    };
                  });
                }}
              />
              False
            </label>
          </div>
        );
      case QUESTION_TYPES.FILL_ANSWER:
        return (
          <div className="w-full">
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 px-4 py-2"
              value={question?.userAnswer ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                setQuestion((prev) => {
                  if (!prev) return prev;
                  return { ...prev, userAnswer: val };
                });
              }}
            />
          </div>
        );

      default:
        return <div>Unknown question type.</div>;
    }
  };

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

  if (!loaded) {
    return <Loader />;
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-100 overflow-hidden">
      {/* Main */}
      <div className="bg-gray-100 px-2 py-1 shadow-md border border-gray-300 space-y-4 flex justify-end">
        <div className="w-fit flex items-center gap-3 text-sm">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setShowQuestionsModal(true)}
          >
            <ShieldQuestion className="text-gray-600 w-4 h-4 cursor-pointer" />
            <div className="text-gray-600">
              <h1 className="text-xs">Question Paper</h1>
            </div>
          </div>
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setShowInstructionsModal(true)}
          >
            <Info className="text-gray-600 w-4 h-4 cursor-pointer" />
            <div className="text-gray-600">
              <h1 className="text-xs">Instructions</h1>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full h-full flex flex-row pb-9">
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
          <TabsRoot defaultIndex={0}>
            <div className="flex justify-between items-center bg-white rounded-md border border-gray-300 shadow-md">
              <TabsList
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

            <TabsContent className="w-full h-full overflow-hidden">
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
                            <div className="mb-10">{renderQuestion()}</div>
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
            </TabsContent>
          </TabsRoot>
        </main>

        {/* Sidebar */}
        <aside
          className={clsx(
            // common styles
            "bg-white border-gray-300 shadow-md flex flex-col gap-2 p-4 relative",
            // positioning
            "absolute lg:static w-full h-full transform transition-transform duration-300 z-50",
            // mobile open/closed
            sidebarOpen
              ? "translate-x-0 md:w-80 transition-all"
              : "-translate-x-full md:translate-x-full md:w-0 transition-all"
          )}
        >
          <div
            className={`w-7 h-15 rounded-md border-2 border-gray-500 absolute top-1/2 -translate-y-1/2 hidden lg:block ${
              sidebarOpen ? "-left-5" : "-left-8"
            } bg-white cursor-pointer`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <ChevronRight className="w-full h-full text-gray-600" />
            ) : (
              <ChevronLeft className="w-full h-full text-gray-600" />
            )}
          </div>
          <div className="w-full h-full flex flex-col justify-between">
            <div className="flex flex-col gap-4 pl-2">
              <div className="flex items-center space-x-4">
                <div className="md:hidden">
                  <div onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 md:w-12 md:h-12 bg-indigo-200 text-indigo-800 rounded-full flex items-center justify-center font-bold text-xl shadow-inner">
                    U
                  </div>
                  <div>
                    <h1 className="text-sm font-bold text-gray-800">
                      Welcome John Doe
                    </h1>
                  </div>
                </div>
              </div>
              {/* Legend */}
              <div className="flex flex-col gap-2 border-t border-t-gray-300 border-b border-b-gray-300 py-4">
                <div className="space-y-2 text-sm">
                  <div className="w-full grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 p-2 flex items-center justify-center bg-green-500 rounded-md font-bold text-white">
                        {
                          questionsMeta.filter(
                            (question) =>
                              question.status === QUESTION_STATUS.ATTEMPTED
                          ).length
                        }
                      </div>
                      <span>Answered</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 p-2 flex items-center justify-center bg-red-500 rounded-md font-bold text-white">
                        {
                          questionsMeta.filter(
                            (question) => question.status === "unanswered"
                          ).length
                        }
                      </div>
                      <span>Not Answered</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 p-2 flex items-center justify-center bg-gray-300 rounded-md font-bold">
                        {
                          questionsMeta.filter(
                            (question) =>
                              question.status === QUESTION_STATUS.NOT_VISITED
                          ).length
                        }
                      </div>
                      <span>Not Visited</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 p-2 flex items-center justify-center bg-purple-500 rounded-full font-bold text-white">
                        {
                          questionsMeta.filter(
                            (question) =>
                              question.status === QUESTION_STATUS.TO_REVIEW
                          ).length
                        }
                      </div>
                      <span>Marked For Review</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-8 p-2 flex items-center justify-center bg-purple-500 rounded-full font-bold text-white relative">
                      <div>
                        <CheckCheck className="text-green-500 w-5 h-5 absolute -top-3 -right-3" />
                      </div>
                      {
                        questionsMeta.filter(
                          (question) =>
                            question.status ===
                            QUESTION_STATUS.ANSWERED_TO_REVIEW
                        ).length
                      }
                    </div>
                    <div className="w-full ml-2">
                      <span className="w-full">
                        Answered And Marked For Review (Will Be Considered For
                        Evaluation)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Question Index */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div>
                    <h1 className="font-bold text-xl">Questions Pallet</h1>
                  </div>
                </div>
                <div className="grid grid-cols-8 md:grid-cols-4 gap-2 mb-4">
                  {questionsMeta?.map((q, index) => (
                    <button
                      key={q.questionId}
                      onClick={() => handleJumpTo(index, q.questionId)}
                      className={clsx(
                        "font-semibold text-xs sm:text-sm transition-colors cursor-pointer relative rounded-md",
                        q.status === QUESTION_STATUS.NOT_VISITED &&
                          "bg-gray-300 text-gray-700 hover:bg-gray-400 w-8 h-8 sm:w-full sm:h-10 rounded-md",
                        q.status === QUESTION_STATUS.ATTEMPTED &&
                          "bg-green-500 text-white hover:bg-green-600 w-8 h-8 sm:w-full sm:h-10 rounded-md",
                        q.status === QUESTION_STATUS.TO_REVIEW &&
                          "bg-purple-500 text-white hover:bg-purple-600 w-full h-10 rounded-full",
                        q.status === QUESTION_STATUS.ANSWERED_TO_REVIEW &&
                          "bg-purple-500 text-white hover:bg-purple-600 w-full h-10 rounded-full self-center",
                        q.status === "unanswered" &&
                          "bg-red-500 text-white hover:bg-red-600 w-8 h-8 sm:w-full sm:h-10 rounded-md",
                        index === currentIndex
                          ? "border-3 border-gray-600"
                          : "border-3 border-transparent"
                      )}
                    >
                      {q.status === "answeredMarkedForReview" && (
                        <div>
                          <CheckCheck className="text-green-500 w-5 h-5 absolute -top-3 -right-4" />
                        </div>
                      )}
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {sidebarOpen && (
              <div className="w-full flex justify-center">
                <button
                  onClick={handleSubmit}
                  className="w-fit text-nowrap px-6 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md font-medium cursor-pointer mb-16 md:mb-0"
                >
                  Submit Test
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>

      <ConfirmationModal
        isOpen={showModal}
        title="Submit Test?"
        message="Are you sure you want to submit the test? You won't be able to change your answers after this."
        // onConfirm={confirmSubmit}
        onConfirm={() => {}}
        onCancel={cancelSubmit}
      />

      <Modal
        title="Instructions"
        isOpen={showInstructionsModal}
        closeModal={() => setShowInstructionsModal(false)}
        className={"max-w-md"}
      >
        <div className="mb-8 space-y-4">
          {instructionData?.instructions.map((inst, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <span className="flex items-center justify-center text-gray-600 font-bold">
                  {index + 1}
                </span>
              </div>
              <p className="text-base text-start font-bold">{inst}</p>
            </div>
          ))}
        </div>
        <button
          className="w-full px-4 py-2 rounded-md cursor-pointer shadow-md bg-blue-600 text-white font-bold"
          onClick={() => setShowInstructionsModal(false)}
        >
          Done
        </button>
      </Modal>

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
                index !== questionsMeta.length - 1 &&
                "border-b border-b-gray-300"
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
    </div>
  );
}
