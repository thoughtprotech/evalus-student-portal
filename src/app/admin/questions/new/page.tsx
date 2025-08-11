"use client";

import { useEffect, useState } from "react";
import RichTextEditor from "@/components/RichTextEditor";
import { QUESTION_TYPES } from "@/utils/constants";
import QuestionOptionsInput from "./_components/QuestionOptionsInput";
import { createQuestionAction } from "@/app/actions/dashboard/questions/createQuestion";
import toast from "react-hot-toast";
import {
  CreateQuestionRequest,
  GetDifficultyLevelsResponse,
  GetLanguagesResponse,
  GetQuestionTypesResponse,
  GetSubjectsResponse,
  GetTopicsResponse,
  GetWriteUpsResponse,
} from "@/utils/api/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { fetchSubjectsAction } from "@/app/actions/dashboard/questions/fetchSubjects";
import { fetchQuestionTypesAction } from "@/app/actions/dashboard/questions/fetchQuestionTypes";
import { fetchTopicsAction } from "@/app/actions/dashboard/questions/fetchTopics";
import { fetchLanguagesAction } from "@/app/actions/dashboard/questions/fetchLanguages";
import Accordion from "@/components/Accordion";
import { useRouter } from "next/navigation";
import { fetchWriteUpsAction } from "@/app/actions/dashboard/spotlight/fetchWriteUps";
import { fetchDifficultyLevelsAction } from "@/app/actions/dashboard/questions/fetchDifficultyLevels";

