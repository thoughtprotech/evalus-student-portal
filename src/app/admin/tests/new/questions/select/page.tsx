"use client";

import { useEffect, useMemo, useState } from "react";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import { useRouter } from "next/navigation";
import PaginationControls from "@/components/PaginationControls";

type Language = { Language1: string };
type Subject = { SubjectId: number; SubjectName: string };
type QuestionType = { QuestionTypeId: number; QuestionType1: string };
type Difficulty = { QuestionDifficultylevelId: number; QuestionDifficultylevel1: string };

type QuestionRow = {
  QuestionId: number;
  Questionoptions?: { QuestionText?: string }[];
  Questiondifficultylevel?: { QuestionDifficultylevel1: string };
  Marks?: number;
  NegativeMarks?: number;
  GraceMarks?: number;
};

export default function SelectQuestionsPage() {
  const router = useRouter();

  // Filters
  const [language, setLanguage] = useState<string>("");
  const [subjectId, setSubjectId] = useState<number | "">("");
  const [topicId, setTopicId] = useState<number | "">("");
  const [qTypeId, setQTypeId] = useState<number | "">("");
  const [difficultyId, setDifficultyId] = useState<number | "">("");

  // Lists
  const [languages, setLanguages] = useState<Language[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  type SubjectTreeNode = { subjectId: number; name: string; type: string; children: SubjectTreeNode[] };
  const [topicTree, setTopicTree] = useState<SubjectTreeNode[]>([]);
  const [qTypes, setQTypes] = useState<QuestionType[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);

  // Results
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<QuestionRow[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [marksById, setMarksById] = useState<Record<number, { Marks?: number; NegativeMarks?: number; GraceMarks?: number }>>({});

  // paging
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [total, setTotal] = useState(0);

  // Load languages once
  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await apiHandler(endpoints.getLanguagesOData, null as any);
      if (!mounted) return;
      setLanguages((res.data?.value ?? []) as Language[]);
    })();
    return () => { mounted = false; };
  }, []);

  // When language changes
  useEffect(() => {
    setSubjectId("");
    setTopicId("");
    setQTypeId("");
    setDifficultyId("");
    setSubjects([]);
    setTopicTree([]);
    setQTypes([]);
    setDifficulties([]);
    setRows([]);
    setSelected({});

    if (!language) return;
    (async () => {
      const lang = language.replace(/'/g, "''");
      const [subRes, qtypeRes, diffRes] = await Promise.all([
        apiHandler(endpoints.getSubjectsByLanguageOData, { language: lang } as any),
        apiHandler(endpoints.getQuestionTypesOData, { language: lang } as any),
        apiHandler(endpoints.getQuestionDifficultyLevelsOData, { language: lang } as any),
      ]);
      setSubjects((subRes.data?.value ?? []) as Subject[]);
      setQTypes((qtypeRes.data?.value ?? []) as QuestionType[]);
      setDifficulties((diffRes.data?.value ?? []) as unknown as Difficulty[]);
    })();
  }, [language]);

  // When subject changes
  useEffect(() => {
    setTopicId("");
    if (!language || !subjectId) { setTopicTree([]); return; }
    (async () => {
      const res = await apiHandler(endpoints.getSubjectTree, { parentId: subjectId as number } as any);
      setTopicTree((res.data ?? []) as SubjectTreeNode[]);
    })();
  }, [language, subjectId]);

  const canApply = !!language && !!subjectId && !!qTypeId;

  // Flatten topic tree into options
  type TopicOption = { id: number; label: string };
  const topicOptions = useMemo<TopicOption[]>(() => {
    const out: TopicOption[] = [];
    const walk = (nodes: SubjectTreeNode[], depth = 0) => {
      for (const n of nodes) {
        const prefix = depth > 0 ? `${"  ".repeat(Math.max(0, depth - 1))}↳ ` : "";
        out.push({ id: n.subjectId, label: `${prefix}${n.name}` });
        if (n.children?.length) walk(n.children, depth + 1);
      }
    };
    walk(topicTree, 0);
    return out;
  }, [topicTree]);

  // Helpers to walk subject tree and collect ids
  const collectIds = (nodes: SubjectTreeNode[]): number[] => {
    const out: number[] = [];
    const dfs = (n: SubjectTreeNode) => {
      out.push(n.subjectId);
      n.children?.forEach(dfs);
    };
    nodes.forEach(dfs);
    return Array.from(new Set(out));
  };
  const findNode = (nodes: SubjectTreeNode[], id: number): SubjectTreeNode | null => {
    for (const n of nodes) {
      if (n.subjectId === id) return n;
      const found = findNode(n.children ?? [], id);
      if (found) return found;
    }
    return null;
  };

  const [qTextCache, setQTextCache] = useState<Record<number, string>>({});

  const fetchQuestions = async (opts?: { resetPage?: boolean; pageOverride?: number; pageSizeOverride?: number }) => {
    if (!canApply) return;
    setLoading(true);
    try {
      let ids: number[] = [];
      if (topicId) {
        const node = findNode(topicTree as any, topicId as number);
        if (node) ids = collectIds([node]);
      } else {
        ids = collectIds(topicTree as any);
        if (subjectId) ids = Array.from(new Set([Number(subjectId), ...ids]));
      }
      const effectivePage = opts?.resetPage ? 1 : (opts?.pageOverride ?? page);
      const effectiveSize = opts?.pageSizeOverride ?? pageSize;
      const skip = (effectivePage - 1) * effectiveSize;
      const res = await apiHandler(endpoints.getQuestionsFilteredOData, {
        language,
        subjectIds: ids,
        questionTypeId: Number(qTypeId),
        difficultyId: difficultyId ? Number(difficultyId) : undefined,
        top: effectiveSize,
        skip,
      } as any);
      const data = (res.data ?? { value: [], "@odata.count": 0 }) as { value: any[]; "@odata.count"?: number };
      const mapped: QuestionRow[] = (data.value ?? []).map((r: any) => ({
        QuestionId: r.QuestionId,
        Questionoptions: r.Questionoptions,
        Questiondifficultylevel: r.Questiondifficultylevel,
        Marks: r.Marks,
        NegativeMarks: r.NegativeMarks,
        GraceMarks: r.GraceMarks,
      }));
      setRows(mapped);
      setTotal(Number(data["@odata.count"] ?? mapped.length));
      // cache question text for persistence across pages
      setQTextCache((prev) => {
        const next = { ...prev } as Record<number, string>;
        for (const r of mapped) {
          const txt = r.Questionoptions?.[0]?.QuestionText ?? "";
          if (txt) next[r.QuestionId] = txt;
        }
        return next;
      });
      // init marks map preserving edits
      setMarksById((prev) => {
        const next = { ...prev } as typeof prev;
        for (const r of mapped) {
          if (!next[r.QuestionId]) {
            next[r.QuestionId] = {
              Marks: r.Marks ?? 0,
              NegativeMarks: r.NegativeMarks ?? 0,
              GraceMarks: r.GraceMarks ?? 0,
            };
          }
        }
        return next;
      });
  if (opts?.resetPage) setPage(1);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = async () => {
    await fetchQuestions({ resetPage: true });
  };

  const toggleAll = () => {
    const all = rows.length > 0 && rows.every(r => selected[r.QuestionId]);
    if (all) {
      // unselect only current page
      setSelected((prev) => {
        const copy = { ...prev };
        rows.forEach(r => { delete copy[r.QuestionId]; });
        return copy;
      });
    } else {
      setSelected((prev) => {
        const copy = { ...prev } as Record<number, boolean>;
        rows.forEach(r => { copy[r.QuestionId] = true; });
        return copy;
      });
    }
  };

  const toggleOne = (id: number) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));

  const [selectedCount, setSelectedCount] = useState(0);
  const confirmSelection = () => {
    // build across selection (not just current page)
    const selectedIds = Object.keys(selected).filter(k => selected[Number(k)]).map(Number);
    setSelectedCount(selectedIds.length);
    const mapById: Record<number, QuestionRow> = {};
    rows.forEach(r => { mapById[r.QuestionId] = r; });
    const payload = selectedIds.map((id) => {
      const row = mapById[id];
      const marks = marksById[id] ?? { Marks: 0, NegativeMarks: 0, GraceMarks: 0 };
      const questionText = qTextCache[id] ?? row?.Questionoptions?.[0]?.QuestionText ?? "";
      return {
        TestId: 0,
        TestQuestionId: id,
        Marks: Number(marks.Marks ?? 0),
        NegativeMarks: Number(marks.NegativeMarks ?? 0),
        GraceMarks: Number(marks.GraceMarks ?? 0),
        Question: {
          Questionoptions: [
            { QuestionText: questionText },
          ],
        },
      };
    });
    sessionStorage.setItem("admin:newTest:selectedQuestions", JSON.stringify({
      questionIds: selectedIds,
      testQuestions: payload,
    }));
    // Do not navigate; only update sessionStorage
  };

  const getQuestionText = (r: QuestionRow) => r.Questionoptions?.[0]?.QuestionText ?? "-";

  return (
  <div className="w-[90%] mx-auto px-6 pt-8 pb-0">
  <div className="grid grid-cols-12 gap-8 items-start">
        <div className="col-span-12 lg:col-span-4 xl:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0013 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 017 17V13.414a1 1 0 00-.293-.707L3.293 6.707A1 1 0 013 6V4z" /></svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Filter</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Language <span className="text-red-500">*</span></label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-normal focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white">
                  <option value="">Select language</option>
                  {languages.map((l) => <option key={l.Language1} value={l.Language1}>{l.Language1}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Subject <span className="text-red-500">*</span></label>
                <select value={subjectId as any} onChange={(e) => setSubjectId(e.target.value ? Number(e.target.value) : "")} disabled={!language} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-normal focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed">
                  <option value="">Select subject</option>
                  {subjects.map((s) => <option key={s.SubjectId} value={s.SubjectId}>{s.SubjectName}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Topic / Sub Topic</label>
                <select value={topicId as any} onChange={(e) => setTopicId(e.target.value ? Number(e.target.value) : "")} disabled={!language || !subjectId || topicOptions.length === 0} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-normal focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed">
                  <option value="">Select topic or sub topic (optional)</option>
                  {topicOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
                {(!language || !subjectId) ? (
                  <p className="mt-1 text-xs text-gray-500">Select language and subject to load topics.</p>
                ) : (language && subjectId && topicOptions.length === 0) ? (
                  <p className="mt-1 text-xs text-amber-600">No topics found for this subject.</p>
                ) : null}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Question Type <span className="text-red-500">*</span></label>
                <select value={qTypeId as any} onChange={(e) => setQTypeId(e.target.value ? Number(e.target.value) : "")} disabled={!language} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-normal focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed">
                  <option value="">Select type</option>
                  {qTypes.map((t) => <option key={t.QuestionTypeId} value={t.QuestionTypeId}>{t.QuestionType1}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                <select value={difficultyId as any} onChange={(e) => setDifficultyId(e.target.value ? Number(e.target.value) : "")} disabled={!language} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-normal focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed">
                  <option value="">Select difficulty</option>
                  {difficulties.map((d) => <option key={d.QuestionDifficultylevelId} value={d.QuestionDifficultylevelId}>{d.QuestionDifficultylevel1}</option>)}
                </select>
              </div>

              <div>
                <button onClick={applyFilter} disabled={!canApply || loading} className="rounded bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 disabled:opacity-50 w-full transition-colors">{loading ? "Loading..." : "Apply"}</button>
              </div>
            </div>

          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 xl:col-span-9">
          <div className="rounded-lg border bg-white shadow-sm">
            <div className="bg-blue-600 text-white px-4 py-2 text-base font-semibold rounded-t-lg flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h1a4 4 0 014 4v2m-7 4h8a2 2 0 002-2v-7a2 2 0 00-2-2h-1a2 2 0 00-2 2v2a2 2 0 01-2 2H9a2 2 0 01-2-2v-2a2 2 0 00-2-2H4a2 2 0 00-2 2v7a2 2 0 002 2h8z" /></svg>
                Results
              </div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 rounded bg-green-600 text-white text-sm flex items-center gap-2 font-medium hover:bg-green-700 transition-colors" onClick={() => router.push("/admin/tests/new?step=3") }>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Back to Test
                </button>
                <button className="px-4 py-2 rounded bg-green-600 text-white text-sm" onClick={confirmSelection}>Add Selected</button>
                <span className="ml-4 text-base font-bold text-white flex items-center gap-2 drop-shadow">
                  Selected
                  <span className="inline-block bg-green-600 text-white rounded-full px-3 py-1 text-base font-bold shadow">{selectedCount}</span>
                </span>
              </div>
            </div>

            {/* Paging controls above grid, centered */}
            <div className="py-4 flex justify-center items-center">
              <PaginationControls
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={(p) => { setPage(p); fetchQuestions({ pageOverride: p }); }}
                onPageSizeChange={(s) => { setPageSize(s); setPage(1); fetchQuestions({ resetPage: true, pageOverride: 1, pageSizeOverride: s }); }}
                showTotalCount
              />
            </div>

            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 border-b w-10 text-left"><input type="checkbox" checked={rows.length>0 && rows.every(r=>selected[r.QuestionId])} onChange={toggleAll} /></th>
                    <th className="px-4 py-2 border-b w-16 text-left">S.No</th>
                    <th className="px-4 py-2 border-b text-left">Question</th>
                    <th className="px-4 py-2 border-b w-48 text-left">Difficulty Level</th>
                    <th className="px-4 py-2 border-b w-28 text-left">Marks</th>
                    <th className="px-4 py-2 border-b w-36 text-left">Negative Marks</th>
                    <th className="px-4 py-2 border-b w-32 text-left">Grace Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No data. Choose filters and click Apply.</td>
                    </tr>
                  ) : (
                    rows.map((r, idx) => (
                      <tr key={r.QuestionId} className={idx % 2 ? "bg-white" : "bg-gray-50/50"}>
                        <td className="px-4 py-2 border-b"><input type="checkbox" checked={!!selected[r.QuestionId]} onChange={() => toggleOne(r.QuestionId)} /></td>
                        <td className="px-4 py-2 border-b">{(page - 1) * pageSize + idx + 1}</td>
                        <td className="px-4 py-2 border-b">{getQuestionText(r)}</td>
                        <td className="px-4 py-2 border-b">{r.Questiondifficultylevel?.QuestionDifficultylevel1 ?? "-"}</td>
                        <td className="px-4 py-2 border-b">{r.Marks ?? 0}</td>
                        <td className="px-4 py-2 border-b">{r.NegativeMarks ?? 0}</td>
                        <td className="px-4 py-2 border-b">{r.GraceMarks ?? 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

