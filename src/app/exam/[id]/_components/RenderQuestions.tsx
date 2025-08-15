import { TextOrHtml } from "@/components/TextOrHtml";
import { GetQuestionByIdResponse } from "@/utils/api/types";
import { QUESTION_TYPES } from "@/utils/constants";
import clsx from "clsx";
import { Dispatch, SetStateAction, useCallback } from "react";

export default function renderQuestion(
  question: GetQuestionByIdResponse,
  setQuestion: Dispatch<SetStateAction<GetQuestionByIdResponse | undefined>>
) {
  switch (question?.questionType.questionType) {
    case QUESTION_TYPES.SINGLE_MCQ:
      return (
        <div className="flex flex-col gap-2">
          {JSON.parse(question!.questionOptionsJson).map(
            (option: string, index: number) => {
              // Parse current answers safely
              let currentAnswers: string[] = [];
              try {
                const parsed = JSON.parse(question!.userAnswer || "[]");
                currentAnswers = Array.isArray(parsed) ? parsed : [];
              } catch {
                currentAnswers = [];
              }
              
              const isSelected = currentAnswers.includes(option);
              
              return (
                <div
                  key={index}
                  className={clsx(
                    "block border rounded-md px-4 py-2 cursor-pointer transition-all text-sm sm:text-base",
                    isSelected
                      ? "border-indigo-600 bg-indigo-100 text-indigo-900"
                      : "border-gray-300 hover:bg-gray-100"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    setQuestion((prev) => {
                      if (!prev) {
                        return prev; // still undefined
                      }
                      return {
                        ...prev,
                        userAnswer: JSON.stringify([option]),
                      };
                    });
                  }}
                >
                  <input
                    type="radio"
                    className="hidden"
                    checked={isSelected}
                    readOnly
                  />
                  <TextOrHtml content={option} />
                </div>
              );
            }
          )}
        </div>
      );
    case QUESTION_TYPES.MULTIPLE_MCQ:
      const handleMultipleChoice = useCallback((optionToToggle: string) => {
        setQuestion((prev) => {
          if (!prev) return prev;

          // Parse existing answers
          let answers: string[];
          try {
            answers = JSON.parse(prev.userAnswer || "[]");
            if (!Array.isArray(answers)) answers = [];
          } catch {
            answers = [];
          }

          // Create new array to avoid mutation
          const newAnswers = [...answers];
          const idx = newAnswers.indexOf(optionToToggle);
          
          if (idx !== -1) {
            // Remove if already selected
            newAnswers.splice(idx, 1);
          } else {
            // Add if not selected
            newAnswers.push(optionToToggle);
          }

          return {
            ...prev,
            userAnswer: JSON.stringify(newAnswers),
          };
        });
      }, [setQuestion]);

      return (
        <div className="flex flex-col gap-2">
          {JSON.parse(question!.questionOptionsJson).map(
            (option: string, index: number) => {
              // Parse current answers safely
              let currentAnswers: string[] = [];
              try {
                const parsed = JSON.parse(question!.userAnswer || "[]");
                currentAnswers = Array.isArray(parsed) ? parsed : [];
              } catch {
                currentAnswers = [];
              }
              
              const isSelected = currentAnswers.includes(option);
              
              return (
                <div
                  key={`multiple-mcq-${index}-${option}`}
                  className={clsx(
                    "block border rounded-md px-4 py-2 cursor-pointer transition-all text-sm sm:text-base select-none",
                    isSelected
                      ? "border-indigo-600 bg-indigo-100 text-indigo-900"
                      : "border-gray-300 hover:bg-gray-100"
                  )}
                  onClick={() => handleMultipleChoice(option)}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <div className="flex items-center gap-2 pointer-events-none">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="pointer-events-none"
                    />
                    <div className="flex-1">
                      <TextOrHtml content={option} />
                    </div>
                  </div>
                </div>
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
                                JSON.parse(question!.userAnswer)[index] === row
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
}
