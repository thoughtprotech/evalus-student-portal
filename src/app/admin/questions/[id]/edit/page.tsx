"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import RichTextEditor from "@/components/RichTextEditor";
import QuestionOptionsInput from "@/app/admin/questions/new/_components/QuestionOptionsInput";
import { QUESTION_TYPES } from "@/utils/constants";
import { fetchQuestionByIdAction } from "@/app/actions/exam/questions/getQuestionById";
import { fetchQuestionTypesAction } from "@/app/actions/dashboard/questions/fetchQuestionTypes";
import { fetchSubjectsAction } from "@/app/actions/dashboard/questions/fetchSubjects";
import { fetchTopicsAction } from "@/app/actions/dashboard/questions/fetchTopics";
import { fetchLanguagesAction } from "@/app/actions/dashboard/questions/fetchLanguages";
import { fetchWriteUpsAction } from "@/app/actions/dashboard/spotlight/fetchWriteUps";
import { fetchDifficultyLevelsAction } from "@/app/actions/dashboard/questions/fetchDifficultyLevels";
import { updateQuestionAction } from "@/app/actions/dashboard/questions/updateQuestion";
import type { GetQuestionByIdResponse, GetQuestionTypesResponse, GetSubjectsResponse, GetTopicsResponse, GetLanguagesResponse, GetWriteUpsResponse, GetDifficultyLevelsResponse, CreateQuestionRequest } from "@/utils/api/types";
import { ArrowLeft, HelpCircle, Smartphone, Monitor } from "lucide-react";
import ConfirmationModal from "@/components/ConfirmationModal";

