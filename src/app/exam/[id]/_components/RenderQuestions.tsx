import { TextOrHtml } from "@/components/TextOrHtml";
import { GetQuestionByIdResponse } from "@/utils/api/types";
import { QUESTION_TYPES } from "@/utils/constants";
import clsx from "clsx";
import { Dispatch, SetStateAction } from "react";

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
}
