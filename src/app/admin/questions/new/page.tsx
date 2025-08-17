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
import { ArrowLeft, HelpCircle, Filter, Smartphone, Monitor } from "lucide-react";
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
    writeUpId: number | null;
    graceMarks: number;
  allowComments: number; // 1 = Yes, 0 = No
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
    writeUpId: null,
    graceMarks: 0,
  allowComments: 0, // 0 = No, 1 = Yes (Allow Candidate Comments)
  });
  const [questionHeader, setQuestionHeader] = useState<string>("");
  // Video Solution URLs (separate for Web and Mobile)
  const [videoSolWebURL, setVideoSolWebURL] = useState<string>("");
  const [videoSolMobileURL, setVideoSolMobileURL] = useState<string>("");
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
  const [explanation, setExplanation] = useState<string>("");
  // Loading flags to prevent flicker while fetching dependent data
  const [isSubjectsLoading, setIsSubjectsLoading] = useState<boolean>(false);
  const [isTopicsLoading, setIsTopicsLoading] = useState<boolean>(false);
  const [isDifficultyLoading, setIsDifficultyLoading] = useState<boolean>(false);
  // Delayed show flags to avoid brief flashes for very fast requests
  const [showSubjectsStatus, setShowSubjectsStatus] = useState<boolean>(false);
  const [showTopicsStatus, setShowTopicsStatus] = useState<boolean>(false);
  const [showDifficultyStatus, setShowDifficultyStatus] = useState<boolean>(false);
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
    }
  };

  const fetchSubjects = async (language?: string) => {
    setIsSubjectsLoading(true);
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
    }
    setIsSubjectsLoading(false);
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
    setIsTopicsLoading(true);
    const res = await fetchTopicsAction(subjectId);
    const { data, status, error, errorMessage } = res;
    if (status === 200) {
      const list = data ?? [];
      setTopics(list);
      // Do not auto-select; keep topicId empty until user chooses
      setQuestionsMeta((prev) => ({ ...prev, topicId: 0 }));
    }
    setIsTopicsLoading(false);
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
    }
  };

  const fetchWriteUps = async () => {
    const res = await fetchWriteUpsAction();
    const { data, status, error, errorMessage } = res;
    if (status === 200) {
      setWriteUps(data!);
    }
  };

  const fetchDifficultyLevels = async (language?: string) => {
    setIsDifficultyLoading(true);
    const res = await fetchDifficultyLevelsAction(language);
    const { data, status, error, errorMessage } = res;
    if (status === 200) {
      setDifficultyLevels(data ?? []);
    } else {
      // Error handled silently or show user notification
    }
    setIsDifficultyLoading(false);
  };

  useEffect(() => {
    // Load only languages and question types initially
    fetchQuestionTypes();
    fetchLanguages();
  fetchWriteUps();
    // Subjects and topics are loaded on dropdown selection
  }, []);

  // Delay helper/status text to avoid immediate flashes
  useEffect(() => {
    let t: any;
    if (isSubjectsLoading) {
      t = setTimeout(() => setShowSubjectsStatus(true), 200);
    } else {
      setShowSubjectsStatus(false);
    }
    return () => t && clearTimeout(t);
  }, [isSubjectsLoading]);

  useEffect(() => {
    let t: any;
    if (isTopicsLoading) {
      t = setTimeout(() => setShowTopicsStatus(true), 200);
    } else {
      setShowTopicsStatus(false);
    }
    return () => t && clearTimeout(t);
  }, [isTopicsLoading]);

  useEffect(() => {
    let t: any;
    if (isDifficultyLoading) {
      t = setTimeout(() => setShowDifficultyStatus(true), 200);
    } else {
      setShowDifficultyStatus(false);
    }
    return () => t && clearTimeout(t);
  }, [isDifficultyLoading]);

  const submitQuestion = async (showModal: boolean = true): Promise<{success: boolean}> => {
    try {
      // Detect current question type label
      const currentType = questionTypes.find(
        (q) => q.questionTypeId === questionsMeta.questionType
      )?.questionType;

      // Validate options/answer based on type BEFORE serializing
      const validateByType = (): { ok: boolean; msg?: string } => {
        const opts = questionOptions?.options;
        const ans = questionOptions?.answer;
        const nonEmpty = (s?: string) => (s ?? "").trim().length > 0;

        switch (currentType) {
          case QUESTION_TYPES.SINGLE_MCQ: {
            const list: string[] = Array.isArray(opts) ? (opts as string[]) : [];
            const clean = list.map((x) => (x ?? "").trim());
            const validOpts = clean.filter((x) => x.length > 0);
            if (validOpts.length < 2) return { ok: false, msg: "Add at least two non-empty options" };
            const answerList: string[] = Array.isArray(ans) ? (ans as string[]) : [];
            if (answerList.length !== 1) return { ok: false, msg: "Select exactly one correct option" };
            if (!validOpts.includes((answerList[0] ?? "").trim())) return { ok: false, msg: "Correct option must match one of the options" };
            return { ok: true };
          }
          case QUESTION_TYPES.MULTIPLE_MCQ: {
            const list: string[] = Array.isArray(opts) ? (opts as string[]) : [];
            const clean = list.map((x) => (x ?? "").trim());
            const validOpts = clean.filter((x) => x.length > 0);
            if (validOpts.length < 2) return { ok: false, msg: "Add at least two non-empty options" };
            const answerList: string[] = Array.isArray(ans) ? (ans as string[]) : [];
            if (answerList.length < 1) return { ok: false, msg: "Select at least one correct option" };
            const missing = answerList.some((a) => !validOpts.includes((a ?? "").trim()));
            if (missing) return { ok: false, msg: "All correct options must exist in the options list" };
            return { ok: true };
          }
          case QUESTION_TYPES.MATCH_PAIRS_SINGLE: {
            const cols: any[] = Array.isArray(opts) ? (opts as any[]) : [];
            const left: string[] = Array.isArray(cols?.[0]) ? cols[0] : [];
            const right: string[] = Array.isArray(cols?.[1]) ? cols[1] : [];
            const leftVals = left.map((x) => (x ?? "").trim()).filter((x) => x);
            const rightVals = right.map((x) => (x ?? "").trim()).filter((x) => x);
            if (leftVals.length === 0 || rightVals.length === 0) return { ok: false, msg: "Add at least one value in each column" };
            const ansList: any[] = Array.isArray(ans) ? (ans as any[]) : [];
            // For each non-empty left, ensure a single selected right that exists
            for (let i = 0; i < left.length; i++) {
              if (!nonEmpty(left[i])) continue; // allow blank rows to be ignored
              const chosen = ansList[i];
              if (!nonEmpty(chosen)) return { ok: false, msg: `Select one match for row ${i + 1}` };
              if (!rightVals.includes((chosen ?? "").trim())) return { ok: false, msg: `Row ${i + 1} match must exist in Column 2` };
            }
            return { ok: true };
          }
          case QUESTION_TYPES.MATCH_PAIRS_MULTIPLE: {
            const cols: any[] = Array.isArray(opts) ? (opts as any[]) : [];
            const left: string[] = Array.isArray(cols?.[0]) ? cols[0] : [];
            const right: string[] = Array.isArray(cols?.[1]) ? cols[1] : [];
            const leftVals = left.map((x) => (x ?? "").trim()).filter((x) => x);
            const rightVals = right.map((x) => (x ?? "").trim()).filter((x) => x);
            if (leftVals.length === 0 || rightVals.length === 0) return { ok: false, msg: "Add at least one value in each column" };
            const ans2D: any[] = Array.isArray(ans) ? (ans as any[]) : [];
            for (let i = 0; i < left.length; i++) {
              if (!nonEmpty(left[i])) continue;
              const chosen: string[] = Array.isArray(ans2D[i]) ? ans2D[i] : [];
              if (chosen.length === 0) return { ok: false, msg: `Select at least one match for row ${i + 1}` };
              const bad = chosen.some((c) => !rightVals.includes((c ?? "").trim()));
              if (bad) return { ok: false, msg: `Row ${i + 1} contains a match not present in Column 2` };
            }
            return { ok: true };
          }
          case QUESTION_TYPES.TRUEFALSE: {
            const arr: string[] = Array.isArray(ans) ? (ans as string[]) : [];
            if (arr.length !== 1) return { ok: false, msg: "Select True or False" };
            const v = (arr[0] ?? "").trim();
            if (!["True", "False"].includes(v)) return { ok: false, msg: "Answer must be True or False" };
            return { ok: true };
          }
          case QUESTION_TYPES.NUMERIC: {
            const v = typeof ans === "string" ? ans.trim() : (ans ?? "").toString().trim();
            if (!v) return { ok: false, msg: "Enter a numeric answer" };
            if (!/^\d+(\.\d+)?$/.test(v)) return { ok: false, msg: "Enter a valid number (e.g., 42 or 3.14)" };
            return { ok: true };
          }
          case QUESTION_TYPES.FILL_ANSWER: {
            const v = typeof ans === "string" ? ans.trim() : (ans ?? "").toString().trim();
            if (!v) return { ok: false, msg: "Answer cannot be empty" };
            return { ok: true };
          }
          case QUESTION_TYPES.WRITE_UP: {
            // No answer required for Write Up type
            return { ok: true };
          }
          default: {
            // Generic: require some answer
            if (ans === undefined || ans === null) return { ok: false, msg: "Answer is required" };
            const text = Array.isArray(ans) ? ans.join("") : String(ans ?? "");
            if (!text.trim()) return { ok: false, msg: "Answer is required" };
            return { ok: true };
          }
        }
      };

      const validation = validateByType();
      if (!validation.ok) {
        toast.error(validation.msg || "Please complete the answer options");
        return { success: false };
      }

      // Safely build options/answers JSON; handle special shapes per type
      let stringifiedOptions = "";
      let stringifiedAnswer: string | undefined = undefined;

  if (currentType === QUESTION_TYPES.MATCH_PAIRS_SINGLE) {
        // Expect options as [left[], right[]] and answer as array mapping by index to a single right
        const cols = (questionOptions?.options || []) as any[];
        const left: string[] = Array.isArray(cols?.[0]) ? cols[0] : [];
        const right: string[] = Array.isArray(cols?.[1]) ? cols[1] : [];

        // Normalize answer to array of strings aligned with left indices
        const ansArr: any = questionOptions?.answer;
        const ansList: string[] = Array.isArray(ansArr) ? ansArr : [];

        // Build pairs [leftValue, rightValue] only for populated selections
        const pairs: [string, string][] = left
          .map((l, i) => [l, ansList[i]] as [string, string])
          .filter(([l, r]) => !!(l && r));

  // Serialize with a `type` property for clarity/compat
  stringifiedOptions = JSON.stringify({ type: "match-pair-single", left, right });
        stringifiedAnswer = JSON.stringify(pairs);
      } else if (currentType === QUESTION_TYPES.MATCH_PAIRS_MULTIPLE) {
        // Expect options as [left[], right[]] and answer as string[][] (multiple right per left)
        const cols = (questionOptions?.options || []) as any[];
        const left: string[] = Array.isArray(cols?.[0]) ? cols[0] : [];
        const right: string[] = Array.isArray(cols?.[1]) ? cols[1] : [];

        const ans: any = questionOptions?.answer;
        // Ensure answer is a 2D array of strings, align length with left
        const answer2D: string[][] = Array.isArray(ans)
          ? ans.map((x: any) => (Array.isArray(x) ? x : [])).slice(0, left.length)
          : [];

        stringifiedOptions = JSON.stringify({ type: "match-pair-multiple", left, right });
        stringifiedAnswer = JSON.stringify(answer2D);
  } else if (currentType === QUESTION_TYPES.SINGLE_MCQ) {
        const optsArr = (questionOptions?.options || []) as string[];
        const ansArr = Array.isArray(questionOptions?.answer) ? (questionOptions!.answer as string[]) : [];
        stringifiedOptions = JSON.stringify({ type: "mcq-single", options: optsArr });
        stringifiedAnswer = JSON.stringify(ansArr);
  } else if (currentType === QUESTION_TYPES.MULTIPLE_MCQ) {
        const optsArr = (questionOptions?.options || []) as string[];
        const ansArr = Array.isArray(questionOptions?.answer) ? (questionOptions!.answer as string[]) : [];
        stringifiedOptions = JSON.stringify({ type: "mcq-multiple", options: optsArr });
        stringifiedAnswer = JSON.stringify(ansArr);
      } else if (currentType === QUESTION_TYPES.NUMERIC) {
        // Numeric doesn't have options list; just the type marker
        stringifiedOptions = JSON.stringify({ type: "numeric" });
        // Answer must be JSON string (e.g., "42"), not raw 42
        stringifiedAnswer = JSON.stringify(
          typeof questionOptions?.answer === 'string'
            ? questionOptions?.answer
            : (questionOptions?.answer ?? "")
        );
      } else if (currentType === QUESTION_TYPES.TRUEFALSE) {
        // Canonical structure for True/False type
        const ansArray = Array.isArray(questionOptions?.answer)
          ? (questionOptions!.answer as string[])
          : (questionOptions?.answer ? [questionOptions?.answer] : []);
        stringifiedOptions = JSON.stringify({ type: "truefalse", options: ["True", "False"] });
        stringifiedAnswer = JSON.stringify(ansArray);
      } else if (currentType === QUESTION_TYPES.FILL_ANSWER) {
        // Fill Answer: no options list, just the type marker; answer is a plain string
        stringifiedOptions = JSON.stringify({ type: "fill-answer" });
        // Ensure valid JSON (quoted string)
        stringifiedAnswer = JSON.stringify(
          typeof questionOptions?.answer === 'string'
            ? questionOptions?.answer
            : (questionOptions?.answer ?? "")
        );
      } else if (currentType === QUESTION_TYPES.WRITE_UP) {
        // Write Up: no options/answers – just mark type
        stringifiedOptions = JSON.stringify({ type: "write-up" });
        stringifiedAnswer = JSON.stringify("");
      } else {
        // Default behavior for other types
        stringifiedOptions = JSON.stringify(questionOptions?.options);
        // Always send valid JSON for answer
        stringifiedAnswer = Array.isArray(questionOptions?.answer)
          ? JSON.stringify(questionOptions.answer)
          : JSON.stringify(questionOptions?.answer ?? "");
      }

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

      // Base presence checks (skip for WRITE_UP because it's optional)
      if (currentType !== QUESTION_TYPES.WRITE_UP) {
        if (stringifiedOptions?.length === 0 || stringifiedOptions === "[]") {
          toast.error("Options Are Required");
          return {success: false};
        }
        if (stringifiedAnswer?.length === 0 || stringifiedAnswer === "[]") {
          toast.error("Answer Is Required");
          return {success: false};
        }
      }

      // Validate video URLs if provided
      const webUrl = videoSolWebURL.trim();
      const mobileUrl = videoSolMobileURL.trim();

      if (webUrl && !isValidUrl(webUrl)) {
        toast.error("Please enter a valid Web video URL or leave it empty");
        return { success: false };
      }
      if (mobileUrl && !isValidUrl(mobileUrl)) {
        toast.error("Please enter a valid Mobile video URL or leave it empty");
        return { success: false };
      }

      // Validate that we have content for both question and explanation
      // For HTML content, we check if there's actual text content
      const hasQuestionContent = (content: string): boolean => {
        if (!content) return false;
        
        // Create a temporary div to check if there's actual text content
        const div = document.createElement('div');
        div.innerHTML = content;
        const textContent = div.textContent || div.innerText || '';
        return textContent.trim().length > 0;
      };

      if (!hasQuestionContent(question.trim())) {
        toast.error("Question Is Required");
        return {success: false};
      }

  const cleanVideoUrlWeb = webUrl;
  const cleanVideoUrlMobile = mobileUrl;
  // For now, backend createQuestion supports a single field. Prefer Web URL; fallback to Mobile.
  const selectedSingleVideoUrl = cleanVideoUrlWeb || cleanVideoUrlMobile;
      
      const payload: CreateQuestionRequest = {
  explanation: explanation.trim(), // Save HTML as-is
  ...(selectedSingleVideoUrl && { videoSolURL: selectedSingleVideoUrl }), // Only include if not empty
  ...(cleanVideoUrlMobile && { videoSolMobileURL: cleanVideoUrlMobile }), // Only include if not empty
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
          writeUpId: questionsMeta.writeUpId ?? null,
          headerText: questionHeader,
          allowCandidateComments: questionsMeta.allowComments ? 1 : 0,
        },
        question: question.trim(), // Save HTML as-is
        headerText: questionHeader,
        options: {
          options: stringifiedOptions!,
          answer: stringifiedAnswer!,
        },
      };

      // Step 1: Create the question
      const res = await createQuestionAction(payload);
      const { data, status, error, errorMessage, message } = res;

      // Check for success more broadly
      const isQuestionCreated = (status >= 200 && status < 300) || (!error && status !== 0);

      if (isQuestionCreated) {
        // Success! The API creates both question and options in one call
        if (showModal) {
          setShowSuccessModal(true);
        }
        return {success: true};
      } else {
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
        return {success: false};
      }
    } catch (error) {
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
  setVideoSolWebURL("");
  setVideoSolMobileURL("");
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
  writeUpId: null,
        graceMarks: 0,
  allowComments: 0,
      });
      
      // Reset dependent dropdowns
      setChapters([]);
      setTopics([]);
    }
    
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="w-[85%] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin/questions" className="text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                </div>
                <h1 className="text-2xl font-semibold text-gray-900">Create New Question</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin/questions" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Back to Questions
              </Link>
              {/* Action Buttons in Header */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveAndNew}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-colors ${
                    isSaving 
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {isSaving ? 'Saving...' : 'Save & New'}
                </button>
                <button
                  onClick={() => handleSubmit()}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm transition-colors ${
                    isSaving 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isSaving ? 'Saving...' : 'Save Question'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="w-[85%] mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left Sidebar - Filters & Configuration */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                  <Filter className="w-3 h-3 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Question Configuration</h2>
              </div>
              
              <div className="space-y-6">
                {/* Language Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Language <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={questionsMeta?.languageId}
                    onChange={(e) => {
                      const lang = e.target.value.trim();
                      setQuestionsMeta((prev) => ({ ...prev, languageId: lang, subjectId: 0, chapterId: 0, topicId: 0, difficulty: 0 }));
                      setSubjects([]);
                      setTopics([]);
                      setDifficultyLevels([]);
                      if (lang) {
                        // Pre-mark loading to avoid flashing of empty-state messages
                        setIsSubjectsLoading(true);
                        setIsDifficultyLoading(true);
                      }
                      if (lang) {
                        fetchSubjects(lang);
                        fetchDifficultyLevels(lang);
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                  >
                    <option value="">Select language</option>
                    {languages?.map((language, idx) => (
                      <option key={`${language.language}-${idx}`} value={language.language}>
                        {language.language}
                      </option>
                    ))}
                  </select>
                  {!questionsMeta.languageId && (
                    <p className="text-xs text-gray-500">Select a language to enable other options</p>
                  )}
                </div>

                {/* Subject Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <div>
                    <select
                      required
                      value={questionsMeta?.subjectId || ''}
                      onChange={(e) => {
                        const newSubjectId = Number(e.target.value);
                        setChapters([]);
                        setTopics([]);
                        setQuestionsMeta((prev) => ({ ...prev, subjectId: newSubjectId, chapterId: 0, topicId: 0 }));
                        if (newSubjectId) {
                          fetchChapters(newSubjectId);
                        }
                      }}
                      disabled={!questionsMeta.languageId}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                      <option value="">Select subject</option>
                      {subjects?.map((subject, idx) => (
                        <option key={`${subject.subjectId}-${idx}`} value={subject.subjectId}>
                          {subject.subjectName}
                        </option>
                      ))}
                    </select>
                    <div
                      className="overflow-hidden"
                      style={{
                        height:
                          (showSubjectsStatus && isSubjectsLoading && questionsMeta.languageId) ||
                          (!isSubjectsLoading && subjects.length === 0 && questionsMeta.languageId)
                            ? '1rem'
                            : 0,
                        transition: 'height 200ms ease',
                        marginTop:
                          (showSubjectsStatus && isSubjectsLoading && questionsMeta.languageId) ||
                          (!isSubjectsLoading && subjects.length === 0 && questionsMeta.languageId)
                            ? '0.25rem'
                            : 0,
                      }}
                    >
                      {showSubjectsStatus && isSubjectsLoading && questionsMeta.languageId ? (
                        <p className="text-xs text-gray-500">Loading subjects...</p>
                      ) : !isSubjectsLoading && subjects.length === 0 && questionsMeta.languageId ? (
                        <p className="text-xs text-amber-600">No subjects available for selected language</p>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Chapter Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Chapter <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={questionsMeta?.chapterId || ''}
                    onChange={(e) => {
                      const newChapterId = Number(e.target.value);
                      setTopics([]);
                      setQuestionsMeta((prev) => ({ ...prev, chapterId: newChapterId, topicId: 0 }));
                      if (newChapterId) {
                        const derived = buildTopicsForChapter(newChapterId);
                        if (derived.length > 0) {
                          setTopics(derived);
                        } else {
                          fetchTopics(newChapterId);
                        }
                      }
                    }}
                    disabled={!questionsMeta.subjectId}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  >
                    <option value="">Select chapter</option>
                    {chapters?.map((chapter, idx) => (
                      <option key={`${chapter.subjectId}-${idx}`} value={chapter.subjectId}>
                        {chapter.subjectName}
                      </option>
                    ))}
                  </select>
                  {chapters.length === 0 && questionsMeta.subjectId > 0 && (
                    <p className="text-xs text-amber-600">No chapters available for selected subject</p>
                  )}
                </div>

                {/* Topic Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Topic <span className="text-red-500">*</span>
                  </label>
                  <div>
                    <select
                      required
                      value={questionsMeta?.topicId || ''}
                      onChange={(e) => {
                        setQuestionsMeta((prev) => ({ ...prev, topicId: Number(e.target.value), questionType: 0 }));
                      }}
                      disabled={!questionsMeta.chapterId}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                      <option value="">Select topic</option>
                      {topics?.map((topic, idx) => (
                        <option key={`${topic.topicId}-${idx}`} value={topic.topicId}>
                          {topic.topicName}
                        </option>
                      ))}
                    </select>
                    <div
                      className="overflow-hidden"
                      style={{
                        height:
                          (showTopicsStatus && isTopicsLoading && questionsMeta.chapterId > 0) ||
                          (!isTopicsLoading && topics.length === 0 && questionsMeta.chapterId > 0)
                            ? '1rem'
                            : 0,
                        transition: 'height 200ms ease',
                        marginTop:
                          (showTopicsStatus && isTopicsLoading && questionsMeta.chapterId > 0) ||
                          (!isTopicsLoading && topics.length === 0 && questionsMeta.chapterId > 0)
                            ? '0.25rem'
                            : 0,
                      }}
                    >
                      {showTopicsStatus && isTopicsLoading && questionsMeta.chapterId > 0 ? (
                        <p className="text-xs text-gray-500">Loading topics...</p>
                      ) : !isTopicsLoading && topics.length === 0 && questionsMeta.chapterId > 0 ? (
                        <p className="text-xs text-amber-600">No topics available for selected chapter</p>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Question Type */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Question Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={questionsMeta?.questionType || ''}
                    onChange={(e) => {
                      setQuestionsMeta((prev) => ({ ...prev, questionType: Number(e.target.value) }));
                    }}
                    disabled={!questionsMeta.topicId}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
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
                  {questionTypes.length === 0 && (
                    <p className="text-xs text-amber-600">Loading question types...</p>
                  )}
                  {!questionsMeta.topicId && (
                    <p className="text-xs text-gray-500">Select a topic to enable question type selection</p>
                  )}
                </div>

                {/* Difficulty Level */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Difficulty Level <span className="text-red-500">*</span>
                  </label>
                  <div>
                    <select
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                      disabled={!questionsMeta.languageId}
                      value={questionsMeta?.difficulty || ''}
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
                    <div
                      className="overflow-hidden"
                      style={{
                        height:
                          (showDifficultyStatus && isDifficultyLoading && questionsMeta.languageId) ||
                          (!isDifficultyLoading && difficultyLevels.length === 0 && questionsMeta.languageId)
                            ? '1rem'
                            : 0,
                        transition: 'height 200ms ease',
                        marginTop:
                          (showDifficultyStatus && isDifficultyLoading && questionsMeta.languageId) ||
                          (!isDifficultyLoading && difficultyLevels.length === 0 && questionsMeta.languageId)
                            ? '0.25rem'
                            : 0,
                      }}
                    >
                      {showDifficultyStatus && isDifficultyLoading && questionsMeta.languageId ? (
                        <p className="text-xs text-gray-500">Loading difficulty levels...</p>
                      ) : !isDifficultyLoading && difficultyLevels.length === 0 && questionsMeta.languageId ? (
                        <p className="text-xs text-amber-600">No difficulty levels available for selected language</p>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Marks Configuration */}
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-100 rounded flex items-center justify-center">
                      <span className="text-emerald-600 text-xs font-bold">%</span>
                    </div>
                    Marks Configuration
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Right Marks <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="number"
                        min={0}
                        placeholder="0"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        onChange={(e) => {
                          setQuestionsMeta((prev) => ({ ...prev, marks: Number(e.target.value) }));
                        }}
                        value={questionsMeta.marks || ''}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">Negative Marks</label>
                      <input
                        type="number"
                        min={0}
                        placeholder="0"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        onChange={(e) => {
                          setQuestionsMeta((prev) => ({ ...prev, negativeMarks: Number(e.target.value) }));
                        }}
                        value={questionsMeta.negativeMarks || ''}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">Grace Marks</label>
                      <input
                        type="number"
                        min={0}
                        placeholder="0"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        value={questionsMeta.graceMarks || ''}
                        onChange={(e) => {
                          setQuestionsMeta((prev) => ({ ...prev, graceMarks: Number(e.target.value) }));
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">Allow Comments</label>
                      <div className="flex items-center gap-4 px-3 py-2 rounded-lg w-full">
                        <label className="inline-flex items-center gap-1 text-xs">
                          <input
                            type="radio"
                            className="h-5 w-5 accent-indigo-600 focus:ring-indigo-500"
                            name="allowCandidateComments"
                            value="0"
                            checked={questionsMeta.allowComments === 0}
                            onChange={() => setQuestionsMeta(prev => ({ ...prev, allowComments: 0 }))}
                          />
                          No
                        </label>
                        <label className="inline-flex items-center gap-1 text-xs">
                          <input
                            type="radio"
                            className="h-5 w-5 accent-indigo-600 focus:ring-indigo-500"
                            name="allowCandidateComments"
                            value="1"
                            checked={questionsMeta.allowComments === 1}
                            onChange={() => setQuestionsMeta(prev => ({ ...prev, allowComments: 1 }))}
                          />
                          Yes
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Options */}
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-100 rounded flex items-center justify-center">
                      <span className="text-purple-600 text-xs font-bold">+</span>
                    </div>
                    Additional Options
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">Tags</label>
                      <input
                        placeholder="Add tags (comma separated)"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        onChange={(e) => {
                          setQuestionsMeta((prev) => ({ ...prev, tags: e.target.value }));
                        }}
                        value={questionsMeta.tags}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">Write Up</label>
                      <select
                        value={questionsMeta?.writeUpId ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setQuestionsMeta((prev) => ({ ...prev, writeUpId: v ? Number(v) : null }));
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
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
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Main Content */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-9">
            <div className="space-y-6">
              {/* Configuration Progress Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-indigo-100 rounded-md flex items-center justify-center">
                        <span className="text-indigo-600 text-sm font-bold">📊</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">Configuration Progress</span>
                    </div>
                    <span className="text-sm text-gray-600 font-medium">
                      {[questionsMeta.languageId, questionsMeta.subjectId, questionsMeta.chapterId, questionsMeta.topicId, questionsMeta.questionType, questionsMeta.difficulty].filter(Boolean).length}/6 Complete
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${([questionsMeta.languageId, questionsMeta.subjectId, questionsMeta.chapterId, questionsMeta.topicId, questionsMeta.questionType, questionsMeta.difficulty].filter(Boolean).length / 6) * 100}%`
                        }}
                      />
                    </div>

                    {/* Configuration Checklist */}
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      <div className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs ${questionsMeta.languageId ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
              <div className={`w-3 h-3 rounded-full ${questionsMeta.languageId ? 'bg-green-500' : 'bg-gray-300'}`}>
                {!!questionsMeta.languageId && <span className="text-white text-xs block w-full text-center leading-3">✓</span>}
                        </div>
                        <span className="font-medium">Language</span>
                      </div>
                      
                      <div className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs ${questionsMeta.subjectId ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
              <div className={`w-3 h-3 rounded-full ${questionsMeta.subjectId ? 'bg-green-500' : 'bg-gray-300'}`}>
                {!!questionsMeta.subjectId && <span className="text-white text-xs block w-full text-center leading-3">✓</span>}
                        </div>
                        <span className="font-medium">Subject</span>
                      </div>
                      
                      <div className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs ${questionsMeta.chapterId ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
              <div className={`w-3 h-3 rounded-full ${questionsMeta.chapterId ? 'bg-green-500' : 'bg-gray-300'}`}>
                {!!questionsMeta.chapterId && <span className="text-white text-xs block w-full text-center leading-3">✓</span>}
                        </div>
                        <span className="font-medium">Chapter</span>
                      </div>
                      
                      <div className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs ${questionsMeta.topicId ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
              <div className={`w-3 h-3 rounded-full ${questionsMeta.topicId ? 'bg-green-500' : 'bg-gray-300'}`}>
                {!!questionsMeta.topicId && <span className="text-white text-xs block w-full text-center leading-3">✓</span>}
                        </div>
                        <span className="font-medium">Topic</span>
                      </div>
                      
                      <div className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs ${questionsMeta.questionType ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
              <div className={`w-3 h-3 rounded-full ${questionsMeta.questionType ? 'bg-green-500' : 'bg-gray-300'}`}>
                {!!questionsMeta.questionType && <span className="text-white text-xs block w-full text-center leading-3">✓</span>}
                        </div>
                        <span className="font-medium">Type</span>
                      </div>
                      
                      <div className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs ${questionsMeta.difficulty ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
              <div className={`w-3 h-3 rounded-full ${questionsMeta.difficulty ? 'bg-green-500' : 'bg-gray-300'}`}>
                {!!questionsMeta.difficulty && <span className="text-white text-xs block w-full text-center leading-3">✓</span>}
                        </div>
                        <span className="font-medium">Difficulty</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Content Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 transition-shadow hover:shadow-md">
                <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center">
                        <HelpCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">Question Content</span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Question Header (Optional)</label>
                      <input
                        placeholder="Enter question header or instructions..."
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                        onChange={(e) => setQuestionHeader(e.target.value)}
                        value={questionHeader}
                      />
                      <p className="text-xs text-gray-500 mt-2">Optional: Add instructions or context for the question</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Question Content <span className="text-red-500">*</span>
                      </label>
                      <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 transition-all duration-200">
                        <RichTextEditor
                          onChange={(content) => setQuestion(content)}
                          initialContent={question}
                          placeholder="Type your question here..."
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Use the rich text editor to format your question with equations, images, and more</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Options Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 transition-shadow hover:shadow-md">
                <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-bold">◯</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">Answer Options</span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  {questionsMeta?.questionType ? (
                    <QuestionOptionsInput
                      questionTypeId={questionsMeta?.questionType}
                      questionTypes={questionTypes}
                      onDataChange={(data) => setQuestionOptions(data)}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-gray-400 text-2xl">◯</span>
                      </div>
                      <p className="text-gray-500 text-sm">Select a question type from the configuration panel to add answer options</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Explanation Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 transition-shadow hover:shadow-md">
                <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-amber-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-yellow-100 rounded-md flex items-center justify-center">
                        <span className="text-yellow-600 text-sm font-bold">💡</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">Explanation & Solution</span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Explanation</label>
                      <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-yellow-500 focus-within:border-yellow-500 transition-all duration-200">
                        <RichTextEditor
                          onChange={(content) => setExplanation(content)}
                          initialContent={explanation}
                          placeholder="Add explanation for the correct answer..."
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Provide a clear explanation of why the answer is correct</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Video Solution URLs</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Web URL */}
                        <div>
                          <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                              <Monitor className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                              type="url"
                              placeholder="Web URL (e.g., https://youtu.be/...)"
                              className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-3 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                              onChange={(e) => setVideoSolWebURL(e.target.value)}
                              value={videoSolWebURL}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Shown on desktop and tablets</p>
                        </div>

                        {/* Mobile URL */}
                        <div>
                          <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                              <Smartphone className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                              type="url"
                              placeholder="Mobile URL (e.g., https://m.example.com/video)"
                              className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-3 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                              onChange={(e) => setVideoSolMobileURL(e.target.value)}
                              value={videoSolMobileURL}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Optimized link for smartphones</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Optional: Provide one or both URLs as applicable</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card for Mobile */}
              <div className="lg:hidden bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveAndNew}
                    disabled={isSaving}
                    className={`flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-colors ${
                      isSaving 
                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {isSaving ? 'Saving...' : 'Save & New'}
                  </button>
                  <button
                    onClick={() => handleSubmit()}
                    disabled={isSaving}
                    className={`flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm transition-colors ${
                      isSaving 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {isSaving ? 'Saving...' : 'Save Question'}
                  </button>
                </div>
              </div>
            </div>
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
