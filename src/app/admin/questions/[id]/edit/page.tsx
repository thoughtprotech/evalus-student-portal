"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import RichTextEditor from "@/components/RichTextEditor";
import QuestionOptionsInput from "@/app/admin/questions/new/_components/QuestionOptionsInput";
import { QUESTION_TYPES } from "@/utils/constants";
import { fetchQuestionByIdAction } from "@/app/actions/exam/questions/getQuestionById";
import { fetchQuestionTypesAction } from "@/app/actions/dashboard/questions/fetchQuestionTypes";
import { fetchSubjectsAction } from "@/app/actions/dashboard/questions/fetchSubjects";
import { fetchLanguagesAction } from "@/app/actions/dashboard/questions/fetchLanguages";
import { fetchWriteUpsAction } from "@/app/actions/dashboard/spotlight/fetchWriteUps";
import { fetchDifficultyLevelsAction } from "@/app/actions/dashboard/questions/fetchDifficultyLevels";
import { updateQuestionAction } from "@/app/actions/dashboard/questions/updateQuestion";
import type { GetQuestionTypesResponse, GetSubjectsResponse, GetTopicsResponse, GetLanguagesResponse, GetWriteUpsResponse, GetDifficultyLevelsResponse, CreateQuestionRequest } from "@/utils/api/types";
import { ArrowLeft, HelpCircle, Smartphone, Monitor } from "lucide-react";
import ConfirmationModal from "@/components/ConfirmationModal";
import QuestionEditSkeleton from "./QuestionEditSkeleton";