export default function EditQuestionPage() {
	const params = useParams();
	const router = useRouter();
	const id = Number(params?.id);

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
	const [questionHeader, setQuestionHeader] = useState("");
	const [explanation, setExplanation] = useState("");
	const [videoSolWebURL, setVideoSolWebURL] = useState("");
	const [videoSolMobileURL, setVideoSolMobileURL] = useState("");
	const [questionOptions, setQuestionOptions] = useState<{ options: any; answer: any } | undefined>(undefined);

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
		freeSpace: 0,
	});

	const buildChapters = useCallback((subjectId: number) => {
		const isType = (s: any, t: string) => (s?.subjectType ?? '').toString().trim().toLowerCase() === t;
		return allLanguageSubjects.filter(s => isType(s,'chapter') && s.parentId === subjectId);
	}, [allLanguageSubjects]);

	const buildTopicsForChapter = useCallback((chapterId: number): GetTopicsResponse[] => {
		if (!chapterId) return [];
		const isType = (s: any, t: string) => (s?.subjectType ?? '').toString().trim().toLowerCase() === t;
		const byId: Record<number, GetSubjectsResponse> = Object.fromEntries((allLanguageSubjects||[]).map(s=>[s.subjectId,s]));
		const direct = allLanguageSubjects.filter(s=> isType(s,'topic') && s.parentId === chapterId);
		const sub = allLanguageSubjects.filter(s=> {
			if(!isType(s,'sub topic')) return false;
			const parent = s.parentId? byId[s.parentId]: undefined; 
			return !!(parent && isType(parent,'topic') && parent.parentId===chapterId);
		});
		const mapRow = (s: GetSubjectsResponse): GetTopicsResponse => ({ topicId: s.subjectId, topicName: s.subjectName, subjectId: s.parentId });
		return [...direct.map(mapRow), ...sub.map(mapRow)];
	}, [allLanguageSubjects]);

	// Fetch static lists
	useEffect(()=>{ (async()=>{ 
		const [qt, langs, wu] = await Promise.all([fetchQuestionTypesAction(), fetchLanguagesAction(), fetchWriteUpsAction()]);
		if(qt.status===200) setQuestionTypes(qt.data||[]);
		if(langs.status===200) setLanguages(langs.data||[]);
		if(wu.status===200) setWriteUps(wu.data||[]);
	})(); },[]);

	// Load question details
	useEffect(()=>{ if(!id) return; (async()=>{ setLoading(true); const res = await fetchQuestionByIdAction(id); if(res.status===200 && res.data){ prefill(res.data); } else { toast.error("Failed to load question"); } setLoading(false); })(); }, [id]);

	const fetchSubjectsForLang = async (language?: string) => {
		const res = await fetchSubjectsAction();
		if(res.status===200){
			const normalize = (v?: string) => (v??'').trim().toLowerCase();
			const clean = (v?: string) => normalize(v).replace(/[^a-z]/g,'');
			const sel = clean(language);
			const languageRows = (res.data||[]).filter(s=>{ if(!language) return true; const subj = clean(s.language); if(!subj) return true; return subj===sel || subj.includes(sel) || sel.includes(subj); });
			setAllLanguageSubjects(languageRows);
			const isType = (s:any,t:string)=> (s?.subjectType??'').toString().trim().toLowerCase()===t;
			setSubjects(languageRows.filter(s=> isType(s,'subject')));
		}
	};

	const prefill = (q: GetQuestionByIdResponse) => {
		setQuestion(q.questionText || "");
		setQuestionHeader(q.headerText||"");
		setExplanation(q.additionalExplanation||"");
		setVideoSolWebURL(q.videoSolutionWeburl||"");
		setVideoSolMobileURL(q.videoSolutionMobileurl||"");
		// Determine hierarchy: we only have subjectId (most specific). We'll attempt to locate its parents once subjects loaded.
		setQuestionsMeta(prev=> ({ ...prev, marks: q.marks, negativeMarks: q.negativeMarks, graceMarks: q.graceMarks, difficulty: q.questionDifficultyLevelId, questionType: q.questionTypeId, subjectId: 0, chapterId:0, topicId:0, languageId: q.language, writeUpId: q.writeUpId }));
		// Parse options/answers
		try {
			const optsObj = JSON.parse(q.questionOptionsJson||"{}");
			let answer: any = null; try { answer = JSON.parse(q.questionCorrectAnswerJson||"null"); } catch { answer = null; }
			// Normalize into shapes expected by QuestionOptionsInput
			const typeLabel = questionTypes.find(t=> t.questionTypeId === q.questionTypeId)?.questionType;
			if(typeLabel === QUESTION_TYPES.SINGLE_MCQ){
				setQuestionOptions({ options: optsObj.options || [], answer: Array.isArray(answer)? answer: [] });
			} else if(typeLabel === QUESTION_TYPES.MULTIPLE_MCQ){
				setQuestionOptions({ options: optsObj.options || [], answer: Array.isArray(answer)? answer: [] });
			} else if(typeLabel === QUESTION_TYPES.MATCH_PAIRS_SINGLE){
				setQuestionOptions({ options: [optsObj.left||[], optsObj.right||[]], answer: answer?.map?.(([,r]: any)=> r) || [] });
			} else if(typeLabel === QUESTION_TYPES.MATCH_PAIRS_MULTIPLE){
				setQuestionOptions({ options: [optsObj.left||[], optsObj.right||[]], answer: answer || [] });
			} else if(typeLabel === QUESTION_TYPES.NUMERIC || typeLabel === QUESTION_TYPES.FILL_ANSWER){
				setQuestionOptions({ options: [], answer });
			} else if(typeLabel === QUESTION_TYPES.TRUEFALSE){
				setQuestionOptions({ options: ["True","False"], answer: Array.isArray(answer)? answer: (answer? [answer]: []) });
			} else {
				setQuestionOptions({ options: optsObj.options || [], answer });
			}
			// After language subjects loaded we will map hierarchy
			fetchSubjectsForLang(q.language).then(()=>{
				setTimeout(()=>{ assignHierarchy(q.subjectId); }, 0);
				fetchDifficultyLevelsAction(q.language).then(dl=> { if(dl.status===200) setDifficultyLevels(dl.data||[]); });
			});
		} catch {
			// ignore
		}
	};

	const assignHierarchy = (specificSubjectId: number) => {
		// The specificSubjectId may be a topic or chapter or subject. We'll find its lineage by parentId chain.
		const byId: Record<number, GetSubjectsResponse> = Object.fromEntries((allLanguageSubjects||[]).map(s=>[s.subjectId,s]));
		let current = byId[specificSubjectId];
		if(!current) return;
		const chain: GetSubjectsResponse[] = [current];
		while(current?.parentId){ const next = byId[current.parentId]; if(!next) break; chain.push(next); current = next; }
		// chain now from specific up to root; reverse to subject->chapter->...; classify by subjectType
		const findType = (t: string) => chain.find(s=> (s.subjectType||'').toLowerCase()===t)?.subjectId || 0;
		const subjectId = findType('subject');
		const chapterId = findType('chapter');
		const topicId = findType('topic') || findType('sub topic') || (chain[0]?.subjectType?.toLowerCase()==='topic'? chain[0].subjectId:0);
		if(subjectId){ setChapters(buildChapters(subjectId)); }
		if(chapterId){ setTopics(buildTopicsForChapter(chapterId)); }
		setQuestionsMeta(prev=> ({ ...prev, subjectId, chapterId, topicId }));
	};

	// When allLanguageSubjects changes and we have a meta.topicId==0 but subjectType chain unresolved try again
		useEffect(()=>{ 
			// Attempt hierarchy assignment once subjects are loaded and we have a language but no subject mapping yet.
			if(allLanguageSubjects.length && questionsMeta.languageId && questionsMeta.subjectId===0){
				// We defer actual mapping to assignHierarchy when prefill runs with subjectId; nothing additional here.
			}
		}, [allLanguageSubjects, questionsMeta.languageId, questionsMeta.subjectId]);

	const currentTypeLabel = questionTypes.find(qt=> qt.questionTypeId === questionsMeta.questionType)?.questionType;

	const buildPayload = (): Partial<CreateQuestionRequest> | null => {
		// replicate logic from create page simplified
		if(!currentTypeLabel){ toast.error("Question Type required"); return null; }
		// Validate minimal required fields
		if(!question.trim()) { toast.error("Question is required"); return null; }
		if(!questionsMeta.languageId) { toast.error("Language is required"); return null; }
		if(!questionsMeta.subjectId || !questionsMeta.chapterId || !questionsMeta.topicId){ toast.error("Subject hierarchy incomplete"); return null; }
		if(!questionsMeta.difficulty) { toast.error("Difficulty required"); return null; }
		if(!questionsMeta.marks) { toast.error("Marks required"); return null; }
		let optionsStr = ""; let answerStr = "";
		const qo = questionOptions;
		if(currentTypeLabel===QUESTION_TYPES.SINGLE_MCQ){
			optionsStr = JSON.stringify({ type:"mcq-single", options: qo?.options||[] });
			answerStr = JSON.stringify(qo?.answer||[]);
		} else if(currentTypeLabel===QUESTION_TYPES.MULTIPLE_MCQ){
			optionsStr = JSON.stringify({ type:"mcq-multiple", options: qo?.options||[] });
			answerStr = JSON.stringify(qo?.answer||[]);
		} else if(currentTypeLabel===QUESTION_TYPES.MATCH_PAIRS_SINGLE){
			const cols = (qo?.options||[]) as any[]; const left = cols[0]||[]; const right = cols[1]||[]; const pairs = (qo?.answer||[]).map((r:string,i:number)=> [left[i], r]).filter(([l,r]:any)=> l && r); optionsStr = JSON.stringify({ type:"match-pair-single", left, right }); answerStr = JSON.stringify(pairs);
		} else if(currentTypeLabel===QUESTION_TYPES.MATCH_PAIRS_MULTIPLE){
			const cols = (qo?.options||[]) as any[]; const left = cols[0]||[]; const right = cols[1]||[]; optionsStr = JSON.stringify({ type:"match-pair-multiple", left, right }); answerStr = JSON.stringify(qo?.answer||[]);
		} else if(currentTypeLabel===QUESTION_TYPES.NUMERIC){ optionsStr = JSON.stringify({ type:"numeric" }); answerStr = JSON.stringify(qo?.answer ?? ""); }
		else if(currentTypeLabel===QUESTION_TYPES.TRUEFALSE){ optionsStr = JSON.stringify({ type:"truefalse", options:["True","False"] }); answerStr = JSON.stringify(qo?.answer||[]); }
		else if(currentTypeLabel===QUESTION_TYPES.FILL_ANSWER){ optionsStr = JSON.stringify({ type:"fill-answer" }); answerStr = JSON.stringify(qo?.answer ?? ""); }
		else if(currentTypeLabel===QUESTION_TYPES.WRITE_UP){ optionsStr = JSON.stringify({ type:"write-up" }); answerStr = JSON.stringify(""); }
		else { optionsStr = JSON.stringify(qo?.options||[]); answerStr = JSON.stringify(qo?.answer||""); }

		return {
			question: question.trim(),
			headerText: questionHeader,
			explanation: explanation.trim(),
			videoSolURL: videoSolWebURL || videoSolMobileURL || undefined,
			videoSolMobileURL: videoSolMobileURL || undefined,
			questionsMeta: {
				tags: questionsMeta.tags,
				marks: questionsMeta.marks,
				negativeMarks: questionsMeta.negativeMarks,
				graceMarks: questionsMeta.graceMarks,
				difficultyLevelId: questionsMeta.difficulty,
				questionTypeId: questionsMeta.questionType,
				subjectId: questionsMeta.topicId || questionsMeta.subjectId,
				topicId: questionsMeta.topicId,
				language: questionsMeta.languageId,
				writeUpId: questionsMeta.writeUpId,
				headerText: questionHeader,
			},
			options: { options: optionsStr, answer: answerStr },
		};
	};

	const handleUpdate = async () => {
		if(saving) return; const payload = buildPayload(); if(!payload) return; setSaving(true); const res = await updateQuestionAction(id, payload); setSaving(false); if(res.error){ toast.error(res.errorMessage||"Update failed"); } else { toast.success("Question updated"); setShowSuccessModal(true); }
	};

		if(loading){ return <div className="p-8">Loading...</div>; }

		const completedCount = [questionsMeta.languageId, questionsMeta.subjectId, questionsMeta.chapterId, questionsMeta.topicId, questionsMeta.questionType, questionsMeta.difficulty].filter(Boolean).length;

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
									<h1 className="text-2xl font-semibold text-gray-900">Edit Question</h1>
								</div>
							</div>
							<div className="flex items-center gap-4">
												<Link href="/admin/questions" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
													Cancel
												</Link>
								<div className="flex items-center gap-3">
									<button
										onClick={handleUpdate}
										disabled={saving}
										className={`px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm transition-colors ${
											saving
												? 'bg-gray-400 cursor-not-allowed'
												: 'bg-indigo-600 hover:bg-indigo-700'
										}`}
									>
										{saving ? 'Updating...' : 'Update Question'}
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Two Column Layout */}
				<div className="w-[85%] mx-auto px-6 py-8">
					<div className="grid grid-cols-12 gap-8">
						{/* Left Sidebar */}
						<div className="col-span-12 lg:col-span-4 xl:col-span-3">
							<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
								<div className="flex items-center gap-2 mb-6">
									<div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
										<span className="text-blue-600 text-sm font-bold">⚙️</span>
									</div>
									<h2 className="text-lg font-semibold text-gray-900">Question Configuration</h2>
								</div>

								<div className="space-y-6">
									{/* Language */}
									<div className="space-y-2">
										<label className="block text-sm font-medium text-gray-700">Language <span className="text-red-500">*</span></label>
										<select
											value={questionsMeta.languageId}
											onChange={(e)=>{ const lang = e.target.value.trim(); setQuestionsMeta(p=> ({...p, languageId: lang, subjectId:0, chapterId:0, topicId:0, difficulty:0})); if(lang){ fetchSubjectsForLang(lang); fetchDifficultyLevelsAction(lang).then(r=> { if(r.status===200) setDifficultyLevels(r.data||[]); }); }}}
											className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
										>
											<option value="">Select language</option>
											{languages.map(l=> <option key={l.language} value={l.language}>{l.language}</option>)}
										</select>
									</div>

									{/* Subject */}
									<div className="space-y-2">
										<label className="block text-sm font-medium text-gray-700">Subject <span className="text-red-500">*</span></label>
										<select
											value={questionsMeta.subjectId || ''}
											onChange={(e)=> { const sid = Number(e.target.value); setChapters(buildChapters(sid)); setQuestionsMeta(p=> ({...p, subjectId: sid, chapterId:0, topicId:0})); }}
											disabled={!questionsMeta.languageId}
											className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
										>
											<option value="">Select subject</option>
											{subjects.map(s=> <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>)}
										</select>
									</div>

									{/* Chapter */}
									<div className="space-y-2">
										<label className="block text-sm font-medium text-gray-700">Chapter <span className="text-red-500">*</span></label>
										<select
											value={questionsMeta.chapterId || ''}
											onChange={(e)=> { const cid = Number(e.target.value); const t = buildTopicsForChapter(cid); setTopics(t); setQuestionsMeta(p=> ({...p, chapterId: cid, topicId:0})); }}
											disabled={!questionsMeta.subjectId}
											className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
										>
											<option value="">Select chapter</option>
											{chapters.map(c=> <option key={c.subjectId} value={c.subjectId}>{c.subjectName}</option>)}
										</select>
									</div>

									{/* Topic */}
									<div className="space-y-2">
										<label className="block text-sm font-medium text-gray-700">Topic <span className="text-red-500">*</span></label>
										<select
											value={questionsMeta.topicId || ''}
											onChange={(e)=> setQuestionsMeta(p=> ({...p, topicId: Number(e.target.value)}))}
											disabled={!questionsMeta.chapterId}
											className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
										>
											<option value="">Select topic</option>
											{topics.map(t=> <option key={t.topicId} value={t.topicId}>{t.topicName}</option>)}
										</select>
									</div>

									{/* Question Type */}
									<div className="space-y-2">
										<label className="block text-sm font-medium text-gray-700">Question Type <span className="text-red-500">*</span></label>
										<select
											value={questionsMeta.questionType || ''}
											onChange={(e)=> setQuestionsMeta(p=> ({...p, questionType: Number(e.target.value)}))}
											disabled={!questionsMeta.topicId}
											className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
										>
											<option value="">Select type</option>
											{questionTypes.map(q=> <option key={q.questionTypeId} value={q.questionTypeId}>{q.questionType}</option>)}
										</select>
									</div>

									{/* Difficulty */}
									<div className="space-y-2">
										<label className="block text-sm font-medium text-gray-700">Difficulty Level <span className="text-red-500">*</span></label>
										<select
											value={questionsMeta.difficulty || ''}
											onChange={(e)=> setQuestionsMeta(p=> ({...p, difficulty: Number(e.target.value)}))}
											disabled={!questionsMeta.languageId}
											className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
										>
											<option value="">Select difficulty</option>
											{difficultyLevels.map(d=> <option key={d.questionDifficultylevelId} value={d.questionDifficultylevelId}>{d.questionDifficultylevel1}</option>)}
										</select>
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
												<label className="block text-xs font-medium text-gray-600">Right Marks <span className="text-red-500">*</span></label>
												<input type="number" min={0} value={questionsMeta.marks || ''} onChange={(e)=> setQuestionsMeta(p=> ({...p, marks: Number(e.target.value)}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
											</div>
											<div className="space-y-1">
												<label className="block text-xs font-medium text-gray-600">Negative Marks</label>
												<input type="number" min={0} value={questionsMeta.negativeMarks || ''} onChange={(e)=> setQuestionsMeta(p=> ({...p, negativeMarks: Number(e.target.value)}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
											</div>
										</div>
										<div className="grid grid-cols-2 gap-3">
											<div className="space-y-1">
												<label className="block text-xs font-medium text-gray-600">Grace Marks</label>
												<input type="number" min={0} value={questionsMeta.graceMarks || ''} onChange={(e)=> setQuestionsMeta(p=> ({...p, graceMarks: Number(e.target.value)}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
											</div>
											<div className="space-y-1">
												<label className="block text-xs font-medium text-gray-600">Free Space</label>
												<select value={questionsMeta.freeSpace} onChange={(e)=> setQuestionsMeta(p=> ({...p, freeSpace: Number(e.target.value) as 0|1}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"><option value={0}>No</option><option value={1}>Yes</option></select>
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
												<input value={questionsMeta.tags} onChange={(e)=> setQuestionsMeta(p=> ({...p, tags: e.target.value}))} placeholder="Add tags (comma separated)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
											</div>
											<div className="space-y-1">
												<label className="block text-xs font-medium text-gray-600">Write Up</label>
												<select value={questionsMeta.writeUpId ?? ''} onChange={(e)=> setQuestionsMeta(p=> ({...p, writeUpId: e.target.value? Number(e.target.value): null}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"><option value="">None</option>{writeUps.map(w=> <option key={w.writeUpId} value={w.writeUpId}>{w.writeUpName}</option>)}</select>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Right Column */}
						<div className="col-span-12 lg:col-span-8 xl:col-span-9">
							<div className="space-y-6">
								{/* Configuration Progress */}
								<div className="bg-white rounded-lg shadow-sm border border-gray-200">
									<div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<div className="w-6 h-6 bg-indigo-100 rounded-md flex items-center justify-center"><span className="text-indigo-600 text-sm font-bold">📊</span></div>
												<span className="text-sm font-semibold text-gray-900">Configuration Progress</span>
											</div>
											<span className="text-sm text-gray-600 font-medium">{completedCount}/6 Complete</span>
										</div>
									</div>
									<div className="p-4">
										<div className="space-y-3">
											<div className="w-full bg-gray-200 rounded-full h-2">
												<div className="bg-gradient-to-r from-indigo-500 to-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${(completedCount / 6) * 100}%` }} />
											</div>
											<div className="grid grid-cols-3 md:grid-cols-6 gap-2">
												{[
													{ key: 'languageId', label: 'Language', value: questionsMeta.languageId },
													{ key: 'subjectId', label: 'Subject', value: questionsMeta.subjectId },
													{ key: 'chapterId', label: 'Chapter', value: questionsMeta.chapterId },
													{ key: 'topicId', label: 'Topic', value: questionsMeta.topicId },
													{ key: 'questionType', label: 'Type', value: questionsMeta.questionType },
													{ key: 'difficulty', label: 'Difficulty', value: questionsMeta.difficulty },
												].map(i => (
													<div key={i.key} className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs ${i.value ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
														<div className={`w-3 h-3 rounded-full ${i.value ? 'bg-green-500' : 'bg-gray-300'}`}>{i.value ? <span className="text-white text-xs block w-full text-center leading-3">✓</span> : null}</div>
														<span className="font-medium">{i.label}</span>
													</div>
												))}
											</div>
										</div>
									</div>
								</div>

								{/* Question Content */}
								<div className="bg-white rounded-lg shadow-sm border border-gray-200 transition-shadow hover:shadow-md">
									<div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
										<div className="flex items-center gap-2">
											<div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center"><HelpCircle className="w-4 h-4 text-green-600" /></div>
											<span className="text-sm font-semibold text-gray-900">Question Content</span>
										</div>
									</div>
									<div className="p-4 space-y-6">
										<div>
											<label className="block text-sm font-semibold text-gray-700 mb-3">Question Header (Optional)</label>
											<input value={questionHeader} onChange={(e)=> setQuestionHeader(e.target.value)} placeholder="Enter question header or instructions..." className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 focus:bg-white" />
										</div>
										<div>
											<label className="block text-sm font-semibold text-gray-700 mb-3">Question <span className="text-red-500">*</span></label>
											<div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500">
												<RichTextEditor onChange={c=> setQuestion(c)} initialContent={question} placeholder="Type your question here..." />
											</div>
										</div>
									</div>
								</div>

								{/* Answer Options */}
								<div className="bg-white rounded-lg shadow-sm border border-gray-200 transition-shadow hover:shadow-md">
									<div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
										<div className="flex items-center gap-2">
											<div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center"><span className="text-blue-600 text-sm font-bold">◯</span></div>
											<span className="text-sm font-semibold text-gray-900">Answer Options</span>
										</div>
									</div>
									<div className="p-4">
										{questionsMeta.questionType ? (
											<QuestionOptionsInput questionTypeId={questionsMeta.questionType} questionTypes={questionTypes} onDataChange={(d)=> setQuestionOptions(d)} initialData={questionOptions} />
										) : (
											<div className="text-center py-8">
												<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-gray-400 text-2xl">◯</span></div>
												<p className="text-gray-500 text-sm">Select a question type from the configuration panel to edit answer options</p>
											</div>
										)}
									</div>
								</div>

								{/* Explanation & Solution */}
								<div className="bg-white rounded-lg shadow-sm border border-gray-200 transition-shadow hover:shadow-md">
									<div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-amber-50">
										<div className="flex items-center gap-2">
											<div className="w-6 h-6 bg-yellow-100 rounded-md flex items-center justify-center"><span className="text-yellow-600 text-sm font-bold">💡</span></div>
											<span className="text-sm font-semibold text-gray-900">Explanation & Solution</span>
										</div>
									</div>
									<div className="p-4 space-y-6">
										<div>
											<label className="block text-sm font-semibold text-gray-700 mb-3">Explanation</label>
											<div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-yellow-500 focus-within:border-yellow-500">
												<RichTextEditor onChange={c=> setExplanation(c)} initialContent={explanation} placeholder="Add explanation for the correct answer..." />
											</div>
										</div>
										<div>
											<label className="block text-sm font-semibold text-gray-700 mb-3">Video Solution URLs</label>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
												<div className="relative">
													<div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center"><Monitor className="h-4 w-4 text-gray-400" /></div>
													<input type="url" value={videoSolWebURL} onChange={(e)=> setVideoSolWebURL(e.target.value)} placeholder="Web URL (e.g., https://youtu.be/...)" className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-3 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-gray-50 focus:bg-white" />
												</div>
												<div className="relative">
													<div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center"><Smartphone className="h-4 w-4 text-gray-400" /></div>
													<input type="url" value={videoSolMobileURL} onChange={(e)=> setVideoSolMobileURL(e.target.value)} placeholder="Mobile URL (e.g., https://m.example.com/video)" className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-3 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-gray-50 focus:bg-white" />
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* Quick Actions (mobile) */}
								  <div className="lg:hidden bg-white rounded-lg shadow-sm border border-gray-200 p-4">
									<h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
									<div className="flex gap-3">
										<button onClick={handleUpdate} disabled={saving} className={`flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm ${saving? 'bg-gray-400':'bg-indigo-600 hover:bg-indigo-700'}`}>{saving? 'Updating...':'Update Question'}</button>
									  <Link href="/admin/questions" className="flex-1"><button className="w-full px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium bg-white hover:bg-gray-50">Cancel</button></Link>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

						<ConfirmationModal
							isOpen={showSuccessModal}
							onConfirm={()=> { setShowSuccessModal(false); router.push('/admin/questions'); }}
							onCancel={()=> { /* hidden */ }}
							title="Question Updated Successfully!"
							message="Your changes have been saved."
							confirmText="Go to Questions"
							cancelText=""
							variant="success"
						/>
			</div>
		);
}

