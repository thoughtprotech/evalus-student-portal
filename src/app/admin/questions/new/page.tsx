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

  const [questionTypes, setQuestionTypes] = useState<
    GetQuestionTypesResponse[]
  >([]);
  const [subjects, setSubjects] = useState<GetSubjectsResponse[]>([]);
  const [topics, setTopics] = useState<GetTopicsResponse[]>([]);
  const [languages, setLanguages] = useState<GetLanguagesResponse[]>([]);
  const [writeUps, setWriteUps] = useState<GetWriteUpsResponse[]>([]);
  const [difficultyLevels, setDifficultyLevels] = useState<
    GetDifficultyLevelsResponse[]
  >([]);

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
        updated.topicId = data![0].subjectId;
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
      explanation,
      options: {
        options: stringifiedOptions,
        answer: stringifiedAnswer,
      },
      question,
      questionsMeta: {
        difficultyLevelId: questionsMeta.difficulty,
        language: questionsMeta.languageId,
        marks: questionsMeta.marks,
        negativeMarks: questionsMeta.negativeMarks,
        questionTypeId: questionsMeta.questionType,
        subjectId: questionsMeta.subjectId,
        tags: questionsMeta.tags,
        topicId: questionsMeta.topicId,
        writeUpId:
          questionsMeta.writeUpId !== 0 ? questionsMeta.writeUpId : null,
        headerText: questionHeader.length !== 0 ? questionHeader : null,
      },
      videoSolURL,
    };

    console.log({ payload });

    const res = await createQuestionAction(payload);
    const { status, error, errorMessage, message } = res;
    if (status === 201) {
      toast.success(message!);

      if (goBack) {
        router.push("/admin/questions");
      }
    } else {
      toast.error(errorMessage!);
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
          <div className="w-full max-w-3/4 flex gap-2 items-end">
            <div className="w-full space-y-1">
              <label
                htmlFor="question-type"
                className="text-sm font-medium text-gray-700"
              >
                Language
              </label>
              <select
                id="question-type"
                value={questionsMeta?.languageId}
                onChange={(e) => {
                  setQuestionsMeta(() => {
                    let updated = { ...questionsMeta };
                    updated.languageId = e.target.value;
                    return updated;
                  });
                }}
                className="px-3 py-2 w-full border border-gray-300 rounded-xl focus:outline-none bg-white"
              >
                {languages?.map((language) => (
                  <option key={language.language} value={language.language}>
                    {language.language}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full space-y-1">
              <label
                htmlFor="question-type"
                className="text-sm font-medium text-gray-700"
              >
                Subject
              </label>
              <select
                id="question-type"
                value={questionsMeta?.subjectId}
                onChange={(e) => {
                  setQuestionsMeta(() => {
                    let updated = { ...questionsMeta };
                    updated.subjectId = Number(e.target.value);
                    return updated;
                  });
                  fetchTopics(Number(e.target.value));
                }}
                className="px-3 py-2 w-full border border-gray-300 rounded-xl focus:outline-none bg-white"
              >
                {subjects?.map((subject) => (
                  <option key={subject.subjectId} value={subject.subjectId}>
                    {subject.subjectName}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full space-y-1">
              <label
                htmlFor="question-type"
                className="text-sm font-medium text-gray-700"
              >
                Topic
              </label>
              <select
                id="question-type"
                value={questionsMeta?.topicId}
                onChange={(e) => {
                  setQuestionsMeta(() => {
                    let updated = { ...questionsMeta };
                    updated.topicId = Number(e.target.value);
                    return updated;
                  });
                }}
                className="px-3 py-2 w-full border border-gray-300 rounded-xl focus:outline-none bg-white"
              >
                {topics?.map((topic) => (
                  <option key={topic.subjectId} value={topic.subjectId}>
                    {topic.subjectName}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full space-y-1">
              <label
                htmlFor="question-type"
                className="text-sm font-medium text-gray-700"
              >
                Question Type
              </label>
              <select
                id="question-type"
                value={questionsMeta?.questionType}
                onChange={(e) => {
                  setQuestionsMeta(() => {
                    let updated = { ...questionsMeta };
                    updated.questionType = Number(e.target.value);
                    return updated;
                  });
                }}
                className="px-3 py-2 w-full border border-gray-300 rounded-xl focus:outline-none bg-white"
              >
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
            <button
              onClick={() => handleSubmit()}
              className="w-fit whitespace-nowrap flex items-center justify-center gap-2 px-4 py-2 border border-indigo-300 rounded-xl text-sm hover:bg-indigo-600 transition bg-indigo-500 text-white cursor-pointer font-bold"
            >
              Save
            </button>
            <button
              onClick={handleSaveAndNew}
              className="w-fit whitespace-nowrap flex items-center justify-center gap-2 px-4 py-2 border border-indigo-300 rounded-xl text-sm hover:bg-indigo-600 transition bg-indigo-500 text-white cursor-pointer font-bold"
            >
              Save & New
            </button>
          </div>
        </div>

        {/* Inputs */}

        {/* Split View */}
        <div className="flex gap-4 min-h-[70vh] h-fit">
          <div
            className={`flex-1 flex flex-col gap-5 border border-gray-200 rounded-xl p-4 bg-white shadow`}
          >
            <Accordion title="Directions">
              <div className={`flex-1 flex flex-col rounded-xl`}>
                <div className="flex-1">
                  <RichTextEditor
                    onChange={(content) => setQuestionHeader(content)}
                    initialContent={questionHeader}
                  />
                </div>
              </div>
            </Accordion>
            <div className={`flex-1 flex flex-col rounded-xl`}>
              <h2 className="text-xl font-semibold mb-2 text-gray-800">
                Question
              </h2>
              <div className="flex-1">
                <RichTextEditor
                  onChange={(content) => setQuestion(content)}
                  initialContent={question}
                />
              </div>
            </div>
            <div className={`flex-1 flex flex-col rounded-xl`}>
              <h1 className="text-xl font-semibold mb-2 text-gray-800">
                Answers
              </h1>
              <QuestionOptionsInput
                questionTypeId={questionsMeta?.questionType}
                questionTypes={questionTypes}
                onDataChange={(data) => setQuestionOptions(data)}
              />
            </div>
          </div>

          {/* Options Configurator instead of Preview */}
          <div
            className={`flex-1 flex flex-col border border-gray-200 rounded-xl p-4 bg-white shadow`}
          >
            <Accordion title="Explanation" open={true}>
              <div className="flex flex-col gap-2">
                <div className={`flex-1 flex flex-col rounded-xl`}>
                  {/* <h2 className="text-xl font-semibold mb-2 text-gray-800">
                  Explanation
                </h2> */}
                  <div className="flex-1">
                    <RichTextEditor
                      onChange={(content) => setExplanation(content)}
                      initialContent={explanation}
                    />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2 text-gray-800">
                    Video Solution URL
                  </h2>
                  <input
                    placeholder="Enter URL"
                    className="w-full rounded-xl border border-gray-300 shadow-md px-4 py-2"
                    onChange={(e) => setVideoSolURL(e.target.value)}
                    value={videoSolURL}
                  />
                </div>
              </div>
            </Accordion>
            <Accordion title="Advance Options">
              <div>
                <div className="flex flex-col gap-4">
                  <div>
                    <h1>Tags</h1>
                    <input
                      placeholder="Enter Tags"
                      className="w-full rounded-xl border border-gray-300 shadow-md px-4 py-2"
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
                  <div className="flex gap-2">
                    <div className="w-full">
                      <h1>Right Marks</h1>
                      <input
                        placeholder="Enter Marks"
                        className="w-full rounded-xl border border-gray-300 shadow-md px-4 py-2"
                        type="number"
                        onChange={(e) => {
                          setQuestionsMeta(() => {
                            let updated = { ...questionsMeta };
                            updated.marks = Number(e.target.value);
                            return updated;
                          });
                        }}
                        value={questionsMeta.marks}
                      />
                    </div>
                    <div className="w-full">
                      <h1>Negative Marks</h1>
                      <input
                        placeholder="Enter Marks"
                        className="w-full rounded-xl border border-gray-300 shadow-md px-4 py-2"
                        type="number"
                        onChange={(e) => {
                          setQuestionsMeta(() => {
                            let updated = { ...questionsMeta };
                            updated.negativeMarks = Number(e.target.value);
                            return updated;
                          });
                        }}
                        value={questionsMeta.negativeMarks}
                      />
                    </div>
                    <div className="w-full">
                      <h1>Question Difficulty</h1>
                      <select
                        className="w-full rounded-xl border border-gray-300 shadow-md px-4 py-2"
                        onChange={(e) => {
                          setQuestionsMeta(() => {
                            let updated = { ...questionsMeta };
                            updated.difficulty = Number(e.target.value);
                            return updated;
                          });
                        }}
                      >
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
                  <div className="w-full space-y-1">
                    <label
                      htmlFor="writeUp"
                      className="text-sm font-medium text-gray-700"
                    >
                      Write Up
                    </label>
                    <select
                      id="writeUp"
                      value={questionsMeta?.writeUpId}
                      onChange={(e) => {
                        setQuestionsMeta(() => {
                          let updated = { ...questionsMeta };
                          updated.writeUpId = Number(e.target.value);
                          return updated;
                        });
                      }}
                      className="px-3 py-2 w-full border border-gray-300 rounded-xl focus:outline-none bg-white"
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
              </div>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}