export default function EditQuestionPage() {
	const params = useParams();
	const router = useRouter();
	const search = useSearchParams();
	const id = Number(params?.id);
	const returnTo = search?.get("returnTo") || "";

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [showSuccessModal, setShowSuccessModal] = useState(false);

	const [questionTypes, setQuestionTypes] = useState<GetQuestionTypesResponse[]>([]);
	const [subjects, setSubjects] = useState<GetSubjectsResponse[]>([]);
	const [allLanguageSubjects, setAllLanguageSubjects] = useState<GetSubjectsResponse[]>([]);
	const [chapters, setChapters] = useState<GetSubjectsResponse[]>([]);
	const [topics, setTopics] = useState<GetTopicsResponse[]>([]);
	const [languages, setLanguages] = useState<GetLanguagesResponse[]>([]);
	const [writeUps, setWriteUps] = useState<GetWriteUpsResponse[]>([]);
	const [difficultyLevels, setDifficultyLevels] = useState<GetDifficultyLevelsResponse[]>([]);

	const [question, setQuestion] = useState("");
	const [batchNo, setBatchNo] = useState<string>("");
	const [questionHeader, setQuestionHeader] = useState("");
	const [explanation, setExplanation] = useState("");
	const [videoSolWebURL, setVideoSolWebURL] = useState("");
	const [videoSolMobileURL, setVideoSolMobileURL] = useState("");
	const [questionOptions, setQuestionOptions] = useState<{ options: any; answer: any } | undefined>();

	const [questionsMeta, setQuestionsMeta] = useState({
		tags: "",
		marks: 0,
		negativeMarks: 0,
		difficulty: 0,
		questionType: 0,
		subjectId: 0,
		chapterId: 0,
		topicId: 0,
		languageId: "",
		writeUpId: null as number | null,
		graceMarks: 0,
		allowComments: 0, // 0 = No, 1 = Yes (Allow Candidate Comments)
		duration: 0,
	});
	// Status (Active/InActive)
	const [questionStatus, setQuestionStatus] = useState<number>(1);

	const buildChapters = useCallback((subjectId: number) => {
		const isType = (s: any, t: string) => (s?.subjectType ?? "").toString().trim().toLowerCase() === t;
		return allLanguageSubjects.filter(s => isType(s, "chapter") && s.parentId === subjectId);
	}, [allLanguageSubjects]);

	const buildTopicsForChapter = useCallback((chapterId: number): GetTopicsResponse[] => {
		if (!chapterId) return [];
		const isType = (s: any, t: string) => (s?.subjectType ?? "").toString().trim().toLowerCase() === t;
		const byId: Record<number, GetSubjectsResponse> = Object.fromEntries(allLanguageSubjects.map(s => [s.subjectId, s]));
		const direct = allLanguageSubjects.filter(s => isType(s, "topic") && s.parentId === chapterId);
		const sub = allLanguageSubjects.filter(s => {
			if (!isType(s, "sub topic")) return false;
			const parent = s.parentId ? byId[s.parentId] : undefined;
			return !!(parent && isType(parent, "topic") && parent.parentId === chapterId);
		});
		const mapRow = (s: GetSubjectsResponse): GetTopicsResponse => ({ topicId: s.subjectId, topicName: s.subjectName, subjectId: s.parentId });
		return [...direct.map(mapRow), ...sub.map(mapRow)];
	}, [allLanguageSubjects]);

	useEffect(() => {
		if (!id) {
			// Invalid id – stop spinner and navigate back
			setLoading(false);
			toast.error("Invalid question id");
			if (returnTo) router.push(returnTo); else router.push("/admin/questions");
			return;
		}
		let cancelled = false;
		(async () => {
			setLoading(true);
			try {
				const [qRes, qtRes, langsRes, wuRes] = await Promise.all([
					fetchQuestionByIdAction(id),
					fetchQuestionTypesAction(),
					fetchLanguagesAction(),
					fetchWriteUpsAction()
				]);
				if (cancelled) return;
				if (qtRes.status === 200) setQuestionTypes(qtRes.data || []);
				if (langsRes.status === 200) setLanguages(langsRes.data || []);
				if (wuRes.status === 200) setWriteUps(wuRes.data || []);
				if (!(qRes.status === 200 && qRes.data)) { toast.error("Failed to load question"); setLoading(false); return; }
				const q = qRes.data;
				console.log("Loaded question:", q);
				// Normalized primitive IDs (support both root-level & nested questionsMeta structure)
				const normalized = {
					questionTypeId: (q as any).questionTypeId ?? (q as any).questionsMeta?.questionTypeId ?? 0,
					difficultyLevelId: (q as any).questionDifficultyLevelId ?? (q as any).questionsMeta?.difficultyLevelId ?? 0,
					language: (q as any).language ?? (q as any).questionsMeta?.language ?? "",
					subjectId: (q as any).subjectId ?? (q as any).questionsMeta?.subjectId ?? 0,
					chapterId: (q as any).chapterId ?? (q as any).questionsMeta?.chapterId ?? 0,
					topicId: (q as any).topicId ?? (q as any).questionsMeta?.topicId ?? 0,
				};
				// Support both legacy API field names and new unified create/update payload field names
				const questionText = (q as any).questionText ?? (q as any).question ?? "";
				const explanationText = (q as any).additionalExplanation ?? (q as any).explanation ?? "";
				const videoWeb = (q as any).videoSolutionWeburl ?? (q as any).videoSolURL ?? "";
				const videoMobile = (q as any).videoSolutionMobileurl ?? (q as any).videoSolMobileURL ?? "";
				setQuestion(questionText || "");
				setQuestionHeader((q as any).headerText || (q as any).questionsMeta?.headerText || "");
				setExplanation(explanationText || "");
				setVideoSolWebURL(videoWeb || "");
				setVideoSolMobileURL(videoMobile || "");
				setQuestionsMeta(m => ({
					...m,
					// Bind tags (supports possible API field name variations or array form)
					tags: (() => {
						const raw = (q as any).tags ?? (q as any).questionsMeta?.tags ?? (q as any).questionTags ?? '';
						if (Array.isArray(raw)) return raw.join(', ');
						return typeof raw === 'string' ? raw : '';
					})(),
					marks: (q as any).marks ?? (q as any).questionsMeta?.marks ?? 0,
					negativeMarks: (q as any).negativeMarks ?? (q as any).questionsMeta?.negativeMarks ?? 0,
					graceMarks: (q as any).graceMarks ?? (q as any).questionsMeta?.graceMarks ?? 0,
					duration: (q as any).duration ?? (q as any).questionsMeta?.duration ?? (q as any).questionDuration ?? 0,
					difficulty: (q as any).questionDifficultyLevelId ?? (q as any).questionsMeta?.difficultyLevelId ?? 0,
					questionType: normalized.questionTypeId,
					languageId: normalized.language,
					writeUpId: (q as any).writeUpId ?? (q as any).questionsMeta?.writeUpId ?? null,
					allowComments: (q as any).allowCandidateComments === 1 || (q as any).allowComments === 1 || (q as any).questionsMeta?.allowCandidateComments === 1 ? 1 : 0,
				}));
				setQuestionStatus((q as any).isActive === 0 ? 0 : 1);
				{
					const qq: any = q as any;
					const meta: any = qq.questionsMeta ?? {};
					const bn = qq.batchNo ?? qq.BatchNo ?? qq.BatchNumber ?? qq.batchno ?? qq.batchnumber ?? meta.batchNo ?? meta.BatchNo ?? meta.BatchNumber ?? meta.batchno ?? meta.batchnumber ?? "";
					setBatchNo(typeof bn === 'string' ? bn : String(bn ?? ""));
				}

				try {
					// Handle options coming either as raw JSON strings or already structured inside q.options
					let optionsJsonString = (q as any).questionOptionsJson ?? (q as any).options?.options ?? "{}";
					let answerJsonString = (q as any).questionCorrectAnswerJson ?? (q as any).options?.answer ?? "null";
					const optsObj = typeof optionsJsonString === 'string' ? JSON.parse(optionsJsonString || "{}") : optionsJsonString;
					let answer: any = null; try { answer = typeof answerJsonString === 'string' ? JSON.parse(answerJsonString || "null") : answerJsonString; } catch { answer = answerJsonString; }
					const qTypeId = normalized.questionTypeId;
					const typeLabel = (qtRes.data || []).find(t => t.questionTypeId === qTypeId)?.questionType;
					if (typeLabel === QUESTION_TYPES.SINGLE_MCQ || typeLabel === QUESTION_TYPES.MULTIPLE_MCQ) {
						let opts: any[] = optsObj.options || [];
						if (!Array.isArray(opts)) opts = [];
						// Ensure at least 4 option boxes
						if (opts.length < 4) opts = [...opts, ...Array(4 - opts.length).fill("")];
						setQuestionOptions({ options: opts, answer: Array.isArray(answer) ? answer : [] });
					} else if (typeLabel === QUESTION_TYPES.MATCH_PAIRS_SINGLE) {
						setQuestionOptions({ options: [optsObj.left || [], optsObj.right || []], answer: answer?.map?.(([, r]: any) => r) || [] });
					} else if (typeLabel === QUESTION_TYPES.MATCH_PAIRS_MULTIPLE) {
						setQuestionOptions({ options: [optsObj.left || [], optsObj.right || []], answer: answer || [] });
					} else if (typeLabel === QUESTION_TYPES.NUMERIC || typeLabel === QUESTION_TYPES.FILL_ANSWER) {
						setQuestionOptions({ options: [], answer });
					} else if (typeLabel === QUESTION_TYPES.TRUEFALSE) {
						setQuestionOptions({ options: ["True", "False"], answer: Array.isArray(answer) ? answer : (answer ? [answer] : []) });
					} else if (typeLabel === QUESTION_TYPES.WRITE_UP) {
						setQuestionOptions({ options: [], answer: [] });
					} else {
						setQuestionOptions({ options: optsObj.options || [], answer });
					}
				} catch { /* ignore parse */ }

				const subRes = await fetchSubjectsAction();
				if (subRes.status === 200) {
					const list = subRes.data || [];
					const normalize = (v?: string) => (v ?? '').trim().toLowerCase();
					const clean = (v?: string) => normalize(v).replace(/[^a-z]/g, '');
					const sel = clean(normalized.language);
					const languageRows = list.filter(s => { const subjLang = clean(s.language); if (!sel) return true; if (!subjLang) return true; return subjLang === sel || subjLang.includes(sel) || sel.includes(subjLang); });
					setAllLanguageSubjects(languageRows);
					const isType = (s: any, t: string) => (s?.subjectType ?? '').toString().trim().toLowerCase() === t;
					const subjectRows = languageRows.filter(s => isType(s, 'subject'));
					setSubjects(subjectRows);
					// Direct binding using provided subject/chapter/topic IDs (if any)
					const subjectId = normalized.subjectId;
					const chapterId = normalized.chapterId;
					const topicId = normalized.topicId;
					if (subjectId) {
						setChapters(languageRows.filter(s => isType(s, 'chapter') && s.parentId === subjectId));
					}
					if (chapterId) {
						const byId: Record<number, GetSubjectsResponse> = Object.fromEntries(languageRows.map(s => [s.subjectId, s]));
						const topicsDirect = languageRows.filter(s => isType(s, 'topic') && s.parentId === chapterId);
						const subTopics = languageRows.filter(s => isType(s, 'sub topic') && (() => { const p = s.parentId ? byId[s.parentId] : undefined; return p && isType(p, 'topic') && p.parentId === chapterId; })());
						const mapped: GetTopicsResponse[] = [...topicsDirect, ...subTopics].map(s => ({ topicId: s.subjectId, topicName: s.subjectName, subjectId: s.parentId }));
						setTopics(mapped);
					}
					setQuestionsMeta(m => ({ ...m, subjectId, chapterId, topicId }));
				}

				const diffRes = await fetchDifficultyLevelsAction(normalized.language);
				if (diffRes.status === 200) setDifficultyLevels(diffRes.data || []);
			} catch (e) {
				console.error(e);
				toast.error("Error loading question");
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => { cancelled = true; };
	}, [id]);

	const currentTypeLabel = questionTypes.find(qt => qt.questionTypeId === questionsMeta.questionType)?.questionType;

	const buildPayload = (): Partial<CreateQuestionRequest> | null => {
		if (!currentTypeLabel) { toast.error("Question Type required"); return null; }
		if (!question.trim()) { toast.error("Question is required"); return null; }
		if (!questionsMeta.languageId) { toast.error("Language is required"); return null; }
		// Only Subject is required; Chapter/Topic are optional
		if (!questionsMeta.subjectId) { toast.error("Subject is required"); return null; }
		if (!questionsMeta.difficulty) { toast.error("Difficulty required"); return null; }
		if (!questionsMeta.marks) { toast.error("Marks required"); return null; }

		// Validate answer options based on question type
		const validateByType = () => {
			const ans = questionOptions?.answer;
			const opts = questionOptions?.options;

			switch (currentTypeLabel) {
				case QUESTION_TYPES.SINGLE_MCQ:
				case QUESTION_TYPES.MULTIPLE_MCQ: {
					if (!opts || !Array.isArray(opts) || opts.length === 0) {
						return { ok: false, msg: "Options are required" };
					}
					if (!ans || !Array.isArray(ans) || ans.length === 0) {
						return { ok: false, msg: "Please select at least one correct answer" };
					}
					return { ok: true };
				}
				case QUESTION_TYPES.MATCH_PAIRS_SINGLE:
				case QUESTION_TYPES.MATCH_PAIRS_MULTIPLE: {
					if (!opts || !Array.isArray(opts) || opts.length < 2) {
						return { ok: false, msg: "Match pair columns are required" };
					}
					const left = opts[0] || [];
					const right = opts[1] || [];
					if (!Array.isArray(left) || !Array.isArray(right) || left.length === 0 || right.length === 0) {
						return { ok: false, msg: "Both match pair columns must have options" };
					}
					if (!ans || (Array.isArray(ans) && ans.length === 0)) {
						return { ok: false, msg: "Please select answer pairs" };
					}
					return { ok: true };
				}
				case QUESTION_TYPES.TRUEFALSE: {
					if (!ans || !Array.isArray(ans) || ans.length === 0) {
						return { ok: false, msg: "Please select True or False" };
					}
					return { ok: true };
				}
				case QUESTION_TYPES.NUMERIC: {
					if (ans === undefined || ans === null || ans === "") {
						return { ok: false, msg: "Numeric answer is required" };
					}
					const text = String(ans).trim();
					if (!text) {
						return { ok: false, msg: "Numeric answer cannot be empty" };
					}
					return { ok: true };
				}
				case QUESTION_TYPES.FILL_ANSWER: {
					if (ans === undefined || ans === null) {
						return { ok: false, msg: "Answer is required" };
					}
					const text = String(ans).trim();
					if (!text) {
						return { ok: false, msg: "Answer cannot be empty" };
					}
					return { ok: true };
				}
				case QUESTION_TYPES.WRITE_UP: {
					// No answer required for Write Up type
					return { ok: true };
				}
				default: {
					// Generic validation for other types
					if (ans === undefined || ans === null) {
						return { ok: false, msg: "Answer is required" };
					}
					const text = Array.isArray(ans) ? ans.join("") : String(ans ?? "");
					if (!text.trim()) {
						return { ok: false, msg: "Answer is required" };
					}
					return { ok: true };
				}
			}
		};

		const validation = validateByType();
		if (!validation.ok) {
			toast.error(validation.msg || "Please complete the answer options");
			return null;
		}

		let optionsStr = ""; let answerStr = ""; const qo = questionOptions;
		if (currentTypeLabel === QUESTION_TYPES.SINGLE_MCQ) { optionsStr = JSON.stringify({ type: "mcq-single", options: qo?.options || [] }); answerStr = JSON.stringify(qo?.answer || []); }
		else if (currentTypeLabel === QUESTION_TYPES.MULTIPLE_MCQ) { optionsStr = JSON.stringify({ type: "mcq-multiple", options: qo?.options || [] }); answerStr = JSON.stringify(qo?.answer || []); }
		else if (currentTypeLabel === QUESTION_TYPES.MATCH_PAIRS_SINGLE) { const cols = (qo?.options || []) as any[]; const left = cols[0] || []; const right = cols[1] || []; const pairs = (qo?.answer || []).map((r: string, i: number) => [left[i], r]).filter(([l, r]: any) => l && r); optionsStr = JSON.stringify({ type: "match-pair-single", left, right }); answerStr = JSON.stringify(pairs); }
		else if (currentTypeLabel === QUESTION_TYPES.MATCH_PAIRS_MULTIPLE) { const cols = (qo?.options || []) as any[]; const left = cols[0] || []; const right = cols[1] || []; optionsStr = JSON.stringify({ type: "match-pair-multiple", left, right }); answerStr = JSON.stringify(qo?.answer || []); }
		else if (currentTypeLabel === QUESTION_TYPES.NUMERIC) { optionsStr = JSON.stringify({ type: "numeric" }); answerStr = JSON.stringify(qo?.answer ?? ""); }
		else if (currentTypeLabel === QUESTION_TYPES.TRUEFALSE) { optionsStr = JSON.stringify({ type: "truefalse", options: ["True", "False"] }); answerStr = JSON.stringify(qo?.answer || []); }
		else if (currentTypeLabel === QUESTION_TYPES.FILL_ANSWER) { optionsStr = JSON.stringify({ type: "fill-answer" }); answerStr = JSON.stringify(qo?.answer ?? ""); }
		else if (currentTypeLabel === QUESTION_TYPES.WRITE_UP) { optionsStr = JSON.stringify({ type: "write-up" }); answerStr = JSON.stringify(""); }
		else { optionsStr = JSON.stringify(qo?.options || []); answerStr = JSON.stringify(qo?.answer || ""); }
		return {
			question: question.trim(),
			headerText: questionHeader,
			explanation: explanation.trim(),
			videoSolURL: videoSolWebURL || videoSolMobileURL || undefined,
			videoSolMobileURL: videoSolMobileURL || undefined,
			...(batchNo?.trim() ? { batchNo: batchNo.trim(), BatchNo: batchNo.trim(), BatchNumber: batchNo.trim() } : {}),
			questionsMeta: {
				tags: questionsMeta.tags,
				marks: questionsMeta.marks,
				negativeMarks: questionsMeta.negativeMarks,
				graceMarks: questionsMeta.graceMarks,
				duration: questionsMeta.duration || 0,
				difficultyLevelId: questionsMeta.difficulty,
				questionTypeId: questionsMeta.questionType,
				questionTypeName: currentTypeLabel || undefined,
				chapterId: questionsMeta.chapterId || 0,
				// Backend expects SubjectID as the most specific node: use Topic when selected; else Subject
				subjectId: questionsMeta.topicId ? questionsMeta.topicId : questionsMeta.subjectId,
				// TopicId should be the selected Topic, or fall back to Subject when no Topic chosen
				topicId: questionsMeta.topicId || questionsMeta.subjectId || 0,
				language: questionsMeta.languageId,
				writeUpId: questionsMeta.writeUpId,
				headerText: questionHeader,
				allowCandidateComments: questionsMeta.allowComments,
				...(batchNo?.trim() ? { batchNo: batchNo.trim(), BatchNo: batchNo.trim(), BatchNumber: batchNo.trim() } : {}),
			},
			options: { options: optionsStr, answer: answerStr },
			isActive: questionStatus,
			duration: questionsMeta.duration || 0,
			Duration: questionsMeta.duration || 0,
		};

		const navigateBack = () => {
			if (returnTo) router.push(returnTo);
			else router.push("/admin/questions");
		};
	};

	const handleUpdate = async () => {
		if (saving) return;
		const payload = buildPayload();
		if (!payload) return; setSaving(true); const res = await updateQuestionAction(id, payload); setSaving(false);
		if (res.error) { toast.error(res.errorMessage || "Update failed"); }
		else { setShowSuccessModal(true); }
	};

	// Keep page mounted; show an overlay loader to match test page style.

	const completedCount = [questionsMeta.languageId, questionsMeta.subjectId, questionsMeta.questionType, questionsMeta.difficulty].filter(Boolean).length;

	return (
		<div className="min-h-screen bg-gray-50 relative">
			<div className="bg-white border-b border-gray-200 sticky top-0 z-10">
				<div className="w-[85%] mx-auto px-6 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<Link href={returnTo || "/admin/questions"} className="text-gray-500 hover:text-gray-700 transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
							<div className="flex items-center gap-2">
								<div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center"><HelpCircle className="w-4 h-4 text-indigo-600" /></div>
								<h1 className="text-2xl font-semibold text-gray-900">Edit Question</h1>
							</div>
						</div>
						<div className="flex items-center gap-4">
							<Link href={returnTo || "/admin/questions"} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Cancel</Link>
							<div className="flex items-center gap-3">
								<button onClick={handleUpdate} disabled={saving} className={`px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm transition-colors ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{saving ? 'Updating...' : 'Update Question'}</button>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="w-[85%] mx-auto px-6 py-8">
				<div className="grid grid-cols-12 gap-8">
					<div className="col-span-12 lg:col-span-4 xl:col-span-3">
						<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
							<div className="flex items-center gap-2 mb-6">
								<div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center"><span className="text-blue-600 text-sm font-bold">⚙️</span></div>
								<h2 className="text-lg font-semibold text-gray-900">Question Configuration</h2>
							</div>
							<div className="space-y-6">
								<div className="space-y-2">
									<label className="block text-sm font-medium text-gray-700">Language <span className="text-red-500">*</span></label>
									<select
										value={questionsMeta.languageId}
										onChange={async (e) => {
											const lang = e.target.value.trim();
											setQuestionsMeta(p => ({ ...p, languageId: lang, subjectId: 0, chapterId: 0, topicId: 0, difficulty: 0 }));
											setSubjects([]); setChapters([]); setTopics([]); setDifficultyLevels([]);
											if (!lang) return;
											const [subRes, diffRes] = await Promise.all([fetchSubjectsAction(), fetchDifficultyLevelsAction(lang)]);
											if (subRes.status === 200) {
												const normalize = (v?: string) => (v ?? '').trim().toLowerCase();
												const clean = (v?: string) => normalize(v).replace(/[^a-z]/g, '');
												const sel = clean(lang);
												const languageRows = (subRes.data || []).filter(s => { const sl = clean(s.language); if (!sel) return true; if (!sl) return true; return sl === sel || sl.includes(sel) || sel.includes(sl); });
												setAllLanguageSubjects(languageRows);
												const isType = (s: any, t: string) => (s?.subjectType ?? '').toString().trim().toLowerCase() === t;
												setSubjects(languageRows.filter(s => isType(s, 'subject')));
											}
											if (diffRes.status === 200) setDifficultyLevels(diffRes.data || []);
										}}
										className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
									>
										<option value="">Select language</option>
										{languages.map(l => <option key={l.language} value={l.language}>{l.language}</option>)}
									</select>
								</div>
								<div className="space-y-2">
									<label className="block text-sm font-medium text-gray-700">Subject <span className="text-red-500">*</span></label>
									<select value={questionsMeta.subjectId || ''} onChange={(e) => { const sid = Number(e.target.value); setChapters(buildChapters(sid)); setQuestionsMeta(p => ({ ...p, subjectId: sid, chapterId: 0, topicId: 0 })); }} disabled={!questionsMeta.languageId} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"><option value="">Select subject</option>{subjects.map(s => <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>)}</select>
								</div>
								<div className="space-y-2">
									<label className="block text-sm font-medium text-gray-700">Chapter <span className="text-gray-400 text-xs font-normal">(Optional)</span></label>
									<select value={questionsMeta.chapterId || ''} onChange={(e) => { const cid = Number(e.target.value); const t = buildTopicsForChapter(cid); setTopics(t); setQuestionsMeta(p => ({ ...p, chapterId: cid, topicId: 0 })); }} disabled={!questionsMeta.subjectId} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"><option value="">Select chapter</option>{chapters.map(c => <option key={c.subjectId} value={c.subjectId}>{c.subjectName}</option>)}</select>
								</div>
								<div className="space-y-2">
									<label className="block text-sm font-medium text-gray-700">Topic <span className="text-gray-400 text-xs font-normal">(Optional)</span></label>
									<select value={questionsMeta.topicId || ''} onChange={(e) => setQuestionsMeta(p => ({ ...p, topicId: Number(e.target.value) }))} disabled={!questionsMeta.chapterId} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"><option value="">Select topic</option>{topics.map(t => <option key={t.topicId} value={t.topicId}>{t.topicName}</option>)}</select>
								</div>
								<div className="space-y-2">
									<label className="block text-sm font-medium text-gray-700">Question Type <span className="text-red-500">*</span></label>
									<select
										value={questionsMeta.questionType || ''}
										onChange={(e) => { /* Disabled permanently in edit mode */ }}
										disabled
										title="Question Type cannot be changed after creation"
										className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-gray-100 text-gray-600 cursor-not-allowed">
										<option value="">Select type</option>
										{questionTypes.map(q => <option key={q.questionTypeId} value={q.questionTypeId}>{q.questionType}</option>)}
									</select>
									<p className="text-xs text-gray-500">Locked: cannot modify question type in edit mode.</p>
								</div>
								<div className="space-y-2">
									<label className="block text-sm font-medium text-gray-700">Difficulty Level <span className="text-red-500">*</span></label>
									<select value={questionsMeta.difficulty || ''} onChange={(e) => setQuestionsMeta(p => ({ ...p, difficulty: Number(e.target.value) }))} disabled={!questionsMeta.languageId} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"><option value="">Select difficulty</option>{difficultyLevels.map(d => <option key={d.questionDifficultylevelId} value={d.questionDifficultylevelId}>{d.questionDifficultylevel1}</option>)}</select>
								</div>
								<div className="space-y-4 pt-4 border-t border-gray-200">
									<h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><div className="w-4 h-4 bg-emerald-100 rounded flex items-center justify-center"><span className="text-emerald-600 text-xs font-bold">%</span></div>Marks Configuration</h3>
									<div className="grid grid-cols-2 gap-3">
										<div className="space-y-1"><label className="block text-xs font-medium text-gray-600">Right Marks <span className="text-red-500">*</span></label><input type="number" min={0} value={questionsMeta.marks || ''} onChange={(e) => setQuestionsMeta(p => ({ ...p, marks: Number(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" /></div>
										<div className="space-y-1"><label className="block text-xs font-medium text-gray-600">Negative Marks</label><input type="number" min={0} value={questionsMeta.negativeMarks || ''} onChange={(e) => setQuestionsMeta(p => ({ ...p, negativeMarks: Number(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" /></div>
									</div>
									<div className="space-y-4">
										<div className="space-y-1"><label className="block text-xs font-medium text-gray-600">Grace Marks</label><input type="number" min={0} value={questionsMeta.graceMarks || ''} onChange={(e) => setQuestionsMeta(p => ({ ...p, graceMarks: Number(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" /></div>
										<div className="space-y-1"><label className="block text-xs font-medium text-gray-600">Duration (sec)</label><input type="number" min={0} value={questionsMeta.duration || ''} onChange={(e) => setQuestionsMeta(p => ({ ...p, duration: Number(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" /></div>
										<div className="space-y-1">
											<label className="block text-xs font-medium text-gray-600">Allow Comments</label>
											<div className="flex items-center gap-4 px-3 py-2 rounded-lg w-full">
												<label className="inline-flex items-center gap-1 text-xs"><input type="radio" className="h-5 w-5 accent-indigo-600 focus:ring-indigo-500" name="allowComments" value="0" checked={questionsMeta.allowComments === 0} onChange={() => setQuestionsMeta(p => ({ ...p, allowComments: 0 }))} /> No</label>
												<label className="inline-flex items-center gap-1 text-xs"><input type="radio" className="h-5 w-5 accent-indigo-600 focus:ring-indigo-500" name="allowComments" value="1" checked={questionsMeta.allowComments === 1} onChange={() => setQuestionsMeta(p => ({ ...p, allowComments: 1 }))} /> Yes</label>
											</div>
										</div>
									</div>
								</div>
								<div className="space-y-4 pt-4 border-t border-gray-200">
									<h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><div className="w-4 h-4 bg-purple-100 rounded flex items-center justify-center"><span className="text-purple-600 text-xs font-bold">+</span></div>Additional Options</h3>
									<div className="space-y-3">
										<div className="space-y-1"><label className="block text-xs font-medium text-gray-600">Batch No</label><input value={batchNo} onChange={(e) => setBatchNo(e.target.value)} placeholder="Enter batch number (optional)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" /></div>
										<div className="space-y-1"><label className="block text-xs font-medium text-gray-600">Tags</label><input value={questionsMeta.tags} onChange={(e) => setQuestionsMeta(p => ({ ...p, tags: e.target.value }))} placeholder="Add tags (comma separated)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" /></div>
										<div className="space-y-1">
											<label className="block text-xs font-medium text-gray-600">Question Status</label>
											<select value={questionStatus} onChange={(e) => setQuestionStatus(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
												<option value={1}>Active</option>
												<option value={0}>InActive</option>
											</select>
											<p className="text-[10px] text-gray-500 mt-1">Set to InActive to hide this question from usage.</p>
										</div>
										<div className="space-y-1"><label className="block text-xs font-medium text-gray-600">Write Up</label><select value={questionsMeta.writeUpId ?? ''} onChange={(e) => setQuestionsMeta(p => ({ ...p, writeUpId: e.target.value ? Number(e.target.value) : null }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"><option value="">None</option>{writeUps.map(w => <option key={w.writeUpId} value={w.writeUpId}>{w.writeUpName}</option>)}</select></div>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="col-span-12 lg:col-span-8 xl:col-span-9">
						<div className="space-y-6">
							<div className="bg-white rounded-lg shadow-sm border border-gray-200">
								<div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-6 h-6 bg-indigo-100 rounded-md flex items-center justify-center"><span className="text-indigo-600 text-sm font-bold">📊</span></div><span className="text-sm font-semibold text-gray-900">Configuration Progress</span></div><span className="text-sm text-gray-600 font-medium">{completedCount}/4 Complete</span></div></div>
								<div className="p-4"><div className="space-y-3">
									<div className="w-full bg-gray-200 rounded-full h-2">
										<div className="bg-gradient-to-r from-indigo-500 to-blue-600 h-2 rounded-full" style={{ width: `${(completedCount / 4) * 100}%` }} /></div>
									<div className="grid grid-cols-3 md:grid-cols-6 gap-2">{[
										{ key: 'languageId', label: 'Language', value: questionsMeta.languageId },
										{ key: 'subjectId', label: 'Subject', value: questionsMeta.subjectId },
										{ key: 'chapterId', label: 'Chapter (Optional)', value: questionsMeta.chapterId },
										{ key: 'topicId', label: 'Topic (Optional)', value: questionsMeta.topicId },
										{ key: 'questionType', label: 'Type', value: questionsMeta.questionType },
										{ key: 'difficulty', label: 'Difficulty', value: questionsMeta.difficulty }
									].map(i => <div key={i.key} className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs ${i.value ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}><div className={`w-3 h-3 rounded-full ${i.value ? 'bg-green-500' : 'bg-gray-300'}`}>{i.value ? <span className="text-white text-xs block w-full text-center leading-3">✓</span> : null}</div><span className="font-medium">{i.label}</span></div>)}
									</div></div></div>
							</div>
							<div className="bg-white rounded-lg shadow-sm border border-gray-200">
								<div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
									<div className="flex items-center gap-2"><div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center">
										<HelpCircle className="w-4 h-4 text-green-600" />
									</div>
										<span className="text-sm font-semibold text-gray-900">Question Content</span>
									</div>
								</div>
								<div className="p-4 space-y-6"><div><label className="block text-sm font-semibold text-gray-700 mb-3">Question Header (Optional)</label>
									<div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500">
										<RichTextEditor
											onChange={(content) => setQuestionHeader(content)}
											initialContent={questionHeader}
											placeholder="Enter question header or instructions..."
										/>
									</div>
								</div>
									<div><label className="block text-sm font-semibold text-gray-700 mb-3">Question <span className="text-red-500">*</span></label>
										<div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500">
											<RichTextEditor onChange={c => setQuestion(c)} initialContent={question} placeholder="Type your question here..." />
										</div>
									</div>
								</div>
							</div>
							<div className="bg-white rounded-lg shadow-sm border border-gray-200"><div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
								<div className="flex items-center gap-2"><div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
									<span className="text-blue-600 text-sm font-bold">◯</span></div><span className="text-sm font-semibold text-gray-900">Answer Options</span></div></div><div className="p-4">{questionsMeta.questionType ? <QuestionOptionsInput questionTypeId={questionsMeta.questionType} questionTypes={questionTypes} onDataChange={(d) => setQuestionOptions(d)} initialData={questionOptions} /> : <div className="text-center py-8"><div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-gray-400 text-2xl">◯</span></div><p className="text-gray-500 text-sm">Select a question type from the configuration panel to edit answer options</p></div>}</div></div>
							<div className="bg-white rounded-lg shadow-sm border border-gray-200"><div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-amber-50"><div className="flex items-center gap-2"><div className="w-6 h-6 bg-yellow-100 rounded-md flex items-center justify-center"><span className="text-yellow-600 text-sm font-bold">💡</span></div><span className="text-sm font-semibold text-gray-900">Explanation & Solution</span></div></div><div className="p-4 space-y-6"><div><label className="block text-sm font-semibold text-gray-700 mb-3">Explanation</label><div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-yellow-500 focus-within:border-yellow-500"><RichTextEditor onChange={c => setExplanation(c)} initialContent={explanation} placeholder="Add explanation for the correct answer..." /></div></div><div><label className="block text-sm font-semibold text-gray-700 mb-3">Video Solution URLs</label><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center"><Monitor className="h-4 w-4 text-gray-400" /></div><input type="url" value={videoSolWebURL} onChange={(e) => setVideoSolWebURL(e.target.value)} placeholder="Web URL (e.g., https://youtu.be/...)" className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-3 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-gray-50 focus:bg-white" /></div><div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center"><Smartphone className="h-4 w-4 text-gray-400" /></div><input type="url" value={videoSolMobileURL} onChange={(e) => setVideoSolMobileURL(e.target.value)} placeholder="Mobile URL" className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-3 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-gray-50 focus:bg-white" /></div></div></div></div></div>
							<div className="lg:hidden bg-white rounded-lg shadow-sm border border-gray-200 p-4"><h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3><div className="flex gap-3"><button onClick={handleUpdate} disabled={saving} className={`flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm ${saving ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{saving ? 'Updating...' : 'Update Question'}</button><Link href="/admin/questions" className="flex-1"><button className="w-full px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium bg-white hover:bg-gray-50">Cancel</button></Link></div></div>
						</div>
					</div>
				</div>
			</div>
			<ConfirmationModal
				isOpen={showSuccessModal}
				onConfirm={() => {
					setShowSuccessModal(false);
					if (returnTo) {
						try {
							const url = new URL(returnTo, window.location.origin);
							url.searchParams.set('updatedQuestionId', String(id));
							router.push(url.pathname + (url.search || '') + (url.hash || ''));
						} catch {
							// If URL parsing fails, fallback to appending param directly
							router.push(returnTo + (returnTo.includes('?') ? '&' : '?') + `updatedQuestionId=${encodeURIComponent(String(id))}`);
						}
					} else {
						router.push('/admin/questions');
					}
				}}
				onCancel={() => setShowSuccessModal(false)}
				title="Question Updated Successfully!"
				message="Your changes have been saved."
				confirmText={returnTo ? 'Back to Test' : 'Go to Questions'}
				cancelText=""
				variant="success"
			/>
			{loading && <QuestionEditSkeleton />}
		</div>
	);
}

// Global fade-in for loaded content
// (Using inline style tag here keeps scope local to this route)
// Could alternatively move to a shared CSS.
// eslint-disable-next-line @next/next/no-sync-scripts
// (Optional) Fade-in helper retained if needed for future transitions.

