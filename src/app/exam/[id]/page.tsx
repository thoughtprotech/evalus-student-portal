"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import ConfirmationModal from "@/components/ConfirmationModal";

type QuestionStatus = "unattempted" | "attempted" | "review";

interface Question {
  id: number;
  text: string;
  options: string[];
  selectedOption: number | null;
  status: QuestionStatus;
}

const mockQuestions: Question[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  text: `Question ${i + 1}: What is the answer to question ${i + 1}?`,
  options: ["Option A", "Option B", "Option C", "Option D"],
  selectedOption: null,
  status: "unattempted",
}));

export default function ExamPage() {
  const { id } = useParams();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setQuestions(mockQuestions);
  }, []);

  const currentQuestion = questions[currentIndex];

  const handleOptionSelect = (optionIndex: number) => {
    const updated = [...questions];
    updated[currentIndex].selectedOption = optionIndex;
    updated[currentIndex].status = "attempted";
    setQuestions(updated);
  };

  const toggleMarkForReview = () => {
    const updated = [...questions];
    updated[currentIndex].status =
      updated[currentIndex].status === "review" ? "attempted" : "review";
    setQuestions(updated);
  };

  const handleJumpTo = (index: number) => {
    setCurrentIndex(index);
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSubmit = () => {
    setShowModal(true);
  };

  const confirmSubmit = () => {
    setShowModal(false);
    // Submit logic here
    router.push("/dashboard");
  };

  const cancelSubmit = () => {
    setShowModal(false);
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-gray-100">
      {/* Sidebar */}
      <aside className="md:w-64 w-full bg-white border-b md:border-b-0 md:border-r border-gray-300 p-4 md:p-6 shadow-md">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg md:text-xl font-bold text-gray-800">
              Question Panel
            </h2>
            <div className="grid grid-cols-8 gap-4 md:grid-cols-5">
              {questions.map((q, index) => (
                <button
                  key={q.id}
                  onClick={() => handleJumpTo(index)}
                  className={clsx(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-full font-semibold text-xs sm:text-sm transition-colors cursor-pointer",
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
              <h2 className="text-lg md:text-xl font-bold text-gray-800">
                Legend
              </h2>
            </div>
            <div className="flex justify-between md:flex md:flex-col gap-2 text-sm">
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
                <span>Marked for Review</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6">
        {/* <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
          Exam ID: {id}
        </h1> */}

        {currentQuestion && (
          <div className="bg-white p-4 sm:p-6 rounded-md shadow-md border border-gray-300 space-y-4">
            <h2 className="text-md sm:text-lg font-semibold text-gray-800">
              {currentQuestion.text}
            </h2>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
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
                    onChange={() => handleOptionSelect(index)}
                  />
                  {option}
                </label>
              ))}
            </div>

            <div className="flex items-center justify-between gap-4">
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
                  disabled={currentQuestion.selectedOption === null}
                  className={clsx(
                    "w-full md:w-fit px-6 py-2 rounded-md font-medium text-white transition cursor-pointer",
                    currentQuestion.selectedOption === null
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

      {/* Confirmation Modal */}
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
