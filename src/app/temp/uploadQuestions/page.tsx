"use client";

import { useState } from "react";
import RichTextEditor from "@/components/RichTextEditor";
import { TextOrHtml } from "@/components/TextOrHtml";
import { Columns2, Eye, EyeOff } from "lucide-react";
import { QUESTION_TYPES } from "@/utils/constants";

export default function Index() {
  const [testId, setTestId] = useState<number>();
  const [question, setQuestion] = useState<string>("");
  const [questionType, setQuestionType] = useState<
    (typeof QUESTION_TYPES)[keyof typeof QUESTION_TYPES]
  >(QUESTION_TYPES.SINGLE_MCQ);
  const [viewMode, setViewMode] = useState<"split" | "editor" | "preview">(
    "split"
  );

  const toggleView = () => {
    if (viewMode === "split") setViewMode("editor");
    else if (viewMode === "editor") setViewMode("preview");
    else setViewMode("split");
  };

  const handleSubmit = () => {
    console.log("Submitting Question:");
    console.log({ testId, questionType, question });
  };

  return (
    <div className="w-full min-h-screen bg-gray-100 flex justify-center px-4 py-8">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">Upload Question</h1>
          <div className="flex gap-2">
            <button
              onClick={toggleView}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-200 transition bg-white cursor-pointer"
            >
              {viewMode === "split" && <Columns2 size={18} />}
              {viewMode === "editor" && <Eye size={18} />}
              {viewMode === "preview" && <EyeOff size={18} />}
              <span className="capitalize">{viewMode} view</span>
            </button>
            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 border border-blue-300 rounded-md text-sm hover:bg-blue-600 transition bg-blue-500 text-white cursor-pointer"
            >
              Create Question
            </button>
          </div>
        </div>

        {/* Inputs Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          {/* Test ID */}
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
              className="px-3 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter test ID"
            />
          </div>

          {/* Question Type */}
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
              className="px-3 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            >
              {Object.entries(QUESTION_TYPES).map(([key, label]) => (
                <option key={key} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Editor & Preview */}
        <div className="flex gap-4 h-[70vh]">
          {/* Editor */}
          <div
            className={`flex-1 flex flex-col border border-gray-200 rounded-lg p-4 bg-white shadow ${
              viewMode === "preview" ? "hidden" : ""
            }`}
          >
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Editor</h2>
            <div className="flex-1 overflow-y-auto">
              <RichTextEditor
                onChange={(content) => setQuestion(content)}
                initialContent={question}
              />
            </div>
          </div>

          {/* Preview */}
          <div
            className={`flex-1 flex flex-col border border-gray-200 rounded-lg p-4 bg-white shadow ${
              viewMode === "editor" ? "hidden" : ""
            }`}
          >
            <h2 className="text-xl font-semibold mb-2 text-gray-800">
              Preview
            </h2>
            <div className="flex-1 overflow-y-auto">
              <TextOrHtml content={question} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
