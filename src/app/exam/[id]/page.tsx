"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import ConfirmationModal from "@/components/ConfirmationModal";
import CountdownTimer from "@/components/CountdownTimer";
import {
  ChevronLeftCircle,
  ChevronRightCircleIcon,
  Info,
  Menu,
  X,
} from "lucide-react";
import Modal from "@/components/Modal";
import { InstructionData } from "../instructions/[id]/page";
import mockInstructions from "@/mock/mockInstructions.json";
import { TabsContent, TabsList, TabsRoot } from "@/components/Tabs";
import { fetchQuestionListAction } from "@/app/actions/exam/getQuestionList";
import { GetQuestionListResponse } from "@/utils/api/types";

export default function ExamPage() {
  const { id } = useParams();
  const router = useRouter();
  const [questions, setQuestions] = useState<GetQuestionListResponse>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] =
    useState<boolean>(false);
  const [instructionData, setInstructionData] =
    useState<InstructionData | null>(null);

  const instructionsMap: Record<string, InstructionData> = mockInstructions;

  useEffect(() => {
    if (id && instructionsMap[id as string]) {
      setInstructionData(instructionsMap[id as string]);
    }
  }, [id]);

  const fetchQuestionList = async () => {
    const res = await fetchQuestionListAction(Number(id));
    const { data, status, error, errorMessage, message } = res;
    if (status === 200) {
      setQuestions(data);
      // setTestList(data);
      // setLoaded(true);
    } else {
      console.log({ status, error, errorMessage });
    }
  };

  // Load the test list once on mount
  useEffect(() => {
    fetchQuestionList();
  }, []);

  // const isAllAnswersValid = (): number | null => {
  //   for (let i = 0; i < questions.length; i++) {
  //     const question = questions[i];
  //     const selected = question.selectedOption;

  //     switch (question.type) {
  //       case "single":
  //       case "truefalse":
  //         if (selected === null || selected === undefined) return i;
  //         break;

  //       case "multiple":
  //         if (!Array.isArray(selected) || selected.length === 0) return i;
  //         break;

  //       case "match":
  //         const leftItems = question.matches?.left || [];
  //         for (const left of leftItems) {
  //           const matches = selected?.[left];
  //           if (!Array.isArray(matches) || matches.length === 0) return i;
  //         }
  //         break;

  //       case "fill":
  //       case "essay":
  //       case "number":
  //         if (!selected || selected.trim() === "") return i;
  //         break;

  //       default:
  //         return i;
  //     }
  //   }

  //   return null;
  // };

  // const updateAnswer = (value: any) => {
  //   console.log({ value });
  //   const updated = [...questions];
  //   updated[currentIndex].selectedOption = value;
  //   updated[currentIndex].status = "attempted";
  //   setQuestions(updated);
  //   setErrorMessage(null);
  // };

  // const handleToggleMultiple = (index: number) => {
  //   const updated = [...questions];
  //   const selected = new Set(updated[currentIndex].selectedOption);
  //   selected.has(index) ? selected.delete(index) : selected.add(index);
  //   updated[currentIndex].selectedOption = Array.from(selected);
  //   updated[currentIndex].status = "attempted";
  //   setQuestions(updated);
  //   setErrorMessage(null);
  // };

  // const toggleMarkForReview = () => {
  //   const updated = [...questions];
  //   console.log(updated[currentIndex].selectedOption);

  //   if (
  //     updated[currentIndex].type === "single" &&
  //     updated[currentIndex].selectedOption !== null
  //   ) {
  //     updated[currentIndex].status =
  //       updated[currentIndex].status === "answeredMarkedForReview"
  //         ? "attempted"
  //         : "answeredMarkedForReview";
  //   } else if (
  //     updated[currentIndex].type === "multiple" &&
  //     updated[currentIndex].selectedOption?.length !== 0
  //   ) {
  //     updated[currentIndex].status =
  //       updated[currentIndex].status === "answeredMarkedForReview"
  //         ? "attempted"
  //         : "answeredMarkedForReview";
  //   } else if (
  //     updated[currentIndex].type === "match" &&
  //     Object.keys(updated[currentIndex].selectedOption)?.length !== 0
  //   ) {
  //     updated[currentIndex].status =
  //       updated[currentIndex].status === "answeredMarkedForReview"
  //         ? "attempted"
  //         : "answeredMarkedForReview";
  //   } else if (
  //     (updated[currentIndex].type === "fill" ||
  //       updated[currentIndex].type === "essay" ||
  //       updated[currentIndex].type === "number") &&
  //     updated[currentIndex].selectedOption?.length !== 0
  //   ) {
  //     updated[currentIndex].status =
  //       updated[currentIndex].status === "answeredMarkedForReview"
  //         ? "attempted"
  //         : "answeredMarkedForReview";
  //   } else if (
  //     updated[currentIndex].type === "truefalse" &&
  //     updated[currentIndex].selectedOption !== null
  //   ) {
  //     updated[currentIndex].status =
  //       updated[currentIndex].status === "answeredMarkedForReview"
  //         ? "attempted"
  //         : "answeredMarkedForReview";
  //   } else {
  //     updated[currentIndex].status =
  //       updated[currentIndex].status === "review" ? "attempted" : "review";
  //   }

  //   if (
  //     updated[currentIndex].status !== "attempted" &&
  //     currentIndex < questions.length - 1
  //   ) {
  //     handleNextQuestion();
  //   }
  //   setQuestions(updated);
  // };

  // const handleNextQuestion = () => {
  //   const updated = [...questions];
  //   if (updated[currentIndex + 1].status === "unattempted")
  //     updated[currentIndex + 1].status = "unanswered";
  //   if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
  //   setQuestions(updated);
  // };

  // const handlePreviousQuestion = () => {
  //   const updated = [...questions];

  //   if (updated[currentIndex - 1].status === "unattempted")
  //     updated[currentIndex - 1].status = "unanswered";
  //   if (currentIndex !== 0) setCurrentIndex(currentIndex - 1);
  // };

  // const clearResponse = () => {
  //   const qs = [...questions];
  //   switch (qs[currentIndex].type) {
  //     case "multiple":
  //       qs[currentIndex].selectedOption = [];
  //       break;
  //     case "single":
  //     case "truefalse":
  //       qs[currentIndex].selectedOption = null;
  //       break;
  //     case "fill":
  //     case "essay":
  //     case "number":
  //       qs[currentIndex].selectedOption = "";
  //       break;
  //     case "match":
  //       qs[currentIndex].selectedOption = {};
  //       break;
  //   }
  //   qs[currentIndex].status = "unattempted";
  //   setQuestions(qs);
  // };

  // const handleJumpTo = (index: number) => {
  //   const updated = [...questions];
  //   if (updated[index].status === "unattempted")
  //     updated[index].status = "unanswered";
  //   setCurrentIndex(index);
  //   setQuestions(updated);
  //   if (sidebarOpen) setSidebarOpen(false);
  // };

  const handleSubmit = () => setShowModal(true);

  // const confirmSubmit = () => {
  //   setSidebarOpen(false);
  //   const invalidIndex = isAllAnswersValid();

  //   if (invalidIndex !== null) {
  //     setCurrentIndex(invalidIndex);
  //     setErrorMessage("Please answer this question before submitting.");
  //     setShowModal(false);
  //     return;
  //   }

  //   setErrorMessage(null);
  //   setShowModal(false);

  //   // Submit logic here
  //   router.push("/dashboard");
  // };

  const cancelSubmit = () => setShowModal(false);

  useEffect(() => {
    console.log({ questions });
  }, [questions]);

  const renderQuestion = () => {
    switch (questions!.questionType.questionType) {
      // case "single":
      // case "truefalse":
      //   return JSON.parse(questions!.options)?.map(
      //     (option: any, index: number) => (
      //       <label
      //         key={index}
      //         className={clsx(
      //           "block border rounded-md px-4 py-2 cursor-pointer transition-all text-sm sm:text-base",
      //           questions.selectedOption === index
      //             ? "border-indigo-600 bg-indigo-100 text-indigo-900"
      //             : "border-gray-300 hover:bg-gray-100"
      //         )}
      //       >
      //         <input
      //           type="radio"
      //           name={`question-${questions.questionId}`}
      //           className="hidden"
      //           checked={questions.selectedOption === index}
      //           onChange={() => updateAnswer(index)}
      //         />
      //         {option}
      //       </label>
      //     )
      //   );
      // case "multiple":
      //   return JSON.parse(questions.options)?.map(
      //     (option: any, index: any) => (
      //       <label
      //         key={index}
      //         className={clsx(
      //           "block border rounded-md px-4 py-2 cursor-pointer transition-all text-sm sm:text-base",
      //           currentQuestion.selectedOption.includes(index)
      //             ? "border-indigo-600 bg-indigo-100 text-indigo-900"
      //             : "border-gray-300 hover:bg-gray-100"
      //         )}
      //       >
      //         <input
      //           type="checkbox"
      //           className="hidden"
      //           checked={currentQuestion.selectedOption.includes(index)}
      //           onChange={() => handleToggleMultiple(index)}
      //         />
      //         {option}
      //       </label>
      //     )
      //   );
      // case "fill":
      //   return (
      //     <input
      //       type="text"
      //       placeholder="Your answer..."
      //       value={currentQuestion.selectedOption}
      //       onChange={(e) => updateAnswer(e.target.value)}
      //       className="w-full border border-gray-300 rounded-md px-3 py-2"
      //     />
      //   );
      // case "essay":
      //   return (
      //     <div>
      //       <textarea
      //         rows={6}
      //         className="w-full border border-gray-300 rounded-md p-3"
      //         placeholder="Type your answer..."
      //         value={currentQuestion.selectedOption}
      //         onChange={(e) => updateAnswer(e.target.value)}
      //       />
      //       <div className="text-right text-sm text-gray-500 mt-1">
      //         Word Count:{" "}
      //         {currentQuestion.selectedOption?.split(/\s+/).filter(Boolean)
      //           .length || 0}
      //       </div>
      //     </div>
      //   );
      // case "number":
      //   return (
      //     <input
      //       type="text"
      //       inputMode="numeric"
      //       pattern="[0-9]*"
      //       className="w-full border border-gray-300 rounded-md px-3 py-2"
      //       value={currentQuestion.selectedOption}
      //       onChange={(e) => {
      //         const raw = e.target.value;
      //         // Only call updateAnswer if raw is entirely digits (or empty)
      //         if (/^\d*$/.test(raw)) {
      //           // RegExp.test returns boolean :contentReference[oaicite:2]{index=2}
      //           updateAnswer(raw);
      //         }
      //       }}
      //     />
      //   );
      // case "match":
      //   const leftItems = currentQuestion.matches?.left || [];
      //   const rightItems = currentQuestion.matches?.right || [];

      //   const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

      //   return (
      //     <div className="space-y-6">
      //       {/* Display columns */}
      //       <div className="w-full flex items-start gap-24">
      //         <div>
      //           <h4 className="font-semibold mb-2">Column A</h4>
      //           <ul className="space-y-1">
      //             {leftItems.map((item, index) => (
      //               <li key={index}>
      //                 <span className="font-medium">{index + 1}.</span> {item}
      //               </li>
      //             ))}
      //           </ul>
      //         </div>
      //         <div>
      //           <h4 className="font-semibold mb-2">Column B</h4>
      //           <ul className="space-y-1">
      //             {rightItems.map((item, index) => (
      //               <li key={index}>
      //                 <span className="font-medium">{alphabet[index]}.</span>{" "}
      //                 {item}
      //               </li>
      //             ))}
      //           </ul>
      //         </div>
      //       </div>

      //       {/* Answer selection */}
      //       <div className="space-y-4">
      //         {leftItems.map((item, i) => {
      //           const selected = new Set(
      //             currentQuestion.selectedOption?.[item] || []
      //           );

      //           const toggleMatch = (letter: string) => {
      //             const newSelection = new Set(selected);
      //             newSelection.has(letter)
      //               ? newSelection.delete(letter)
      //               : newSelection.add(letter);

      //             updateAnswer({
      //               ...currentQuestion.selectedOption,
      //               [item]: Array.from(newSelection),
      //             });
      //           };

      //           return (
      //             <div key={i}>
      //               <div className="font-medium mb-1">
      //                 {i + 1}. {item}
      //               </div>
      //               <div className="flex flex-wrap gap-3">
      //                 {rightItems.map((_, j) => {
      //                   const letter = alphabet[j];
      //                   const isChecked = selected.has(letter);

      //                   return (
      //                     <label
      //                       key={j}
      //                       className={clsx(
      //                         "flex items-center gap-2 px-3 py-1 border rounded-md cursor-pointer transition-all",
      //                         isChecked
      //                           ? "bg-indigo-100 border-indigo-500 text-indigo-900"
      //                           : "bg-white border-gray-300 hover:bg-gray-50"
      //                       )}
      //                     >
      //                       <input
      //                         type="checkbox"
      //                         checked={isChecked}
      //                         onChange={() => toggleMatch(letter)}
      //                         className="hidden"
      //                       />
      //                       {letter}
      //                     </label>
      //                   );
      //                 })}
      //               </div>
      //             </div>
      //           );
      //         })}
      //       </div>
      //     </div>
      //   );

      case "Single MCQ":
        console.log({ questions });
        console.log("options", questions?.options);
        return (
          <div className="flex flex-col gap-2">
            {JSON.parse(questions!.options).map(
              (option: string, index: number) => {
                return (
                  <label
                    key={index}
                    className={clsx(
                      "block border rounded-md px-4 py-2 cursor-pointer transition-all text-sm sm:text-base",
                      JSON?.parse(questions!.userAnswer)?.includes(option)
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
                        setQuestions((prev) => {
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
                    {option}
                  </label>
                );
              }
            )}
          </div>
        );
      case "Multiple MCQ":
        console.log({ questions });
        console.log("options", questions?.options);
        return (
          <div className="flex flex-col gap-2">
            {JSON.parse(questions!.options).map(
              (option: string, index: number) => {
                return (
                  <label
                    key={index}
                    className={clsx(
                      "block border rounded-md px-4 py-2 cursor-pointer transition-all text-sm sm:text-base",
                      JSON?.parse(questions!.userAnswer)?.includes(option)
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
                        setQuestions((prev) => {
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
                    {option}
                  </label>
                );
              }
            )}
          </div>
        );
      case "Match Pairs Single":
        return (
          <div className="w-full flex flex-col gap-5">
            <div className="w-full max-w-1/4 flex justify-between gap-2">
              {JSON.parse(questions!.options).map(
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
              {JSON.parse(questions!.options)[0].map(
                (col: string, index: number) => {
                  return (
                    <div key={index}>
                      <h1>{col}</h1>
                      <div className="flex gap-2">
                        {JSON.parse(questions!.options)[1].map(
                          (row: string, idx: number) => {
                            return (
                              <div
                                className={`rounded-md border p-2 border-gray-300 cursor-pointer ${
                                  JSON.parse(questions!.userAnswer)[index] ===
                                  row
                                    ? "border-indigo-600 bg-indigo-100 text-indigo-900"
                                    : "border-gray-300 hover:bg-gray-100"
                                }`}
                                key={idx}
                                onClick={() => {
                                  let updatedAnswer: string[] = JSON.parse(
                                    questions!.userAnswer
                                  );
                                  if (updatedAnswer.includes(row)) {
                                    const rplIdx = updatedAnswer.indexOf(row);
                                    updatedAnswer[rplIdx] = "";
                                  }
                                  updatedAnswer[index] = row;
                                  setQuestions((prev) => {
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
                                <h1>{row}</h1>
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
      case "Match Pairs Multiple":
        return (
          <div className="w-full flex flex-col gap-5">
            <div className="w-full max-w-1/4 flex justify-between gap-2">
              {JSON.parse(questions!.options).map(
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
              {JSON.parse(questions!.options)[0].map(
                (col: string, index: number) => {
                  return (
                    <div key={index}>
                      <h1>{col}</h1>
                      <div className="flex gap-2">
                        {JSON.parse(questions!.options)[1].map(
                          (row: string, idx: number) => {
                            return (
                              <div
                                className={`rounded-md border p-2 border-gray-300 cursor-pointer ${
                                  JSON.parse(questions!.userAnswer)[
                                    index
                                  ].includes(row)
                                    ? "border-indigo-600 bg-indigo-100 text-indigo-900"
                                    : "border-gray-300 hover:bg-gray-100"
                                }`}
                                key={idx}
                                onClick={() => {
                                  setQuestions((prev) => {
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
                                <h1>{row}</h1>
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

      default:
        return <div>Unknown question type.</div>;
    }
  };

  const handleTimeout = () => {
    console.log("TIMEOUT");
    // TODO: Handle timeout
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-gray-100">
      {/* Main */}
      <main className="w-full flex-1 p-4 sm:p-6 flex flex-col gap-5">
        <div className="bg-white p-4 sm:p-6 rounded-md shadow-md border border-gray-300 space-y-4">
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
              <div>
                <h1 className="font-bold text-sm md:text-xl">
                  Aptitude Test - 1
                </h1>
              </div>
            </div>
            <div className="w-fit flex items-center gap-3 text-sm">
              <div>
                <CountdownTimer
                  initialTime="00:05:00"
                  onComplete={handleTimeout}
                  className="text-sm"
                />
              </div>
              <div>
                <Info
                  className="text-gray-600 w-5 h-5 cursor-pointer"
                  onClick={() => setShowInstructionsModal(true)}
                />
              </div>
            </div>
          </div>
        </div>
        <TabsRoot defaultIndex={0}>
          <div className="flex justify-between items-center">
            <TabsList
              className="w-full"
              labels={["Section 1", "Section 2", "Section 3"]}
            />
          </div>

          <TabsContent>
            <div>
              {questions && (
                <div className="bg-white p-4 sm:p-6 rounded-md shadow-md border border-gray-300 space-y-4">
                  <div className="w-full flex flex-col gap-2 md:flex md:flex-row justify-between font-semibold">
                    <div>
                      <h1 className="text-sm text-gray-600">
                        Question {currentIndex + 1} -{" "}
                        {questions?.questionType?.questionType}
                      </h1>
                    </div>
                    <div className="flex gap-3 items-center">
                      <div className="flex gap-3 text-xs md:text-sm">
                        <h1 className="text-green-500">Mark(s)</h1>
                        <h1>{questions.marks}</h1>
                      </div>
                      <h1 className="text-gray-500">|</h1>
                      <div className="flex gap-3 text-xs md:text-sm pr-1">
                        <h1 className="text-red-500 text-nowrap">
                          Negative Mark(s)
                        </h1>
                        <h1>{questions.negativeMarks}</h1>
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
                  <div className="w-full flex justify-between">
                    <div>
                      <h2 className="text-md sm:text-lg font-bold">
                        {questions.questionText}
                      </h2>
                    </div>
                  </div>
                  {errorMessage && (
                    <div className="mb-4 text-sm text-red-600 font-medium">
                      {errorMessage}
                    </div>
                  )}
                  <div className="space-y-3">{renderQuestion()}</div>
                  <div className="flex flex-col md:flex md:flex-row items-center justify-between gap-4 mt-4">
                    <div className="w-full flex gap-3">
                      {/* <button
                        onClick={toggleMarkForReview}
                        className={clsx(
                          "w-full md:w-fit px-4 py-2 rounded-md font-medium text-white cursor-pointer",
                          currentQuestion.status === "review" ||
                            currentQuestion.status === "answeredMarkedForReview"
                            ? "bg-gray-500 hover:bg-gray-600"
                            : "bg-purple-500 hover:bg-purple-600"
                        )}
                      >
                        {currentQuestion.status === "review" ||
                        currentQuestion.status === "answeredMarkedForReview"
                          ? "Unmark Review"
                          : currentIndex < questions.length - 1
                          ? "Mark For Review & Next"
                          : "Mark For Review"}
                      </button> */}
                      <button
                        // onClick={clearResponse}
                        className={clsx(
                          "w-full md:w-fit px-4 py-2 rounded-md font-medium text-white cursor-pointer bg-cyan-500 hover:bg-cyan-600"
                        )}
                      >
                        Clear Response
                      </button>
                    </div>

                    <div className="w-full md:w-fit flex gap-3">
                      <div className="w-full md:w-fit">
                        <button
                          // onClick={handlePreviousQuestion}
                          disabled={currentIndex === 0}
                          className={clsx(
                            "w-full md:w-fit px-6 py-2 rounded-md font-medium text-white transition cursor-pointer",
                            currentIndex === 0
                              ? "bg-gray-300 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700"
                          )}
                        >
                          Previous
                        </button>
                      </div>
                      <div className="w-full md:w-fit">
                        <button
                          // onClick={handleNextQuestion}
                          className={clsx(
                            "w-full md:w-fit px-6 py-2 rounded-md font-medium text-white transition cursor-pointer bg-blue-600 hover:bg-blue-700"
                          )}
                        >
                          Next
                        </button>
                      </div>
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
          "bg-white border-gray-300 shadow-md flex flex-col gap-2 p-4 ",
          // positioning
          "absolute lg:static w-full h-full transform transition-transform duration-300 z-50",
          // mobile open/closed
          sidebarOpen
            ? "translate-x-0 md:w-80 transition-all"
            : "-translate-x-full md:translate-x-full md:w-0 transition-all"
        )}
      >
        <div
          className={`w-10 h-10 rounded-full absolute top-5 hidden lg:block ${
            sidebarOpen ? "-left-5" : "-left-11"
          } bg-white cursor-pointer`}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? (
            <ChevronRightCircleIcon className="w-full h-full text-gray-600" />
          ) : (
            <ChevronLeftCircle className="w-full h-full text-gray-600" />
          )}
        </div>
        <div className="w-full h-full flex flex-col justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex items-center space-x-4 lg:ml-2">
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
                  <h1 className="text-xs font-bold text-gray-600">Welcome</h1>
                  <h1 className="text-xl font-bold text-gray-800">John Doe</h1>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div>
                  <h1 className="font-bold text-2xl">Questions</h1>
                </div>
              </div>
              <div className="grid grid-cols-8 md:grid-cols-4 gap-y-2 mb-4">
                {/* {questions.map((q, index) => (
                  <button
                    key={q.id}
                    onClick={() => handleJumpTo(index)}
                    className={clsx(
                      "font-semibold text-xs sm:text-sm transition-colors cursor-pointer relative",
                      q.status === "unattempted" &&
                        "bg-gray-300 text-gray-700 hover:bg-gray-400 w-8 h-8 sm:w-10 sm:h-10 rounded-md",
                      q.status === "attempted" &&
                        "bg-green-500 text-white hover:bg-green-600 w-8 h-8 sm:w-10 sm:h-10 rounded-md",
                      q.status === "review" &&
                        "bg-purple-500 text-white hover:bg-purple-600 w-10 h-10 rounded-full",
                      q.status === "answeredMarkedForReview" &&
                        "bg-purple-500 text-white hover:bg-purple-600 w-10 h-10 rounded-full self-center",
                      q.status === "unanswered" &&
                        "bg-red-500 text-white hover:bg-red-600 w-8 h-8 sm:w-10 sm:h-10 rounded-md",
                      index === currentIndex
                        ? "border-3 border-gray-700"
                        : "border-3 border-transparent"
                    )}
                  >
                    {q.status === "answeredMarkedForReview" && (
                      <div>
                        <CheckCheck className="text-green-500 w-5 h-5 absolute -top-3 -right-4" />
                      </div>
                    )}
                    {q.id}
                  </button>
                ))} */}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div>
                <h1 className="font-bold text-2xl">Legend</h1>
              </div>
              {/* <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 p-2 flex items-center justify-center bg-gray-300 rounded-md font-bold">
                    {
                      questions.filter(
                        (question) => question.status === "unattempted"
                      ).length
                    }
                  </div>
                  <span>Not Visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 p-2 flex items-center justify-center bg-red-500 rounded-md font-bold text-white">
                    {
                      questions.filter(
                        (question) => question.status === "unanswered"
                      ).length
                    }
                  </div>
                  <span>Not Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 p-2 flex items-center justify-center bg-green-500 rounded-md font-bold text-white">
                    {
                      questions.filter(
                        (question) => question.status === "attempted"
                      ).length
                    }
                  </div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 p-2 flex items-center justify-center bg-purple-500 rounded-full font-bold text-white">
                    {
                      questions.filter(
                        (question) => question.status === "review"
                      ).length
                    }
                  </div>
                  <span>Marked For Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-8 p-2 flex items-center justify-center bg-purple-500 rounded-full font-bold text-white relative">
                    <div>
                      <CheckCheck className="text-green-500 w-5 h-5 absolute -top-3 -right-3" />
                    </div>
                    {
                      questions.filter(
                        (question) =>
                          question.status === "answeredMarkedForReview"
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
              </div> */}
            </div>
          </div>
          <div className="w-full">
            <button
              onClick={handleSubmit}
              className="w-full text-nowrap px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium cursor-pointer mb-16 md:mb-0"
            >
              Submit Test
            </button>
          </div>
        </div>
      </aside>

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
                <span className="bg-indigo-500 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold">
                  {index + 1}
                </span>
              </div>
              <p className="text-gray-700 text-base text-start">{inst}</p>
            </div>
          ))}
        </div>
        <button
          className="w-full px-4 py-2 rounded-md cursor-pointer shadow-md bg-gray-300 font-bold"
          onClick={() => setShowInstructionsModal(false)}
        >
          Done
        </button>
      </Modal>
    </div>
  );
}
