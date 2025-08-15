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
import ConfirmationModal from "@/components/ConfirmationModal";

export default function Index() {
  const [question, setQuestion] = useState<string>("");
  const [questionsMeta, setQuestionsMeta] = useState<{
    tags: string;
    marks: number;
    negativeMarks: number;
    difficulty: number;
    questionType: number;
    subjectId: number;
    chapterId: number;
    topicId: number;
    languageId: string;
    writeUpId: number;
  graceMarks: number;
  freeSpace: number; // 1 = Yes, 0 = No
  }>({
    tags: "",
    marks: 0,
    negativeMarks: 0,
    difficulty: 0,
    questionType: 0,
    subjectId: 0,
    chapterId: 0,
    topicId: 0,
    languageId: "",
    writeUpId: 0,
  graceMarks: 0,
  freeSpace: 0,
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
  const [chapters, setChapters] = useState<GetSubjectsResponse[]>([]);
  const [allLanguageSubjects, setAllLanguageSubjects] = useState<GetSubjectsResponse[]>([]);
  const [topics, setTopics] = useState<GetTopicsResponse[]>([]);
  const [languages, setLanguages] = useState<GetLanguagesResponse[]>([]);
  const [writeUps, setWriteUps] = useState<GetWriteUpsResponse[]>([]);
  const [difficultyLevels, setDifficultyLevels] = useState<GetDifficultyLevelsResponse[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  const router = useRouter();

  const fetchQuestionTypes = async () => {
    const res = await fetchQuestionTypesAction();
    const { data, status, error, errorMessage } = res;
    if (status === 200) {
      setQuestionTypes(data ?? []);
    } else {
      console.log({ status, error, errorMessage });
    }
  };

  const fetchSubjects = async (language?: string) => {
    const res = await fetchSubjectsAction();
    const { data, status, error, errorMessage } = res;
    if (status === 200) {
      // Robust filter by language (handles code vs name, whitespace, case)
      const normalize = (v?: string) => (v ?? '').toString().trim().toLowerCase();
      const clean = (v?: string) => normalize(v).replace(/[^a-z]/g, '');
      const sel = clean(language);
      // First, filter by language (robust)
  const languageRows = (data ?? []).filter((s) => {
        if (!language) return true;
        const subj = clean(s.language);
        if (!subj) return true; // include unlabeled subjects
        return subj === sel || subj.includes(sel) || sel.includes(subj);
      });
  setAllLanguageSubjects(languageRows);

      // Filter to show only items where SubjectType === 'Subject'
      const isType = (s: any, t: string) => (s?.subjectType ?? '').toString().trim().toLowerCase() === t;
      
      // Only include items with SubjectType === 'Subject'
      const subjectTypeItems = languageRows.filter((s) => isType(s, 'subject'));

      setSubjects(subjectTypeItems);
      // Do not auto-select; keep subjectId empty until user chooses
      setChapters([]);
      setTopics([]);
      setQuestionsMeta((prev) => ({ ...prev, subjectId: 0, chapterId: 0, topicId: 0 }));
    } else {
      console.log({ status, error, errorMessage });
    }
  };

  // Build Topic and Sub Topic list for a given Chapter (subject) from the language-specific subjects
  const buildTopicsForChapter = (chapterId: number): GetTopicsResponse[] => {
    if (!chapterId) return [];
    const isType = (s: any, t: string) => (s?.subjectType ?? '').toString().trim().toLowerCase() === t;
    const byId: Record<number, GetSubjectsResponse> = Object.fromEntries(
      (allLanguageSubjects || []).map((s) => [s.subjectId, s])
    );

    // Direct topics under the chapter
    const directTopics = (allLanguageSubjects || []).filter(
      (s) => isType(s, 'topic') && s.parentId === chapterId
    );

    // Sub topics under topics under the chapter
    const subTopics = (allLanguageSubjects || []).filter((s) => {
      if (!isType(s, 'sub topic')) return false;
      const parentTopic = s.parentId ? byId[s.parentId] : undefined;
      return !!(parentTopic && isType(parentTopic, 'topic') && parentTopic.parentId === chapterId);
    });

    const toTopicRow = (s: GetSubjectsResponse): GetTopicsResponse => ({
      topicId: s.subjectId,
      topicName: s.subjectName,
      subjectId: s.parentId,
    });

    return [...directTopics.map(toTopicRow), ...subTopics.map(toTopicRow)];
  };

  const fetchTopics = async (subjectId: number) => {
    const res = await fetchTopicsAction(subjectId);
    const { data, status, error, errorMessage } = res;
    if (status === 200) {
      const list = data ?? [];
      setTopics(list);
      // Do not auto-select; keep topicId empty until user chooses
      setQuestionsMeta((prev) => ({ ...prev, topicId: 0 }));
    } else {
      console.log({ status, error, errorMessage });
    }
  };

  const fetchChapters = (subjectId: number) => {
    if (!subjectId || !allLanguageSubjects.length) {
      setChapters([]);
      return;
    }

    const isType = (s: any, t: string) => (s?.subjectType ?? '').toString().trim().toLowerCase() === t;
    
    // Filter chapters that belong to the selected subject
    const chapterList = allLanguageSubjects.filter((s) => 
      isType(s, 'chapter') && s.parentId === subjectId
    );

    setChapters(chapterList);
    
    // Reset chapter and topic selection
    setQuestionsMeta((prev) => ({ ...prev, chapterId: 0, topicId: 0 }));
  };

  const fetchLanguages = async () => {
    const res = await fetchLanguagesAction();
    const { data, status, error, errorMessage } = res;
    if (status === 200) {
      setLanguages(data ?? []);
      // Keep language unselected initially
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

  const fetchDifficultyLevels = async (language?: string) => {
    const res = await fetchDifficultyLevelsAction(language);
    const { data, status, error, errorMessage } = res;
    if (status === 200) {
      setDifficultyLevels(data ?? []);
    } else {
      console.log({ status, error, errorMessage });
    }
  };

  useEffect(() => {
    // Load only languages and question types initially
    fetchQuestionTypes();
    fetchLanguages();
  fetchWriteUps();
    // Subjects and topics are loaded on dropdown selection
  }, []);

  const submitQuestion = async (showModal: boolean = true): Promise<{success: boolean}> => {
    try {
      // Safely stringify options (always an array)
      const stringifiedOptions = JSON.stringify(questionOptions?.options);

      // Conditionally stringify answers only if it's an array
      const stringifiedAnswer = Array.isArray(questionOptions?.answer)
        ? JSON.stringify(questionOptions.answer)
        : questionOptions?.answer;

      // Helper function to validate URL
      const isValidUrl = (string: string) => {
        if (!string || string.trim() === '') return true; // Empty is valid
        try {
          new URL(string);
          return true;
        } catch (_) {
          return false;
        }
      };

      console.log("Form validation - Subject ID:", questionsMeta.subjectId);
      console.log("Form validation - Chapter ID:", questionsMeta.chapterId);
      console.log("Form validation - Topic ID:", questionsMeta.topicId);

      if (questionsMeta.subjectId === 0) {
        toast.error("Subject Is Required");
        return {success: false};
      }

      if (questionsMeta.chapterId === 0) {
        toast.error("Chapter Is Required");
        return {success: false};
      }

      if (questionsMeta.topicId === 0) {
        toast.error("Topic Is Required");
        return {success: false};
      }

      if (questionsMeta.languageId === "") {
        toast.error("Language Is Required");
        return {success: false};
      }

      if (questionsMeta.difficulty === 0) {
        toast.error("Difficulty Level Is Required");
        return {success: false};
      }

      if (questionsMeta.questionType === 0) {
        toast.error("Question Type Is Required");
        return {success: false};
      }

      if (questionsMeta.marks === 0) {
        toast.error("Marks Is Required");
        return {success: false};
      }

      if (stringifiedOptions?.length === 0 || stringifiedOptions === "[]") {
        toast.error("Options Are Required");
        return {success: false};
      }

      if (stringifiedAnswer?.length === 0 || stringifiedAnswer === "[]") {
        toast.error("Answer Is Required");
        return {success: false};
      }

      // Validate video URL if provided
      if (videoSolURL.trim() && !isValidUrl(videoSolURL.trim())) {
        toast.error("Please enter a valid video URL or leave it empty");
        return {success: false};
      }

      // Function to strip HTML tags and get plain text
      const stripHtmlTags = (html: string): string => {
        if (!html) return '';
        
        // Create a temporary div element
        const div = document.createElement('div');
        div.innerHTML = html;
        
        // Get text content and clean up extra whitespace
        const textContent = div.textContent || div.innerText || '';
        return textContent.trim();
      };

      // Ensure we have plain text for both question and explanation
      const cleanQuestion = stripHtmlTags(question.trim());
      const cleanExplanation = stripHtmlTags(explanation.trim());

      if (cleanQuestion.trim().length === 0) {
        toast.error("Question Is Required");
        return {success: false};
      }

      const cleanVideoUrl = videoSolURL.trim();
      
      const payload: CreateQuestionRequest = {
        explanation: cleanExplanation,
        ...(cleanVideoUrl && { videoSolURL: cleanVideoUrl }), // Only include if not empty
        questionsMeta: {
          tags: questionsMeta.tags,
          marks: questionsMeta.marks,
          negativeMarks: questionsMeta.negativeMarks,
          graceMarks: questionsMeta.graceMarks,
          difficultyLevelId: questionsMeta.difficulty,
          questionTypeId: questionsMeta.questionType,
          // Backend expects SubjectID column; pass the most specific choice.
          subjectId: questionsMeta.topicId || questionsMeta.subjectId,
          topicId: questionsMeta.topicId,
          language: questionsMeta.languageId,
          writeUpId: questionsMeta.writeUpId,
          headerText: questionHeader,
        },
        question: cleanQuestion,
        options: {
          options: stringifiedOptions!,
          answer: stringifiedAnswer!,
        },
      };

      console.log("Payload being sent to API:");
      console.log("- subjectId (from Subject dropdown):", questionsMeta.subjectId);
      console.log("- chapterId (from Chapter dropdown):", questionsMeta.chapterId);
      console.log("- topicId (from Topic dropdown):", questionsMeta.topicId);
      console.log("Full payload:", payload);

      // Step 1: Create the question
      const res = await createQuestionAction(payload);
      const { data, status, error, errorMessage, message } = res;

      console.log("Question creation response:", { data, status, error, errorMessage, message });

      // Check for success more broadly
      const isQuestionCreated = (status >= 200 && status < 300) || (!error && status !== 0);

      if (isQuestionCreated) {
        // Success! The API creates both question and options in one call
        if (showModal) {
          setShowSuccessModal(true);
        }
        console.log("Question and options created successfully!");
        return {success: true};
      } else {
        console.error("CreateQuestionAction failed", {
          status,
          error,
          errorMessage,
          message,
          data,
          payload,
        });
        // Extract detailed error message from API response if available
        let detailedError = errorMessage || "Failed to create question";
        
        if (data && typeof data === 'object') {
          const errorData = data as any;
          if (errorData.errors) {
            // Convert validation errors to readable format
            const validationErrors = Object.entries(errorData.errors)
              .map(([field, errors]: [string, any]) => {
                const errorList = Array.isArray(errors) ? errors : [errors];
                return `${field}: ${errorList.join(', ')}`;
              })
              .join('; ');
            detailedError = `Validation errors: ${validationErrors}`;
          }
        }
        
        toast.error(detailedError);
        console.error("CreateQuestionAction error", { status, error, errorMessage, data });
        return {success: false};
      }
    } catch (error) {
      console.error("Error in submitQuestion:", error);
      toast.error("An unexpected error occurred while saving the question");
      return {success: false};
    }
  };

  const handleSubmit = async (goBack: boolean = true) => {
    // Prevent multiple submissions
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    
    const result = await submitQuestion(true); // true means show modal
    
    setIsSaving(false);
  };

  const handleSaveAndNew = async () => {
    // Prevent multiple submissions
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    const result = await submitQuestion(false); // false means don't show modal
    
    if (result.success) {
      // Show success toast instead of modal
      toast.success("Question saved successfully! Creating new question...");
      
      // Reset form for creating another question
      setQuestion("");
      setExplanation("");
      setQuestionHeader("");
      setVideoSolURL("");
      setQuestionOptions(undefined);
      setQuestionsMeta({
        tags: "",
        marks: 0,
        negativeMarks: 0,
        difficulty: 0,
        questionType: 0,
        subjectId: 0,
        chapterId: 0,
        topicId: 0,
        languageId: "",
        writeUpId: 0,
        graceMarks: 0,
        freeSpace: 0,
      });
      
      // Reset dependent dropdowns
      setChapters([]);
      setTopics([]);
    }
    
    setIsSaving(false);
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
                  const lang = e.target.value.trim();
                  // Update language and reset dependent selections
                  setQuestionsMeta((prev) => ({ ...prev, languageId: lang, subjectId: 0, chapterId: 0, topicId: 0, difficulty: 0 }));
                  setSubjects([]);
                  setTopics([]);
                  setDifficultyLevels([]);
                  if (lang) {
                    fetchSubjects(lang);
                    fetchDifficultyLevels(lang);
                  }
                }}
                className="w-full border rounded-md px-4 py-3"
              >
                <option value="">Select language</option>
                {languages?.map((language, idx) => (
                  <option key={`${language.language}-${idx}`} value={language.language}>
                    {language.language}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject <span className="text-red-600">*</span></label>
               <select
                required
                 value={questionsMeta?.subjectId || ''}
                onChange={(e) => {
                  const newSubjectId = Number(e.target.value);
                  console.log("Subject dropdown changed - Selected Subject ID:", newSubjectId);
                  
                  // reset chapters and topics immediately for better UX while loading
                  setChapters([]);
                  setTopics([]);
                  setQuestionsMeta((prev) => ({ ...prev, subjectId: newSubjectId, chapterId: 0, topicId: 0 }));
                  
                  // Fetch chapters for the selected subject
                  if (newSubjectId) {
                    fetchChapters(newSubjectId);
                  }
                }}
                disabled={!questionsMeta.languageId}
                className="w-full border rounded-md px-4 py-3"
              >
                <option value="">Select subject</option>
                {subjects?.map((subject, idx) => (
                  <option key={`${subject.subjectId}-${idx}`} value={subject.subjectId}>
                    {subject.subjectName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chapter <span className="text-red-600">*</span></label>
               <select
                required
                 value={questionsMeta?.chapterId || ''}
                onChange={(e) => {
                  const newChapterId = Number(e.target.value);
                  console.log("Chapter dropdown changed - Selected Chapter ID:", newChapterId);
                  
                  // reset topics immediately for better UX while loading
                  setTopics([]);
                  setQuestionsMeta((prev) => ({ ...prev, chapterId: newChapterId, topicId: 0 }));
                  
                  // Prefer deriving topics+subtopics from chapter hierarchy
                  if (newChapterId) {
                    const derived = buildTopicsForChapter(newChapterId);
                    if (derived.length > 0) {
                      setTopics(derived);
                    } else {
                      // Fallback to API if nothing derived
                      fetchTopics(newChapterId);
                    }
                  }
                }}
                disabled={!questionsMeta.subjectId}
                className="w-full border rounded-md px-4 py-3"
              >
                <option value="">Select chapter</option>
                {chapters?.map((chapter, idx) => (
                  <option key={`${chapter.subjectId}-${idx}`} value={chapter.subjectId}>
                    {chapter.subjectName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Topic <span className="text-red-600">*</span></label>
               <select
                required
                 value={questionsMeta?.topicId || ''}
                onChange={(e) => {
                  setQuestionsMeta((prev) => ({ ...prev, topicId: Number(e.target.value) }));
                }}
                disabled={!questionsMeta.chapterId}
                className="w-full border rounded-md px-4 py-3"
              >
                <option value="">Select topic</option>
                {topics?.map((topic, idx) => (
                  <option key={`${topic.topicId}-${idx}`} value={topic.topicId}>
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
                  setQuestionsMeta((prev) => ({ ...prev, questionType: Number(e.target.value) }));
                }}
                className="w-full border rounded-md px-4 py-3"
              >
                <option value="">Select type</option>
                {questionTypes?.map((questionType, idx) => (
                  <option
                    key={`${questionType.questionTypeId}-${idx}`}
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
                    returnPlainText={true}
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
                  returnPlainText={true}
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
                      disabled={!questionsMeta.languageId}
                      value={questionsMeta?.difficulty}
                      onChange={(e) => {
                        setQuestionsMeta((prev) => ({ ...prev, difficulty: Number(e.target.value) }));
                      }}
                    >
                      <option value="">Select Difficulty</option>
                      {difficultyLevels?.map((level, idx) => (
                        <option
                          key={`${level.questionDifficultylevelId}-${idx}`}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Grace Marks</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      className="w-full border rounded-md px-4 py-3"
                      value={questionsMeta.graceMarks || ''}
                      onChange={(e) => {
                        setQuestionsMeta((prev) => ({ ...prev, graceMarks: Number(e.target.value) }));
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Free Space</label>
                    <select
                      className="w-full border rounded-md px-4 py-3"
                      value={questionsMeta.freeSpace}
                      onChange={(e) => {
                        const val = Number(e.target.value) as 0 | 1;
                        setQuestionsMeta((prev) => ({ ...prev, freeSpace: val }));
                      }}
                    >
                      <option value={0}>No</option>
                      <option value={1}>Yes</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Write Up</label>
                  <select
                    value={questionsMeta?.writeUpId}
                    onChange={(e) => {
                      setQuestionsMeta((prev) => ({ ...prev, writeUpId: Number(e.target.value) }));
                    }}
                    className="w-full border rounded-md px-4 py-3"
                  >
                    <option value="">None</option>
                    {writeUps?.map((writeUp, idx) => (
                      <option
                        key={`${writeUp.writeUpId}-${idx}`}
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
              disabled={isSaving}
              className={`px-6 py-3 rounded-md text-white text-sm font-medium shadow ${
                isSaving 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save Question'}
            </button>
            <button
              onClick={handleSaveAndNew}
              disabled={isSaving}
              className={`px-6 py-3 rounded-md border border-gray-300 text-sm font-medium ${
                isSaving 
                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                  : 'hover:bg-gray-50'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save & New'}
            </button>
      </div>
        </div>
      </div>

      {/* Success Confirmation Modal */}
      <ConfirmationModal
        isOpen={showSuccessModal}
        onConfirm={() => {
          setShowSuccessModal(false);
          router.push("/admin/questions");
        }}
        onCancel={() => {
          // Do nothing - this button won't be shown with our CSS modification
        }}
        title="Question Created Successfully! 🎉"
        message="Your question has been successfully created and saved to the database."
        confirmText="Go to Questions"
        cancelText=""
        variant="success"
        className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
      />
    </div>
  );
}
