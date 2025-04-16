"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import ConfirmationModal from "@/components/ConfirmationModal";

type QuestionStatus = "unattempted" | "attempted" | "review";

type QuestionType =
  | "single"
  | "multiple"
  | "match"
  | "fill"
  | "essay"
  | "number"
  | "truefalse";

interface Question {
  id: number;
  text: string;
  type: QuestionType;
  options?: string[];
  matches?: {
    left: string[];
    right: string[];
  };
  answer: any;
  selectedOption: any;
  status: QuestionStatus;
}

const mockQuestions: Question[] = [
  {
    id: 1,
    text: "What is the capital of France?",
    type: "single",
    options: ["Paris", "Rome", "Madrid", "Berlin"],
    selectedOption: null,
    answer: null,
    status: "unattempted",
  },
  {
    id: 2,
    text: "Select all prime numbers.",
    type: "multiple",
    options: ["2", "3", "4", "6"],
    selectedOption: [],
    answer: null,
    status: "unattempted",
  },
  {
    id: 3,
    text: "Match the following countries with their capitals.",
    type: "match",
    matches: {
      left: ["France", "Italy", "India"],
      right: ["Rome", "Paris", "New Delhi"],
    },
    selectedOption: {},
    answer: null,
    status: "unattempted",
  },
  {
    id: 4,
    text: "Fill in the blank: The sun rises in the ____.",
    type: "fill",
    selectedOption: "",
    answer: null,
    status: "unattempted",
  },
  {
    id: 5,
    text: "Write an essay about your favorite book.",
    type: "essay",
    selectedOption: "",
    answer: null,
    status: "unattempted",
  },
  {
    id: 6,
    text: "What is 7 + 3?",
    type: "number",
    selectedOption: "",
    answer: null,
    status: "unattempted",
  },
  {
    id: 7,
    text: "Is Earth the third planet from the sun?",
    type: "truefalse",
    options: ["True", "False"],
    selectedOption: null,
    answer: null,
    status: "unattempted",
  },
];

