import { TextOrHtml } from "@/components/TextOrHtml";
import { GetQuestionByIdResponse } from "@/utils/api/types";
import { QUESTION_TYPES } from "@/utils/constants";
import clsx from "clsx";
import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { Trash2, X } from "lucide-react";
import ConfirmationModal from "@/components/ConfirmationModal";
import {
  deleteQuestionOptionAction,
  deleteMultipleQuestionOptionsAction,
} from "@/app/actions/exam/questions/deleteQuestionOption";

interface RenderQuestionProps {
  question: GetQuestionByIdResponse;
  setQuestion: Dispatch<SetStateAction<GetQuestionByIdResponse | undefined>>;
}

export default function RenderOptions({
  question,
  setQuestion,
}: {
  question: GetQuestionByIdResponse;
  setQuestion: Dispatch<SetStateAction<GetQuestionByIdResponse | undefined>>;
}) {
  const [selectedOptions, setSelectedOptions] = useState<Set<number>>(
    new Set()
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"single" | "multiple">("single");
  const [optionToDelete, setOptionToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteSingle = useCallback((optionIndex: number) => {
    setOptionToDelete(optionIndex);
    setDeleteMode("single");
    setShowDeleteModal(true);
  }, []);

  const handleDeleteMultiple = useCallback(() => {
    if (selectedOptions.size === 0) return;
    setDeleteMode("multiple");
    setShowDeleteModal(true);
  }, [selectedOptions.size]);

  const confirmDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      if (deleteMode === "single" && optionToDelete !== null) {
        // For single delete, we'll use the option index as the questionOptionId
        // You may need to adjust this based on your actual data structure
        const result = await deleteQuestionOptionAction(optionToDelete);
        if (result.success) {
          // Remove the option from the question
          const options = JSON.parse(question.options.options);
          options.splice(optionToDelete, 1);
          setQuestion((prev) =>
            prev
              ? { ...prev, questionOptionsJson: JSON.stringify(options) }
              : prev
          );
        }
      } else if (deleteMode === "multiple") {
        // Convert selected indices to questionOptionIds
        const optionIndices = Array.from(selectedOptions);
        const result = await deleteMultipleQuestionOptionsAction(optionIndices);
        if (result.success) {
          // Remove selected options from the question
          const options = JSON.parse(question.options.options);
          const filteredOptions = options.filter(
            (_: any, index: number) => !selectedOptions.has(index)
          );
          setQuestion((prev) =>
            prev
              ? {
                  ...prev,
                  questionOptionsJson: JSON.stringify(filteredOptions),
                }
              : prev
          );
          setSelectedOptions(new Set());
        }
      }
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setOptionToDelete(null);
    }
  }, [
    deleteMode,
    optionToDelete,
    selectedOptions,
    question.options.options,
    setQuestion,
  ]);

  const cancelDelete = useCallback(() => {
    setShowDeleteModal(false);
    setOptionToDelete(null);
  }, []);

  const toggleOptionSelection = useCallback((index: number) => {
    setSelectedOptions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedOptions(new Set());
  }, []);
  switch (question?.questionsMeta?.questionTypeName) {
    case QUESTION_TYPES.SINGLE_MCQ:
      return (
        <div className="flex flex-col gap-3">
          {/* Selection Controls */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <div className="flex items-center gap-2">
              {selectedOptions.size > 0 && (
                <>
                  <button
                    onClick={clearSelection}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Question Options */}
          <div className="flex flex-col gap-2">
            {(function () {
              const raw = JSON.parse(question!.options.options);
              const list: string[] = Array.isArray(raw)
                ? raw
                : raw?.options ?? [];
              return list;
            })().map((option: string, index: number) => {
              // Parse current answers safely
              let currentAnswers: string[] = [];
              try {
                const parsed = JSON.parse(question!.options.answer || "[]");
                currentAnswers = Array.isArray(parsed) ? parsed : [];
              } catch {
                currentAnswers = [];
              }

              const isSelected = currentAnswers.includes(option);
              const isSelectedForDeletion = selectedOptions.has(index);

              return (
                <div
                  key={index}
                  className={clsx(
                    "border rounded-md px-4 py-2 transition-all text-sm sm:text-base relative group",
                    isSelected
                      ? "border-indigo-600 bg-indigo-100 text-indigo-900"
                      : "border-gray-300 hover:bg-gray-100",
                    isSelectedForDeletion && "ring-2 ring-red-500"
                  )}
                >
                  {/* Option content */}
                  <div
                    className="pl-6 cursor-pointer"
                    onClick={(e) => {
                      setQuestion((prev) => {
                        if (!prev) {
                          return prev; // still undefined
                        }
                        return {
                          ...prev,
                          options: {
                            ...prev.options,
                            answer: JSON.stringify([option]),
                          },
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
                </div>
              );
            })}
          </div>
        </div>
      );
    case QUESTION_TYPES.MULTIPLE_MCQ:
      const handleMultipleChoice = useCallback(
        (optionToToggle: string) => {
          setQuestion((prev) => {
            if (!prev) return prev;

            // Parse existing answers
            let answers: string[];
            try {
              answers = JSON.parse(prev.options.answer || "[]");
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
              options: {
                ...prev.options,
                answer: JSON.stringify(newAnswers),
              },
            };
          });
        },
        [setQuestion]
      );

      return (
        <div className="flex flex-col gap-3">
          {/* Selection Controls */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedOptions.size > 0
                  ? `${selectedOptions.size} selected`
                  : "Select options to delete"}
              </span>
            </div>
          </div>

          {/* Question Options */}
          <div className="flex flex-col gap-2">
            {(function () {
              const raw = JSON.parse(question!.options.options);
              const list: string[] = Array.isArray(raw)
                ? raw
                : raw?.options ?? [];
              return list;
            })().map((option: string, index: number) => {
              // Parse current answers safely
              let currentAnswers: string[] = [];
              try {
                const parsed = JSON.parse(question!.options.answer || "[]");
                currentAnswers = Array.isArray(parsed) ? parsed : [];
              } catch {
                currentAnswers = [];
              }

              const isSelected = currentAnswers.includes(option);
              const isSelectedForDeletion = selectedOptions.has(index);

              return (
                <div
                  key={`multiple-mcq-${index}-${option}`}
                  className={clsx(
                    "border rounded-md px-4 py-2 transition-all text-sm sm:text-base select-none relative group",
                    isSelected
                      ? "border-indigo-600 bg-indigo-100 text-indigo-900"
                      : "border-gray-300 hover:bg-gray-100",
                    isSelectedForDeletion && "ring-2 ring-red-500"
                  )}
                >
                  {/* Selection checkbox */}
                  <div className="absolute top-2 left-2">
                    <input
                      type="checkbox"
                      checked={isSelectedForDeletion}
                      onChange={() => toggleOptionSelection(index)}
                      className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                  </div>

                  {/* Option content */}
                  <div
                    className="pl-6 cursor-pointer"
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
                </div>
              );
            })}
          </div>

          {/* Confirmation Modal */}
          <ConfirmationModal
            isOpen={showDeleteModal}
            title={
              deleteMode === "single"
                ? "Delete Question Option"
                : "Delete Selected Options"
            }
            message={
              deleteMode === "single"
                ? "Are you sure you want to delete this question option? This action cannot be undone."
                : `Are you sure you want to delete ${selectedOptions.size} selected option(s)? This action cannot be undone.`
            }
            onConfirm={confirmDelete}
            onCancel={cancelDelete}
            variant="danger"
            confirmText={isDeleting ? "Deleting..." : "Delete"}
            cancelText="Cancel"
          />
        </div>
      );
    case QUESTION_TYPES.MATCH_PAIRS_SINGLE: {
      // Support both legacy array [[left...],[right...]] and new object {type,left,right}
      const raw = JSON.parse(question!.options.options);
      const opts = Array.isArray(raw)
        ? { left: raw[0] ?? [], right: raw[1] ?? [] }
        : { left: raw.left ?? [], right: raw.right ?? [] };

      return (
        <div className="w-full flex flex-col gap-5">
          <div className="w-full max-w-1/4 flex justify-between gap-2">
            {[opts.left, opts.right].map((option: string[], index: number) => (
              <div className="flex flex-col gap-5" key={index}>
                {option.map((col: string, idx: number) => (
                  <div key={idx}>
                    <TextOrHtml content={col} />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div>
            {opts.left.map((col: string, index: number) => (
              <div key={index}>
                <h1>{col}</h1>
                <div className="flex gap-2">
                  {opts.right.map((row: string, idx: number) => (
                    <div
                      className={`rounded-md border p-2 border-gray-300 cursor-pointer ${
                        JSON.parse(question!.options.answer)[index] === row
                          ? "border-indigo-600 bg-indigo-100 text-indigo-900"
                          : "border-gray-300 hover:bg-gray-100"
                      }`}
                      key={idx}
                      onClick={() => {
                        let updatedAnswer: string[] = JSON.parse(
                          question!.options.answer
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
                            options: {
                              ...prev.options,
                              answer: JSON.stringify(updatedAnswer),
                            },
                          };
                        });
                      }}
                    >
                      <TextOrHtml content={row} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case QUESTION_TYPES.MATCH_PAIRS_MULTIPLE:
      return (
        <div className="w-full flex flex-col gap-5">
          <div className="w-full max-w-1/4 flex justify-between gap-2">
            {(function () {
              const raw = JSON.parse(question!.options.options);
              const left: string[] = Array.isArray(raw)
                ? raw[0] ?? []
                : raw?.left ?? [];
              const right: string[] = Array.isArray(raw)
                ? raw[1] ?? []
                : raw?.right ?? [];
              return [left, right];
            })().map((option: string[], index: number) => (
              <div className="flex flex-col gap-5" key={index}>
                {option.map((col: string, idx: number) => (
                  <div key={idx}>
                    <h1>{col}</h1>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div>
            {(() => {
              const raw = JSON.parse(question!.options.options);
              const left: string[] = Array.isArray(raw)
                ? raw[0] ?? []
                : raw?.left ?? [];
              const rightList: string[] = Array.isArray(raw)
                ? raw[1] ?? []
                : raw?.right ?? [];
              return left.map((col: string, index: number) => (
                <div key={index}>
                  <h1>{col}</h1>
                  <div className="flex gap-2">
                    {rightList.map((row: string, idx: number) => (
                      <div
                        className={`rounded-md border p-2 border-gray-300 cursor-pointer ${
                          JSON.parse(question!.options.answer)[index].includes(
                            row
                          )
                            ? "border-indigo-600 bg-indigo-100 text-indigo-900"
                            : "border-gray-300 hover:bg-gray-100"
                        }`}
                        key={idx}
                        onClick={() => {
                          setQuestion((prev) => {
                            if (!prev) return prev;

                            // 1. Parse the existing 2D userAnswer array
                            const answers: string[][] = JSON.parse(
                              prev.options.answer
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
                              options: {
                                ...prev.options,
                                answer: JSON.stringify(answers),
                              },
                            };
                          });
                        }}
                      >
                        <TextOrHtml content={row} />
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
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
                  options: {
                    ...prev.options,
                    answer: e.target.value,
                  },
                };
              });
            }}
            value={question?.options.answer}
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
            value={question?.options.answer ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              // allow empty string or valid numeric/float
              if (val === "" || /^\d*\.?\d*$/.test(val)) {
                setQuestion((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    options: {
                      ...prev.options,
                      answer: val,
                    },
                  };
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
              question!.options.answer === "True"
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
                    options: {
                      ...prev.options,
                      answer: "True",
                    },
                  };
                });
              }}
            />
            True
          </label>
          <label
            className={clsx(
              "block border rounded-md px-4 py-2 cursor-pointer transition-all text-sm sm:text-base",
              question!.options.answer === "False"
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
                    options: {
                      ...prev.options,
                      answer: "False",
                    },
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
            value={question?.options.answer ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              setQuestion((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  options: {
                    ...prev.options,
                    answer: val,
                  },
                };
              });
            }}
          />
        </div>
      );

    default:
      return <div>Unknown question type.</div>;
  }
}
