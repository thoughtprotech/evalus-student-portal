"use client";

import { useState } from "react";
import RichTextEditor from "@/components/RichTextEditor";
import { QUESTION_TYPES } from "@/utils/constants";
import QuestionOptionsInput from "./_components/QuestionOptionsInput";

export default function Index() {
  const [testId, setTestId] = useState<number>();
  const [question, setQuestion] = useState<string>("");
  const [questionType, setQuestionType] = useState<
    (typeof QUESTION_TYPES)[keyof typeof QUESTION_TYPES]
  >(QUESTION_TYPES.SINGLE_MCQ);
  const [questionOptions, setQuestionOptions] = useState<any>(null);

  const handleSubmit = () => {
    console.log("Submitting Question:", {
      testId,
      questionType,
      question,
      options: questionOptions,
    });
  };

  return (
    <div className="w-full min-h-screen h-full overflow-y-auto bg-gray-100 flex justify-center px-4 py-8">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Upload Question
            </h1>
          </div>
          <div className="flex gap-2 items-end">
            <div className="space-y-1">
              <label
                htmlFor="test-id"
                className="text-sm font-medium text-gray-700"
              >
                Test ID
              </label>
              <input
                id="test-id"
                type="number"
                onChange={(e) => setTestId(Number(e.target.value))}
                value={testId ?? ""}
                className="px-3 py-2 w-full border border-gray-300 rounded-md focus:outline-none bg-white"
                placeholder="Enter test ID"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="question-type"
                className="text-sm font-medium text-gray-700"
              >
                Question Type
              </label>
              <select
                id="question-type"
                value={questionType}
                onChange={(e) =>
                  setQuestionType(e.target.value as typeof questionType)
                }
                className="px-3 py-2 w-full border border-gray-300 rounded-md focus:outline-none bg-white"
              >
                {Object.entries(QUESTION_TYPES).map(([key, label]) => (
                  <option key={key} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 border border-blue-300 rounded-md text-sm hover:bg-blue-600 transition bg-blue-500 text-white cursor-pointer font-bold"
            >
              Create Question
            </button>
          </div>
        </div>

        {/* Inputs */}

        {/* Split View */}
        <div className="flex gap-4 min-h-[70vh] h-fit">
          <div
            className={`flex-1 flex flex-col border border-gray-200 rounded-lg p-4 bg-white shadow`}
          >
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Editor</h2>
            <div className="flex-1">
              <RichTextEditor
                onChange={(content) => setQuestion(content)}
                initialContent={question}
              />
            </div>
          </div>

          {/* Options Configurator instead of Preview */}
          <div
            className={`flex-1 flex flex-col border border-gray-200 rounded-lg p-4 bg-white shadow`}
          >
            <h2 className="text-xl font-semibold mb-2 text-gray-800">
              Options Setup
            </h2>
            <QuestionOptionsInput
              type={questionType}
              onDataChange={(data) => setQuestionOptions(data)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
