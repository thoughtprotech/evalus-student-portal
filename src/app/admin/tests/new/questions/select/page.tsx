"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Language = { Language1: string };

type Subject = { SubjectId: number; SubjectName: string };

type QuestionType = { QuestionTypeId: number; QuestionType1: string };

type Difficulty = { QuestionDifficultylevelId: number; QuestionDifficultylevel1: string };

type QuestionRow = {
  QuestionId: number;
  Questionoptions?: { QuestionText?: string }[];
  Questiondifficultylevel?: { QuestionDifficultylevel1: string };
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

  // Util to GET from local OData proxy
  const fetchOData = async <T,>(path: string): Promise<T | null> => {
    try {
      const res = await fetch(`/api${path.startsWith('/odata') ? path : `/odata${path.startsWith('/') ? path : `/${path}`}`}`);
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch {
      return null;
    }
  };

  // Load languages once
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const data = await fetchOData<{ value: Language[] }>(`/odata/Languages?$select=Language1`);
      if (isMounted) setLanguages(data?.value ?? []);
    })();
    return () => { isMounted = false; };
  }, []);

  // When language changes, load dependent dropdowns and reset others
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
      const [subData, qtypeData, diffData] = await Promise.all([
        fetchOData<{ value: Subject[] }>(`/odata/Subjects?$filter=Language eq '${lang}' and ParentId eq 0&$select=SubjectId,SubjectName`),
        fetchOData<{ value: QuestionType[] }>(`/odata/QuestionTypes?$filter=Language eq '${lang}'&$select=QuestionTypeId,QuestionType1`),
        fetchOData<{ value: Difficulty[] }>(`/odata/QuestionDifficultyLevels?$select=QuestionDifficultylevelId,QuestionDifficultylevel1,Language,IsActive&$filter=Language eq '${lang}' and IsActive eq 1`),
      ]);
      setSubjects(subData?.value ?? []);
      setQTypes(qtypeData?.value ?? []);
      setDifficulties(diffData?.value ?? []);
    })();
  }, [language]);

  // When subject changes, reset topic and fetch topic tree (Chapter -> Topic -> Sub Topic)
  useEffect(() => {
    setTopicId("");
    if (!language || !subjectId) { setTopicTree([]); return; }
    (async () => {
      // OData tree endpoint expects ParentId = SubjectId
      const data = await fetchOData<SubjectTreeNode[]>(`/odata/Subjects/GetSubjectTree(ParentId=${subjectId})`);
      setTopicTree(data ?? []);
    })();
  }, [language, subjectId]);

  const canApply = !!language && !!subjectId && !!qTypeId; // required fields

  // Flatten topic tree into options for a dropdown with indentation and type suffix
  type TopicOption = { id: number; label: string };
  const topicOptions: TopicOption[] = useMemo(() => {
    const out: TopicOption[] = [];
    const walk = (nodes: SubjectTreeNode[], depth = 0) => {
      for (const n of nodes) {
        const prefix = depth > 0 ? `${"  ".repeat(Math.max(0, depth - 1))}↳ ` : ""; // arrow with spaces for indentation
        const text = n.name; // remove type in brackets per request
        out.push({ id: n.subjectId, label: `${prefix}${text}` });
        if (n.children?.length) walk(n.children, depth + 1);
      }
    };
    walk(topicTree, 0);
    return out;
  }, [topicTree]);

  const applyFilter = async () => {
    if (!canApply) return;
    setLoading(true);
    try {
      const lang = (language || "").replace(/'/g, "''");
      const subjectToUse = topicId || subjectId; // prefer selected topic/subtopic if chosen
      const parts: string[] = [
        "IsActive eq 1",
        `Language eq '${lang}'`,
        `SubjectId eq ${subjectToUse}`,
      ];
      if (difficultyId) parts.push(`QuestionDifficultylevelId eq ${difficultyId}`);
      if (qTypeId) parts.push(`QuestionTypeId eq ${qTypeId}`);
      const filter = parts.join(" and ");
      const query = `?$filter=${encodeURIComponent(filter)}&$expand=Questionoptions($select=QuestionText),Questiondifficultylevel($select=QuestionDifficultylevel1)`;
      const data = await fetchOData<{ value: any[] }>(`/odata/Questions${query}`);
      setRows((data?.value ?? []).map((r: any) => ({
        QuestionId: r.QuestionId,
        Questionoptions: r.Questionoptions,
        Questiondifficultylevel: r.Questiondifficultylevel,
      })));
    } finally {
      setLoading(false);
    }
  };

  const allChecked = useMemo(() => rows.length > 0 && rows.every(r => selected[r.QuestionId]), [rows, selected]);
  const toggleAll = () => {
    if (allChecked) {
      setSelected({});
    } else {
      const next: Record<number, boolean> = {};
      rows.forEach(r => next[r.QuestionId] = true);
      setSelected(next);
    }
  };
  const toggleOne = (id: number) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));

  const confirmSelection = () => {
    const ids = rows.filter(r => selected[r.QuestionId]).map(r => r.QuestionId);
    sessionStorage.setItem("admin:newTest:selectedQuestions", JSON.stringify({ questionIds: ids }));
    router.push("/admin/tests/new?step=3");
  };

  const getQuestionText = (r: QuestionRow) => {
    const text = r.Questionoptions?.[0]?.QuestionText;
    return text || "-";
  };

  return (
    <div className="p-4">
      <h1 className="text-lg font-semibold mb-2">Select Questions</h1>
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
        {/* Filters Sidebar */}
        <div className="rounded-lg border bg-white shadow-sm h-fit sticky top-4">
          <div className="bg-blue-600 text-white px-4 py-2 text-base font-semibold rounded-t-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0013 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 017 17V13.414a1 1 0 00-.293-.707L3.293 6.707A1 1 0 013 6V4z" /></svg>
            Filter
          </div>
          <div className="p-4 space-y-4">
            {/* Language */}
            <div>
              <label className="text-sm font-medium text-gray-800">Language<span className="text-red-500"> *</span></label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-2 text-sm"
              >
                <option value="">Select Language</option>
                {languages.map((l) => (
                  <option key={l.Language1} value={l.Language1}>{l.Language1}</option>
                ))}
              </select>
            </div>
            {/* Subject */}
            <div>
              <label className="text-sm font-medium text-gray-800">Subject<span className="text-red-500"> *</span></label>
              <select
                value={subjectId as any}
                onChange={(e) => setSubjectId(e.target.value ? Number(e.target.value) : "")}
                disabled={!language}
                className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-2 text-sm disabled:bg-gray-100"
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s.SubjectId} value={s.SubjectId}>{s.SubjectName}</option>
                ))}
              </select>
            </div>
            {/* Topic (flattened tree as dropdown) */}
            <div>
              <label className="text-sm font-medium text-gray-800">Topic / Sub Topic</label>
              <select
                value={topicId as any}
                onChange={(e) => setTopicId(e.target.value ? Number(e.target.value) : "")}
                disabled={!language || !subjectId || topicOptions.length === 0}
                className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-2 text-sm disabled:bg-gray-100"
              >
                <option value="">Select Topic or Sub Topic (optional)</option>
                {topicOptions.map(o => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
              {(!language || !subjectId) && (
                <p className="mt-1 text-xs text-gray-500">Select language and subject to load topics.</p>
              )}
              {(language && subjectId && topicOptions.length === 0) && (
                <p className="mt-1 text-xs text-gray-500">No topics found for this subject.</p>
              )}
            </div>
            {/* Question Type */}
            <div>
              <label className="text-sm font-medium text-gray-800">Question Type<span className="text-red-500"> *</span></label>
              <select
                value={qTypeId as any}
                onChange={(e) => setQTypeId(e.target.value ? Number(e.target.value) : "")}
                disabled={!language}
                className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-2 text-sm disabled:bg-gray-100"
              >
                <option value="">Select Type</option>
                {qTypes.map((t) => (
                  <option key={t.QuestionTypeId} value={t.QuestionTypeId}>{t.QuestionType1}</option>
                ))}
              </select>
            </div>
            {/* Difficulty */}
            <div>
              <label className="text-sm font-medium text-gray-800">Difficulty</label>
              <select
                value={difficultyId as any}
                onChange={(e) => setDifficultyId(e.target.value ? Number(e.target.value) : "")}
                disabled={!language}
                className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-2 text-sm disabled:bg-gray-100"
              >
                <option value="">Select Difficulty</option>
                {difficulties.map((d) => (
                  <option key={d.QuestionDifficultylevelId} value={d.QuestionDifficultylevelId}>{d.QuestionDifficultylevel1}</option>
                ))}
              </select>
            </div>
            {/* Apply Button */}
            <div>
              <button
                onClick={applyFilter}
                disabled={!canApply || loading}
                className="rounded bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 disabled:opacity-50 w-full transition-colors"
              >
                {loading ? "Loading..." : "Apply"}
              </button>
            </div>
          </div>
        </div>
        {/* Results Main Section */}
        <div>
          <div className="rounded-lg border bg-white shadow-sm">
            <div className="bg-blue-600 text-white px-4 py-2 text-base font-semibold rounded-t-lg flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h1a4 4 0 014 4v2m-7 4h8a2 2 0 002-2v-7a2 2 0 00-2-2h-1a2 2 0 00-2 2v2a2 2 0 01-2 2H9a2 2 0 01-2-2v-2a2 2 0 00-2-2H4a2 2 0 00-2 2v7a2 2 0 002 2h8z" /></svg>
                Results
              </div>
              <span className="text-xs text-gray-200">{Object.values(selected).filter(Boolean).length} selected</span>
            </div>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 border-b w-10 text-left"><input type="checkbox" checked={rows.length>0 && rows.every(r=>selected[r.QuestionId])} onChange={() => {
                      const all = rows.length>0 && rows.every(r=>selected[r.QuestionId]);
                      if (all) setSelected({}); else {
                        const next: Record<number, boolean> = {}; rows.forEach(r=>next[r.QuestionId]=true); setSelected(next);
                      }
                    }} /></th>
                    <th className="px-4 py-2 border-b w-16 text-left">S.No</th>
                    <th className="px-4 py-2 border-b text-left">Questions</th>
                    <th className="px-4 py-2 border-b w-48 text-left">Difficulty Level</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No data. Choose filters and click Apply.</td>
                    </tr>
                  ) : (
                    rows.map((r, idx) => (
                      <tr key={r.QuestionId} className={idx % 2 ? "bg-white" : "bg-gray-50/50"}>
                        <td className="px-4 py-2 border-b"><input type="checkbox" checked={!!selected[r.QuestionId]} onChange={() => toggleOne(r.QuestionId)} /></td>
                        <td className="px-4 py-2 border-b">{idx + 1}</td>
                        <td className="px-4 py-2 border-b">{getQuestionText(r)}</td>
                        <td className="px-4 py-2 border-b">{r.Questiondifficultylevel?.QuestionDifficultylevel1 ?? "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <button
                className="px-3 py-2 rounded border border-green-600 bg-green-50 text-green-700 text-sm hover:bg-green-100 transition-colors flex items-center gap-2 font-medium"
                onClick={() => router.push("/admin/tests/new?step=3")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Test
              </button>
              <button className="px-4 py-2 rounded bg-green-600 text-white text-sm" onClick={confirmSelection}>Add Selected</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
