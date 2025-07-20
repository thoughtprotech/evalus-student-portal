"use client";

import { useEffect, useState } from "react";
import RichTextEditor from "@/components/RichTextEditor";
import { QUESTION_TYPES } from "@/utils/constants";
import QuestionOptionsInput from "./_components/QuestionOptionsInput";
import { createQuestionAction } from "@/app/actions/dashboard/questions/createQuestion";
import toast from "react-hot-toast";
import { GetQuestionTypesResponse } from "@/utils/api/types";
import { getQuestionTypesAction } from "@/app/actions/dashboard/questions/getQuestionTypes";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Index() {
  const [testId, setTestId] = useState<number>();
  const [question, setQuestion] = useState<string>("");
  const [questionType, setQuestionType] = useState<
    (typeof QUESTION_TYPES)[keyof typeof QUESTION_TYPES]
  >(QUESTION_TYPES.SINGLE_MCQ);
  const [questionOptions, setQuestionOptions] = useState<{
    options: any;
    answer: any;
  }>();
  const [questionTypes, setQuestionTypes] = useState<
    GetQuestionTypesResponse[]
  >([]);

  const fetchQuestionTypes = async () => {
    const res = await getQuestionTypesAction();
    const { data, status, error, errorMessage, message } = res;
    if (status === 200) {
      setQuestionTypes(data!);
      // setTestList(data);
    } else {
      console.log({ status, error, errorMessage });
    }
  };

  useEffect(() => {
    fetchQuestionTypes();
  }, []);

  const handleSubmit = async () => {
    // Safely stringify options (always an array)
    const stringifiedOptions = JSON.stringify(questionOptions?.options);

    // Conditionally stringify answers only if it's an array
    const stringifiedAnswer = Array.isArray(questionOptions?.answer)
      ? JSON.stringify(questionOptions.answer)
      : questionOptions?.answer;

    console.log("Submitting Question:", {
      testId,
      questionType,
      question,
      options: {
        options: stringifiedOptions,
        answer: stringifiedAnswer,
      },
    });

    console.log(
      "Options (stringified):",
      stringifiedOptions,
      typeof stringifiedOptions
    );
    console.log("Answer:", stringifiedAnswer, typeof stringifiedAnswer);

    const res = await createQuestionAction(
      Number(testId),
      questionType,
      question,
      stringifiedOptions,
      stringifiedAnswer
    );
    const { status, error, errorMessage, message } = res;
    if (status === 200) {
      toast.success(message!);
      // setTestList(data);
    } else {
      toast.error(errorMessage!);
      console.log({ status, error, errorMessage });
    }
  };

  useEffect(() => {
    console.log({ questionType });
  }, [questionType]);

  return (
    <div className="w-full min-h-screen h-full overflow-y-auto bg-gray-100 flex justify-center p-4">
      <div className="w-full space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <Link href={"/admin/questions"}>
                <ArrowLeft />
              </Link>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Create Question
              </h1>
            </div>
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
                className="px-3 py-2 w-full border border-gray-300 rounded-xl focus:outline-none bg-white"
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
                className="px-3 py-2 w-full border border-gray-300 rounded-xl focus:outline-none bg-white"
              >
                {questionTypes?.map((questionType) => (
                  <option
                    key={questionType.questionType}
                    value={questionType.questionType}
                  >
                    {questionType.questionType}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 border border-indigo-300 rounded-xl text-sm hover:bg-indigo-600 transition bg-indigo-500 text-white cursor-pointer font-bold"
            >
              Create Question
            </button>
          </div>
        </div>

        {/* Inputs */}

        {/* Split View */}
        <div className="flex gap-4 min-h-[70vh] h-fit">
          <div
            className={`flex-1 flex flex-col border border-gray-200 rounded-xl p-4 bg-white shadow`}
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
            className={`flex-1 flex flex-col border border-gray-200 rounded-xl p-4 bg-white shadow`}
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