export default function Index() {
  const [question, setQuestion] = useState<string>("");
  const [questionsMeta, setQuestionsMeta] = useState<{
    tags: string;
    marks: number;
    negativeMarks: number;
    difficulty: number;
    questionType: number;
    subjectId: number;
    topicId: number;
    languageId: string;
    writeUpId: number;
  }>({
    tags: "",
    marks: 0,
    negativeMarks: 0,
    difficulty: 0,
    questionType: 0,
    subjectId: 0,
    topicId: 0,
    languageId: "",
    writeUpId: 0,
  });
  const [explanation, setExplanation] = useState<string>("");
  const [questionHeader, setQuestionHeader] = useState<string>("");
  const [videoSolURL, setVideoSolURL] = useState<string>("");
  const [questionOptions, setQuestionOptions] = useState<{
    options: any;
    answer: any;
  }>();

  const [questionTypes, setQuestionTypes] = useState<GetQuestionTypesResponse[]>([]);
  const [subjects, setSubjects] = useState<GetSubjectsResponse[]>([]);
  const [topics, setTopics] = useState<GetTopicsResponse[]>([]);
  const [languages, setLanguages] = useState<GetLanguagesResponse[]>([]);
  const [writeUps, setWriteUps] = useState<GetWriteUpsResponse[]>([]);
  const [difficultyLevels, setDifficultyLevels] = useState<GetDifficultyLevelsResponse[]>([]);

  const router = useRouter();

  const fetchQuestionTypes = async () => {
    const res = await fetchQuestionTypesAction();
    const { data, status, error, errorMessage } = res;
    if (status === 200) {
      setQuestionTypes(data!);
      setQuestionsMeta((prev) => {
        const updated = { ...prev };
        updated.questionType = data![0].questionTypeId;
        return updated;
      });
    } else {
      console.log({ status, error, errorMessage });
    }
  };

  const fetchSubjects = async () => {
    const res = await fetchSubjectsAction();
    const { data, status, error, errorMessage } = res;
    if (status === 200) {
      setSubjects(data!);
      setQuestionsMeta((prev) => {
        const updated = { ...prev };
        updated.subjectId = data![0].subjectId;
        return updated;
      });
      fetchTopics(data![0].subjectId);
    } else {
      console.log({ status, error, errorMessage });
    }
  };

  const fetchTopics = async (subjectId: number) => {
    const res = await fetchTopicsAction(subjectId);
    const { data, status, error, errorMessage } = res;
    if (status === 200) {
      setTopics(data!);
      setQuestionsMeta((prev) => {
        const updated = { ...prev };
        updated.topicId = data![0].topicId;
        return updated;
      });
    } else {
      console.log({ status, error, errorMessage });
    }
  };

  const fetchLanguages = async () => {
    const res = await fetchLanguagesAction();
    const { data, status, error, errorMessage } = res;
    if (status === 200) {
      setLanguages(data!);
      setQuestionsMeta((prev) => {
        const updated = { ...prev };
        updated.languageId = data![0].language;
        return updated;
      });
    } else {
      console.log({ status, error, errorMessage });
    }
  };

  const fetchWriteUps = async () => {
    const res = await fetchWriteUpsAction();
    const { data, status, error, errorMessage } = res;
    if (status === 200) {
      setWriteUps(data!);
    } else {
      console.log({ status, error, errorMessage });
    }
  };

  const fetchDifficultyLevels = async () => {
    const res = await fetchDifficultyLevelsAction();
    const { data, status, error, errorMessage } = res;
    if (status === 200) {
      setDifficultyLevels(data!);
      setQuestionsMeta((prev) => {
        const updated = { ...prev };
        updated.difficulty = data![0].questionDifficultylevelId;
        return updated;
      });
    } else {
      console.log({ status, error, errorMessage });
    }
  };

  useEffect(() => {
    fetchQuestionTypes();
    fetchSubjects();
    fetchLanguages();
    fetchWriteUps();
    fetchDifficultyLevels();
  }, []);

  const handleSubmit = async (goBack: boolean = true) => {
    // Safely stringify options (always an array)
    const stringifiedOptions = JSON.stringify(questionOptions?.options);

    // Conditionally stringify answers only if it's an array
    const stringifiedAnswer = Array.isArray(questionOptions?.answer)
      ? JSON.stringify(questionOptions.answer)
      : questionOptions?.answer;

    if (questionsMeta.topicId === 0) {
      return toast.error("Topic Is Required");
    }

    if (questionsMeta.languageId === "") {
      return toast.error("Language Is Required");
    }

    if (question.length === 0) {
      return toast.error("Question Is Required");
    }

    if (questionsMeta.marks === 0) {
      return toast.error("Marks Is Required");
    }

    if (stringifiedOptions?.length === 0 || stringifiedOptions === "[]") {
      return toast.error("Options Are Required");
    }

    if (stringifiedAnswer?.length === 0 || stringifiedAnswer === "[]") {
      return toast.error("Answer Is Required");
    }

    const payload: CreateQuestionRequest = {
      explanation: explanation,
      videoSolURL: videoSolURL,
      questionsMeta: {
        tags: questionsMeta.tags,
        marks: questionsMeta.marks,
        negativeMarks: questionsMeta.negativeMarks,
        difficultyLevelId: questionsMeta.difficulty,
        questionTypeId: questionsMeta.questionType,
        subjectId: questionsMeta.subjectId,
        topicId: questionsMeta.topicId,
        language: questionsMeta.languageId,
        writeUpId: questionsMeta.writeUpId,
        headerText: questionHeader,
      },
      question: question,
      options: {
        options: stringifiedOptions!,
        answer: stringifiedAnswer!,
      },
    };

    console.log({ payload });

    const res = await createQuestionAction(payload);

    const { data, status, error, errorMessage } = res;

    if (status === 201 || status === 200) {
      toast.success("Question Created Successfully");
      if (goBack) {
        setTimeout(() => {
          router.back();
        }, 2000);
      }
    } else {
      toast.error(errorMessage || "Failed to create question");
      console.log({ status, error, errorMessage });
    }
  };

  const handleSaveAndNew = async () => {
    await handleSubmit(false);
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  useEffect(() => {
    console.log({ questionsMeta });
  }, [questionsMeta]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/admin/questions" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-semibold">Create Question</h1>
            </div>
            <Link href="/admin/questions" className="text-sm text-blue-600 hover:underline">Back to Questions</Link>
          </div>

          {/* Question Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language <span className="text-red-600">*</span></label>
              <select
                required
                value={questionsMeta?.languageId}
                onChange={(e) => {
                  setQuestionsMeta(() => {
                    let updated = { ...questionsMeta };
                    updated.languageId = e.target.value;
                    return updated;
                  });
                }}
                className="w-full border rounded-md px-4 py-3"
              >
                <option value="">Select language</option>
                {languages?.map((language) => (
                  <option key={language.language} value={language.language}>
                    {language.language}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject <span className="text-red-600">*</span></label>
              <select
                required
                value={questionsMeta?.subjectId}
                onChange={(e) => {
                  setQuestionsMeta(() => {
                    let updated = { ...questionsMeta };
                    updated.subjectId = Number(e.target.value);
                    return updated;
                  });
                  fetchTopics(Number(e.target.value));
                }}
                className="w-full border rounded-md px-4 py-3"
              >
                <option value="">Select subject</option>
                {subjects?.map((subject) => (
                  <option key={subject.subjectId} value={subject.subjectId}>
                    {subject.subjectName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Topic <span className="text-red-600">*</span></label>
              <select
                required
                value={questionsMeta?.topicId}
                onChange={(e) => {
                  setQuestionsMeta(() => {
                    let updated = { ...questionsMeta };
                    updated.topicId = Number(e.target.value);
                    return updated;
                  });
                }}
                className="w-full border rounded-md px-4 py-3"
              >
                <option value="">Select topic</option>
                {topics?.map((topic) => (
                  <option key={topic.topicId} value={topic.topicId}>
                    {topic.topicName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question Type <span className="text-red-600">*</span></label>
              <select
                required
                value={questionsMeta?.questionType}
                onChange={(e) => {
                  setQuestionsMeta(() => {
                    let updated = { ...questionsMeta };
                    updated.questionType = Number(e.target.value);
                    return updated;
                  });
                }}
                className="w-full border rounded-md px-4 py-3"
              >
                <option value="">Select type</option>
                {questionTypes?.map((questionType) => (
                  <option
                    key={questionType.questionTypeId}
                    value={questionType.questionTypeId}
                  >
                    {questionType.questionType}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Main Content Area with Accordions */}
          <div className="space-y-6">
            {/* Question Content Section */}
            <Accordion title="Type Your Question" open={true}>
              <div className="space-y-6 p-4">
                <div>
                  <RichTextEditor
                    onChange={(content) => setQuestion(content)}
                    initialContent={question}
                    placeholder="Type your question here..."
                  />
                </div>
              </div>
            </Accordion>

            {/* Question Options Section */}
            <Accordion title="Question Options" open={true}>
              <div className="space-y-6 p-4">
                <QuestionOptionsInput
                  questionTypeId={questionsMeta?.questionType}
                  questionTypes={questionTypes}
                  onDataChange={(data) => setQuestionOptions(data)}
                />
              </div>
            </Accordion>

            {/* Add Explanation Section */}
            <Accordion title="Add Explanation">
              <div className="space-y-6 p-4">
                <RichTextEditor
                  onChange={(content) => setExplanation(content)}
                  initialContent={explanation}
                  placeholder="Add explanation for the correct answer..."
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Video Solution URL</label>
                  <input
                    placeholder="Enter video URL"
                    className="w-full border rounded-md px-4 py-3"
                    onChange={(e) => setVideoSolURL(e.target.value)}
                    value={videoSolURL}
                  />
                </div>
              </div>
            </Accordion>

            {/* Advanced Options Section */}
            <Accordion title="Advanced Options">
              <div className="space-y-6 p-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <input
                    placeholder="Add a tag"
                    className="w-full border rounded-md px-4 py-3"
                    onChange={(e) => {
                      setQuestionsMeta(() => {
                        let updated = { ...questionsMeta };
                        updated.tags = e.target.value;
                        return updated;
                      });
                    }}
                    value={questionsMeta.tags}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Right Marks <span className="text-red-600">*</span></label>
                    <input
                      required
                      type="number"
                      min={0}
                      placeholder="Enter marks"
                      className="w-full border rounded-md px-4 py-3"
                      onChange={(e) => {
                        setQuestionsMeta(() => {
                          let updated = { ...questionsMeta };
                          updated.marks = Number(e.target.value);
                          return updated;
                        });
                      }}
                      value={questionsMeta.marks || ''}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Negative Marks</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="Enter negative marks"
                      className="w-full border rounded-md px-4 py-3"
                      onChange={(e) => {
                        setQuestionsMeta(() => {
                          let updated = { ...questionsMeta };
                          updated.negativeMarks = Number(e.target.value);
                          return updated;
                        });
                      }}
                      value={questionsMeta.negativeMarks || ''}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level <span className="text-red-600">*</span></label>
                    <select
                      required
                      className="w-full border rounded-md px-4 py-3"
                      value={questionsMeta?.difficulty}
                      onChange={(e) => {
                        setQuestionsMeta(() => {
                          let updated = { ...questionsMeta };
                          updated.difficulty = Number(e.target.value);
                          return updated;
                        });
                      }}
                    >
                      <option value="">Select Difficulty</option>
                      {difficultyLevels?.map((level) => (
                        <option
                          key={level.questionDifficultylevelId}
                          value={level.questionDifficultylevelId}
                        >
                          {level.questionDifficultylevel1}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Option Marks</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      className="w-full border rounded-md px-4 py-3"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Free Space</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      className="w-full border rounded-md px-4 py-3"
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Write Up</label>
                  <select
                    value={questionsMeta?.writeUpId}
                    onChange={(e) => {
                      setQuestionsMeta(() => {
                        let updated = { ...questionsMeta };
                        updated.writeUpId = Number(e.target.value);
                        return updated;
                      });
                    }}
                    className="w-full border rounded-md px-4 py-3"
                  >
                    <option value="">None</option>
                    {writeUps?.map((writeUp) => (
                      <option
                        key={writeUp.writeUpId}
                        value={writeUp.writeUpId}
                      >
                        {writeUp.writeUpName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Accordion>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-8 border-t border-gray-200">
            <button
              onClick={() => handleSubmit()}
              className="px-6 py-3 rounded-md bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700"
            >
              Save Question
            </button>
            <button
              onClick={handleSaveAndNew}
              className="px-6 py-3 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-50"
            >
              Save & New
            </button>
      </div>
        </div>
      </div>
    </div>
  );
}