export default function ExamPage() {
  const { id } = useParams();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setQuestions(mockQuestions);
  }, []);

  const currentQuestion = questions[currentIndex];

  const isAllAnswersValid = (): number | null => {
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const selected = question.selectedOption;

      switch (question.type) {
        case "single":
        case "truefalse":
          if (selected === null || selected === undefined) return i;
          break;

        case "multiple":
          if (!Array.isArray(selected) || selected.length === 0) return i;
          break;

        case "match":
          const leftItems = question.matches?.left || [];
          for (const left of leftItems) {
            const matches = selected?.[left];
            if (!Array.isArray(matches) || matches.length === 0) return i;
          }
          break;

        case "fill":
        case "essay":
        case "number":
          if (!selected || selected.trim() === "") return i;
          break;

        default:
          return i;
      }
    }

    return null;
  };

  const updateAnswer = (value: any) => {
    const updated = [...questions];
    updated[currentIndex].selectedOption = value;
    updated[currentIndex].status = "attempted";
    setQuestions(updated);
  };

  const handleToggleMultiple = (index: number) => {
    const updated = [...questions];
    const selected = new Set(updated[currentIndex].selectedOption);
    selected.has(index) ? selected.delete(index) : selected.add(index);
    updated[currentIndex].selectedOption = Array.from(selected);
    updated[currentIndex].status = "attempted";
    setQuestions(updated);
  };

  const toggleMarkForReview = () => {
    const updated = [...questions];
    updated[currentIndex].status =
      updated[currentIndex].status === "review" ? "attempted" : "review";
    setQuestions(updated);
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handleJumpTo = (index: number) => {
    setCurrentIndex(index);
  };

  const handleSubmit = () => setShowModal(true);

  const confirmSubmit = () => {
    const invalidIndex = isAllAnswersValid();

    if (invalidIndex !== null) {
      setCurrentIndex(invalidIndex);
      setErrorMessage("Please answer this question before submitting.");
      setShowModal(false);
      return;
    }

    setErrorMessage(null);
    setShowModal(false);

    // Submit logic here
    router.push("/dashboard");
  };

  const cancelSubmit = () => setShowModal(false);

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case "single":
      case "truefalse":
        return currentQuestion.options?.map((option, index) => (
          <label
            key={index}
            className={clsx(
              "block border rounded-md px-4 py-2 cursor-pointer transition-all text-sm sm:text-base",
              currentQuestion.selectedOption === index
                ? "border-indigo-600 bg-indigo-100 text-indigo-900"
                : "border-gray-300 hover:bg-gray-100"
            )}
          >
            <input
              type="radio"
              name={`question-${currentQuestion.id}`}
              className="hidden"
              checked={currentQuestion.selectedOption === index}
              onChange={() => updateAnswer(index)}
            />
            {option}
          </label>
        ));
      case "multiple":
        return currentQuestion.options?.map((option, index) => (
          <label
            key={index}
            className={clsx(
              "block border rounded-md px-4 py-2 cursor-pointer transition-all text-sm sm:text-base",
              currentQuestion.selectedOption.includes(index)
                ? "border-indigo-600 bg-indigo-100 text-indigo-900"
                : "border-gray-300 hover:bg-gray-100"
            )}
          >
            <input
              type="checkbox"
              className="hidden"
              checked={currentQuestion.selectedOption.includes(index)}
              onChange={() => handleToggleMultiple(index)}
            />
            {option}
          </label>
        ));
      case "fill":
        return (
          <input
            type="text"
            placeholder="Your answer..."
            value={currentQuestion.selectedOption}
            onChange={(e) => updateAnswer(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        );
      case "essay":
        return (
          <div>
            <textarea
              rows={6}
              className="w-full border border-gray-300 rounded-md p-3"
              placeholder="Type your answer..."
              value={currentQuestion.selectedOption}
              onChange={(e) => updateAnswer(e.target.value)}
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              Word Count:{" "}
              {currentQuestion.selectedOption?.split(/\s+/).filter(Boolean)
                .length || 0}
            </div>
          </div>
        );
      case "number":
        return (
          <input
            type="number"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            value={currentQuestion.selectedOption}
            onChange={(e) => updateAnswer(e.target.value)}
          />
        );
      case "match":
        const leftItems = currentQuestion.matches?.left || [];
        const rightItems = currentQuestion.matches?.right || [];

        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        return (
          <div className="space-y-6">
            {/* Display columns */}
            <div className="w-full flex items-start gap-24">
              <div>
                <h4 className="font-semibold mb-2">Column A</h4>
                <ul className="space-y-1">
                  {leftItems.map((item, index) => (
                    <li key={index}>
                      <span className="font-medium">{index + 1}.</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Column B</h4>
                <ul className="space-y-1">
                  {rightItems.map((item, index) => (
                    <li key={index}>
                      <span className="font-medium">{alphabet[index]}.</span>{" "}
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Answer selection */}
            <div className="space-y-4">
              {leftItems.map((item, i) => {
                const selected = new Set(
                  currentQuestion.selectedOption?.[item] || []
                );

                const toggleMatch = (letter: string) => {
                  const newSelection = new Set(selected);
                  newSelection.has(letter)
                    ? newSelection.delete(letter)
                    : newSelection.add(letter);

                  updateAnswer({
                    ...currentQuestion.selectedOption,
                    [item]: Array.from(newSelection),
                  });
                };

                return (
                  <div key={i}>
                    <div className="font-medium mb-1">
                      {i + 1}. {item}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {rightItems.map((_, j) => {
                        const letter = alphabet[j];
                        const isChecked = selected.has(letter);

                        return (
                          <label
                            key={j}
                            className={clsx(
                              "flex items-center gap-2 px-3 py-1 border rounded-md cursor-pointer transition-all",
                              isChecked
                                ? "bg-indigo-100 border-indigo-500 text-indigo-900"
                                : "bg-white border-gray-300 hover:bg-gray-50"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleMatch(letter)}
                              className="hidden"
                            />
                            {letter}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      default:
        return <div>Unknown question type.</div>;
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-gray-100">
      {/* Sidebar */}
      <aside className="md:w-64 w-full bg-white border-b md:border-r border-gray-300 p-4 md:p-6 shadow-md flex flex-col gap-2">
        <div className="flex flex-col gap-2">
          <div>
            <h1 className="font-bold text-2xl">Questions</h1>
          </div>
          <div className="grid grid-cols-8 md:grid-cols-5 gap-2 mb-4">
            {questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => handleJumpTo(index)}
                className={clsx(
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-md font-semibold text-xs sm:text-sm transition-colors cursor-pointer",
                  q.status === "unattempted" &&
                    "bg-gray-300 text-gray-700 hover:bg-gray-400",
                  q.status === "attempted" &&
                    "bg-green-500 text-white hover:bg-green-600",
                  q.status === "review" &&
                    "bg-purple-500 text-white hover:bg-purple-600",
                  index === currentIndex && "border-3 border-indigo-500"
                )}
              >
                {q.id}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div>
            <h1 className="font-bold text-2xl">Legend</h1>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-gray-300 rounded-full inline-block" />
              <span>Unattempted</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full inline-block" />
              <span>Attempted</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-purple-500 rounded-full inline-block" />
              <span>Review</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-4 sm:p-6">
        {currentQuestion && (
          <div className="bg-white p-4 sm:p-6 rounded-md shadow-md border border-gray-300 space-y-4">
            <h2 className="text-md sm:text-lg font-semibold text-gray-800">
              {currentQuestion.text}
            </h2>
            {errorMessage && (
              <div className="mb-4 text-sm text-red-600 font-medium">
                {errorMessage}
              </div>
            )}
            <div className="space-y-3">{renderQuestion()}</div>
            <div className="flex items-center justify-between gap-4 mt-4">
              <button
                onClick={toggleMarkForReview}
                className={clsx(
                  "w-full md:w-fit px-4 py-2 rounded-md font-medium text-white cursor-pointer",
                  currentQuestion.status === "review"
                    ? "bg-gray-500 hover:bg-gray-600"
                    : "bg-purple-500 hover:bg-purple-600"
                )}
              >
                {currentQuestion.status === "review"
                  ? "Unmark Review"
                  : "Mark for Review"}
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={handleNextQuestion}
                  disabled={
                    currentQuestion.status === "unattempted" &&
                    !["review"].includes(currentQuestion.status)
                  }
                  className={clsx(
                    "w-full md:w-fit px-6 py-2 rounded-md font-medium text-white transition cursor-pointer",
                    currentQuestion.status === "unattempted"
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  )}
                >
                  Next Question
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium cursor-pointer"
                >
                  Submit Exam
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      <ConfirmationModal
        isOpen={showModal}
        title="Submit Exam?"
        message="Are you sure you want to submit the exam? You won't be able to change your answers after this."
        onConfirm={confirmSubmit}
        onCancel={cancelSubmit}
      />
    </div>
  );
}
