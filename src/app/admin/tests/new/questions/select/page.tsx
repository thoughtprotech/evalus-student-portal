"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import { useRouter, useSearchParams } from "next/navigation";
import PaginationControls from "@/components/PaginationControls";
import { TextOrHtml } from "@/components/TextOrHtml";

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
  Duration?: number;
};

function SelectQuestionsPageInner() {
  const router = useRouter();
  const search = useSearchParams();

  // Filters
  const [language, setLanguage] = useState<string>("");
  const [subjectId, setSubjectId] = useState<number | "">("");
  const [topicId, setTopicId] = useState<number | "">("");
  const [qTypeId, setQTypeId] = useState<number | "">("");
  const [difficultyId, setDifficultyId] = useState<number | "">("");
  // New filters
  const [batchNumber, setBatchNumber] = useState<string>("");
  const [availableBatches, setAvailableBatches] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagsOpen, setTagsOpen] = useState(false);
  const tagsRef = useRef<HTMLDivElement | null>(null);

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

  // Load languages + distinct batches + distinct tags once
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [langRes, batchRes, tagRes] = await Promise.all([
        apiHandler(endpoints.getLanguagesOData, null as any),
        apiHandler(endpoints.getDistinctBatchNumbersOData, null as any),
        apiHandler(endpoints.getDistinctQuestionTagsOData, null as any),
      ]);
      if (!mounted) return;
      const ldata: any = (langRes as any)?.data;
      const langs: Language[] = Array.isArray(ldata?.value)
        ? (ldata.value as Language[])
        : Array.isArray(ldata)
        ? (ldata as Language[])
        : ([] as Language[]);
      setLanguages(langs);

      const bdata: any = (batchRes as any)?.data;
      const batchRaw: any[] = Array.isArray(bdata?.value)
        ? (bdata.value as any[])
        : Array.isArray(bdata)
        ? (bdata as any[])
        : ([] as any[]);
      const batches = batchRaw
        .map((r) =>
          typeof r === "string"
            ? r
            : r?.BatchNumber ?? r?.batchNumber ?? r?.Value ?? r?.QuestionBatchNumber ?? ""
        )
        .filter((v) => typeof v === "string" && v.trim().length > 0);
      setAvailableBatches(Array.from(new Set(batches)));

      const tdata: any = (tagRes as any)?.data;
      const tagRaw: any[] = Array.isArray(tdata?.value)
        ? (tdata.value as any[])
        : Array.isArray(tdata)
        ? (tdata as any[])
        : ([] as any[]);
      const tags = tagRaw
        .map((r) =>
          typeof r === "string"
            ? r
            : r?.QuestionTag ?? r?.questionTag ?? r?.Tag ?? r?.TagName ?? r?.Value ?? ""
        )
        .filter((v) => typeof v === "string" && v.trim().length > 0);
      setAvailableTags(Array.from(new Set(tags)));
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

  const batchMode = !!batchNumber;
  const canApply = batchMode ? true : (!!language && !!subjectId && !!qTypeId);

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

  // Close tags dropdown on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!tagsOpen) return;
      const el = tagsRef.current;
      if (el && e.target instanceof Node && !el.contains(e.target)) {
        setTagsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [tagsOpen]);

  const [qTextCache, setQTextCache] = useState<Record<number, string>>({});

  // IDs already in the draft model's testQuestions; these should be shown checked and disabled here
  const [disabledIds, setDisabledIds] = useState<Record<number, true>>({});

  // Load already-added test question IDs from the draft model in sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("admin:newTest:model");
      if (!raw) return;
      const draft: any = JSON.parse(raw);
      const arr: any[] = Array.isArray(draft?.testQuestions)
        ? draft.testQuestions
        : Array.isArray(draft?.TestQuestions)
        ? draft.TestQuestions
        : [];
      const ids = Array.from(
        new Set(
          arr
            .map((q: any) =>
              Number(
                q?.TestQuestionId ?? q?.QuestionId ?? q?.questionId ?? q?.id ?? NaN
              )
            )
            .filter((n: any) => Number.isFinite(n))
        )
      ) as number[];
      if (ids.length) {
        const map: Record<number, true> = {};
        ids.forEach((id) => (map[id] = true));
        setDisabledIds(map);
        // Ensure they appear checked
        setSelected((prev) => {
          const next = { ...prev } as Record<number, boolean>;
          ids.forEach((id) => (next[id] = true));
          return next;
        });
      }
    } catch {}
  }, []);

  // Reset grid data when Batch Number changes and results are loaded
  useEffect(() => {
    if (rows.length > 0) {
      setRows([]);
      setSelected({});
      setMarksById({});
      setQTextCache({});
      setTotal(0);
      setPage(1);
    }
  }, [batchNumber]);

  const fetchQuestions = async (opts?: { resetPage?: boolean; pageOverride?: number; pageSizeOverride?: number }) => {
    if (!canApply) return;
    setLoading(true);
    try {
      const effectivePage = opts?.resetPage ? 1 : (opts?.pageOverride ?? page);
      const effectiveSize = opts?.pageSizeOverride ?? pageSize;
      const skip = (effectivePage - 1) * effectiveSize;
      let res: any;
      if (batchMode) {
        res = await apiHandler(endpoints.getQuestionsByBatchNumberOData, {
          batchNumber,
          top: effectiveSize,
          skip,
        } as any);
      } else {
        let ids: number[] = [];
        if (topicId) {
          const node = findNode(topicTree as any, topicId as number);
          if (node) ids = collectIds([node]);
        } else {
          ids = collectIds(topicTree as any);
          if (subjectId) ids = Array.from(new Set([Number(subjectId), ...ids]));
        }
        res = await apiHandler(endpoints.getQuestionsFilteredOData, {
          language,
          subjectIds: ids,
          questionTypeId: Number(qTypeId),
          difficultyId: difficultyId ? Number(difficultyId) : undefined,
          tags: selectedTags,
          top: effectiveSize,
          skip,
        } as any);
      }
      const data = (res.data ?? { value: [], "@odata.count": 0 }) as { value: any[]; "@odata.count"?: number };
      const mapped: QuestionRow[] = (data.value ?? []).map((r: any) => ({
        QuestionId: r.QuestionId,
        Questionoptions: r.Questionoptions,
        Questiondifficultylevel: r.Questiondifficultylevel,
        Marks: r.Marks,
        NegativeMarks: r.NegativeMarks,
        GraceMarks: r.GraceMarks,
        Duration: r.Duration ?? r.TimeDuration ?? r.QuestionDuration ?? r.duration ?? r.QuestionTime ?? 0,
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

  // Initialize preselected from Step 3, once
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("admin:newTest:preselectedIds");
      if (raw) {
        const ids = JSON.parse(raw) as number[];
        if (Array.isArray(ids) && ids.length) {
          setSelected((prev) => {
            const next = { ...prev } as Record<number, boolean>;
            ids.forEach((id) => { next[id] = true; });
            return next;
          });
        }
      }
    } catch {}
  }, []);

  const toggleAll = () => {
    const selectable = rows.filter((r) => !disabledIds[r.QuestionId]);
    const allSelectableChecked =
      selectable.length > 0 && selectable.every((r) => selected[r.QuestionId]);
    if (allSelectableChecked) {
      // unselect only current page selectable
      setSelected((prev) => {
        const copy = { ...prev } as Record<number, boolean>;
        selectable.forEach((r) => {
          delete copy[r.QuestionId];
        });
        return copy;
      });
    } else {
      setSelected((prev) => {
        const copy = { ...prev } as Record<number, boolean>;
        selectable.forEach((r) => {
          copy[r.QuestionId] = true;
        });
        return copy;
      });
    }
  };

  const toggleOne = (id: number) => {
    if (disabledIds[id]) return; // ignore toggles on disabled
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const [selectedCount, setSelectedCount] = useState(0);
  const confirmSelection = () => {
    // build across selection (not just current page)
    const selectedIds = Object.keys(selected)
      .filter((k) => selected[Number(k)])
      .map(Number)
      // exclude IDs already in the test to avoid duplicates
      .filter((id) => !disabledIds[id]);
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
  Duration: Number(row?.Duration ?? 0),
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8 max-h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0013 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 017 17V13.414a1 1 0 00-.293-.707L3.293 6.707A1 1 0 013 6V4z" /></svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Filter</h2>
            </div>

            <div className="space-y-6">
              {/* Batch Number (overrides other filters when selected) */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Batch Number</label>
                <select value={batchNumber} onChange={(e) => { setBatchNumber(e.target.value); }} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-normal focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white">
                  <option value="">Select batch (optional)</option>
                  {availableBatches.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                {batchMode && (
                  <p className="mt-1 text-xs text-amber-700">Batch selected. Other filters are disabled. Apply will fetch by Batch Number.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Language <span className="text-red-500">*</span></label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} disabled={batchMode} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-normal focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed">
                  <option value="">Select language</option>
                  {languages.map((l) => <option key={l.Language1} value={l.Language1}>{l.Language1}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Subject <span className="text-red-500">*</span></label>
                <select value={subjectId as any} onChange={(e) => setSubjectId(e.target.value ? Number(e.target.value) : "")} disabled={!language || batchMode} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-normal focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed">
                  <option value="">Select subject</option>
                  {subjects.map((s) => <option key={s.SubjectId} value={s.SubjectId}>{s.SubjectName}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Topic / Sub Topic</label>
                <select value={topicId as any} onChange={(e) => setTopicId(e.target.value ? Number(e.target.value) : "")} disabled={!language || !subjectId || topicOptions.length === 0 || batchMode} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-normal focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed">
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
                <select value={qTypeId as any} onChange={(e) => setQTypeId(e.target.value ? Number(e.target.value) : "")} disabled={!language || batchMode} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-normal focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed">
                  <option value="">Select type</option>
                  {qTypes.map((t) => <option key={t.QuestionTypeId} value={t.QuestionTypeId}>{t.QuestionType1}</option>)}
                </select>
              </div>

              {/* Question Tags (dropdown-style multi-select) */}
              <div ref={tagsRef} className="relative">
                <label className="block text-sm font-medium text-gray-700">Question Tags</label>
                <button
                  type="button"
                  onClick={() => { if (!batchMode && !!language) setTagsOpen(v => !v); }}
                  disabled={!language || batchMode}
                  className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2.5 text-left text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-between"
                >
                  <span className="truncate">
                    {selectedTags.length === 0 ? (
                      <span className="text-gray-500">Select tags (optional)</span>
                    ) : selectedTags.length <= 2 ? (
                      selectedTags.join(", ")
                    ) : (
                      `${selectedTags.length} selected`
                    )}
                  </span>
                  <svg className="w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
                </button>
                {tagsOpen && (
                  <div className="absolute left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 md:max-h-80 overflow-y-auto overflow-x-hidden">
                    <div className="p-2 flex items-center justify-between gap-2 sticky top-0 bg-white border-b">
                      <input
                        type="text"
                        placeholder="Filter tags..."
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                        onChange={(e) => {
                          const term = e.target.value.toLowerCase();
                          const src = Array.isArray(availableTags) ? availableTags : [];
                          const filtered = term ? src.filter(t => t.toLowerCase().includes(term)) : src;
                          // No state for filtered list; render filter by mapping conditionally below
                          // We'll store term on the element for inline filter
                          (e.currentTarget as any).dataset.term = term;
                        }}
                      />
                      <button type="button" className="text-xs text-amber-700 hover:underline" onClick={() => setSelectedTags([])}>Clear</button>
                    </div>
                    <ul className="max-h-48 overflow-y-auto overflow-x-hidden py-1">
                      {availableTags.length === 0 ? (
                        <li className="px-3 py-2 text-xs text-gray-500">No tags</li>
                      ) : (
                        availableTags.map((t) => (
                          <li key={t} className="px-3 py-1 hover:bg-gray-50">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300"
                                checked={selectedTags.includes(t)}
                                onChange={(e) => {
                                  setSelectedTags((prev) => e.target.checked ? Array.from(new Set([...prev, t])) : prev.filter(x => x !== t));
                                }}
                              />
                              <span className="truncate">{t}</span>
                            </label>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                <select value={difficultyId as any} onChange={(e) => setDifficultyId(e.target.value ? Number(e.target.value) : "")} disabled={!language || batchMode} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-normal focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed">
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
                <button className="px-4 py-2 rounded bg-green-600 text-white text-sm flex items-center gap-2 font-medium hover:bg-green-700 transition-colors" onClick={() => {
                  // persist selection state locally before leaving
                  try {
                    const ids = Object.keys(selected).filter(k=> selected[Number(k)]).map(Number);
                    sessionStorage.setItem("admin:newTest:preselectedIds", JSON.stringify(ids));
                  } catch {}
                  const id = search?.get("id");
                  const isEdit = search?.get("edit") === "1" && id;
                  router.push(isEdit ? `/admin/tests/edit/${id}?step=3` : "/admin/tests/new?step=3")
                }}>
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
                    <th className="px-4 py-2 border-b w-10 text-left">
                      <input
                        type="checkbox"
                        checked={(() => {
                          const selectable = rows.filter((r) => !disabledIds[r.QuestionId]);
                          return (
                            selectable.length > 0 &&
                            selectable.every((r) => selected[r.QuestionId])
                          );
                        })()}
                        onChange={toggleAll}
                      />
                    </th>
                    <th className="px-4 py-2 border-b w-16 text-left">S.No</th>
                    <th className="px-4 py-2 border-b text-left">Question</th>
                    <th className="px-4 py-2 border-b w-48 text-left">Difficulty Level</th>
                    <th className="px-4 py-2 border-b w-28 text-left">Marks</th>
                    <th className="px-4 py-2 border-b w-36 text-left">Negative Marks</th>
                    <th className="px-4 py-2 border-b w-28 text-left">Duration</th>
                    <th className="px-4 py-2 border-b w-32 text-left">Grace Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">No data. Choose filters and click Apply.</td>
                    </tr>
                  ) : (
                    rows.map((r, idx) => (
                      <tr key={r.QuestionId} className={idx % 2 ? "bg-white" : "bg-gray-50/50"}>
                        <td className="px-4 py-2 border-b">
                          <input
                            type="checkbox"
                            checked={!!disabledIds[r.QuestionId] || !!selected[r.QuestionId]}
                            disabled={!!disabledIds[r.QuestionId]}
                            onChange={() => toggleOne(r.QuestionId)}
                            title={disabledIds[r.QuestionId] ? "Already added in test (manage from Step 3)" : undefined}
                          />
                        </td>
                        <td className="px-4 py-2 border-b">{(page - 1) * pageSize + idx + 1}</td>
                        <td className="px-4 py-2 border-b">
                          <TextOrHtml content={getQuestionText(r)} />
                        </td>
                        <td className="px-4 py-2 border-b">{r.Questiondifficultylevel?.QuestionDifficultylevel1 ?? "-"}</td>
                        <td className="px-4 py-2 border-b">{r.Marks ?? 0}</td>
                        <td className="px-4 py-2 border-b">{r.NegativeMarks ?? 0}</td>
                        <td className="px-4 py-2 border-b">{r.Duration ?? 0}</td>
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

export default function SelectQuestionsPage() {
  return (
    <Suspense fallback={<div className="w-[90%] mx-auto px-6 pt-8 pb-0">Loading…</div>}>
      <SelectQuestionsPageInner />
    </Suspense>
  );
}

