"use client";

import ImportantInstructions from "@/components/ImportantInstructions";
import Toast, { type ToastType } from "@/components/Toast";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTestDraft } from "@/contexts/TestDraftContext";
import { Key, MousePointerClick, FileSpreadsheet, FilePlus2, Trash2 } from "lucide-react";
import PaginationControls from "@/components/PaginationControls";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";

type TestSection = { TestSectionId: number; TestSectionName: string };

export default function Step3AddQuestions() {
  const router = useRouter();
  const search = useSearchParams();
  const { draft, setDraft } = useTestDraft();

  const [selectedCount, setSelectedCount] = useState<number>(0);
  const [importType, setImportType] = useState<string>("");
  const [selectionFromBank, setSelectionFromBank] = useState(false);

  // Paging for selected questions grid
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Bulk controls state
  const [assignFrom, setAssignFrom] = useState<number | "">("");
  const [assignTo, setAssignTo] = useState<number | "">("");
  const [assignSectionId, setAssignSectionId] = useState<number | "">("");
  const [markFrom, setMarkFrom] = useState<number | "">("");
  const [markTo, setMarkTo] = useState<number | "">("");
  const [markMarks, setMarkMarks] = useState<number | "">("");
  const [markNegMarks, setMarkNegMarks] = useState<number | "">("");

  const [sections, setSections] = useState<TestSection[]>([]);
  const [delSelected, setDelSelected] = useState<Record<number, boolean>>({});
  const [toast, setToast] = useState<{ message: string; type?: ToastType } | null>(null);

  // Fetch sections once
  useEffect(() => {
    (async () => {
      try {
        const res = await apiHandler(endpoints.getTestSectionsOData, null as any);
        const list = Array.isArray(res?.data?.value) ? res.data.value : [];
        setSections(list as TestSection[]);
      } catch {
        setSections([]);
      }
    })();
  }, []);

  // Ingest session selection once when returning from Select Questions
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("admin:newTest:selectedQuestions");
      if (raw) {
        const data = JSON.parse(raw) as { questionIds?: number[]; testQuestions?: any[] };
        const toAdd = Array.isArray(data?.testQuestions) ? data!.testQuestions! : [];
        if (toAdd.length > 0) {
          setDraft((d) => {
            const existing = Array.isArray(d.testQuestions) ? d.testQuestions : [];
            const map = new Map<number, any>();
            for (const q of existing) map.set(q.TestQuestionId, q);
            for (const q of toAdd) map.set(q.TestQuestionId, q);
            return { ...d, testQuestions: Array.from(map.values()) };
          });
          setSelectionFromBank(true);
        }
        const newCount = Array.isArray(data?.questionIds)
          ? data!.questionIds!.length
          : (toAdd.length || 0);
        setSelectedCount((prev) => (newCount > 0 ? newCount : prev));
        sessionStorage.removeItem("admin:newTest:selectedQuestions");
      }
    } catch {
      // ignore parse errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search?.toString()]);

  // Keep banner in sync with draft if session is empty
  useEffect(() => {
    if (Array.isArray(draft?.testQuestions)) setSelectedCount(draft.testQuestions.length);
  }, [draft?.testQuestions]);

  const rows = useMemo(() => (Array.isArray(draft?.testQuestions) ? draft.testQuestions : []), [draft?.testQuestions]);
  const total = rows.length;
  const seqOptions = useMemo(() => Array.from({ length: total }, (_, i) => i + 1), [total]);
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  const applyAssignSection = () => {
    if (!assignFrom || !assignTo || !assignSectionId) return;
    const start = Math.min(assignFrom as number, assignTo as number);
    const end = Math.max(assignFrom as number, assignTo as number);
    setDraft((d) => {
      const qs = Array.isArray(d.testQuestions) ? d.testQuestions : [];
      const updated = qs.map((q: any, idx: number) => {
        const sn = idx + 1;
        if (sn >= start && sn <= end) return { ...q, TestSectionId: assignSectionId };
        return q;
      });
      return { ...d, testQuestions: updated };
    });
    setAssignFrom("");
    setAssignTo("");
    setAssignSectionId("");
  };

  const applyMarksUpdate = () => {
    if (!markFrom || !markTo) return;
    const start = Math.min(markFrom as number, markTo as number);
    const end = Math.max(markFrom as number, markTo as number);
    setDraft((d) => {
      const qs = Array.isArray(d.testQuestions) ? d.testQuestions : [];
      const updated = qs.map((q: any, idx: number) => {
        const sn = idx + 1;
        if (sn >= start && sn <= end) {
          return {
            ...q,
            ...(markMarks !== "" ? { Marks: Number(markMarks) } : {}),
            ...(markNegMarks !== "" ? { NegativeMarks: Number(markNegMarks) } : {}),
          };
        }
        return q;
      });
      return { ...d, testQuestions: updated };
    });
    setMarkFrom("");
    setMarkTo("");
    setMarkMarks("");
    setMarkNegMarks("");
  };

  // Unified apply for combined controls
  const applyBulkUpdate = () => {
    if (!assignFrom || !assignTo) return; // need a valid range
    const start = Math.min(assignFrom as number, assignTo as number);
    const end = Math.max(assignFrom as number, assignTo as number);
    const hasSection = assignSectionId !== "";
    const hasMarks = markMarks !== "" || markNegMarks !== "";
    if (!hasSection && !hasMarks) return; // nothing to update
    if (markMarks !== "" && markNegMarks !== "" && Number(markNegMarks) > Number(markMarks)) {
      setToast({ message: "Negative Marks should not be greater than Marks.", type: "error" });
      return;
    }

    setDraft((d) => {
      const qs = Array.isArray(d.testQuestions) ? d.testQuestions : [];
      const updated = qs.map((q: any, idx: number) => {
        const sn = idx + 1;
        if (sn < start || sn > end) return q;
        return {
          ...q,
          ...(hasSection ? { TestSectionId: assignSectionId } : {}),
          ...(markMarks !== "" ? { Marks: Number(markMarks) } : {}),
          ...(markNegMarks !== "" ? { NegativeMarks: Number(markNegMarks) } : {}),
        };
      });
      return { ...d, testQuestions: updated };
    });

  // clear inputs but keep section selection to allow repeated applies if desired
    setMarkMarks("");
    setMarkNegMarks("");
  setAssignFrom("");
  setAssignTo("");
  };

  const handleSelectQuestions = () => {
    try {
      const ids = Array.isArray(draft?.testQuestions)
        ? (draft.testQuestions as any[]).map((q: any) => Number(q.TestQuestionId)).filter(Boolean)
        : [];
      sessionStorage.setItem("admin:newTest:preselectedIds", JSON.stringify(ids));
    } catch {}
    router.push("/admin/tests/new/questions/select");
  };
  const handleAddQuestions = () => router.push("/admin/questions/new");
  const handleImportChange = (e: React.ChangeEvent<HTMLSelectElement>) => setImportType(e.target.value);

  return (
    <div className="w-full pb-32">
      {/* Toast positioned top-right */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {selectedCount > 0 && (
          <div className="lg:col-span-4">
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
              {selectedCount} question{selectedCount === 1 ? "" : "s"} selected from Question Bank. You can proceed to next step or refine selection.
            </div>
          </div>
        )}

        {total > 0 && (
          <div className={selectionFromBank ? "lg:col-span-3" : "lg:col-span-4 flex justify-center"}>
            <div className={selectionFromBank ? "w-full" : "w-full max-w-[1100px]"}>
              <div className="rounded-lg border bg-white shadow-sm">
                <div className="bg-blue-600 text-white px-4 py-2 text-base font-semibold rounded-t-lg flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">Selected Questions</div>
                  <div className="flex-1"></div>
                </div>

                <div className="p-4 border-b">
                  <div className="bg-gray-50 rounded-md p-3 border">
                    <div className="text-sm font-semibold mb-3">Bulk Update (by S.No range)</div>
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-600">From Q#</label>
                        <select value={assignFrom as any} onChange={(e) => setAssignFrom(e.target.value ? Number(e.target.value) : "")} className="border rounded px-2 py-1 text-sm min-w-20">
                          <option value="">-</option>
                          {seqOptions.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-600">To Q#</label>
                        <select value={assignTo as any} onChange={(e) => setAssignTo(e.target.value ? Number(e.target.value) : "")} className="border rounded px-2 py-1 text-sm min-w-20">
                          <option value="">-</option>
                          {seqOptions.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col min-w-[12rem]">
                        <label className="text-xs text-gray-600">Test Section</label>
                        <select value={assignSectionId as any} onChange={(e) => setAssignSectionId(e.target.value ? Number(e.target.value) : "")} className="border rounded px-2 py-1 text-sm">
                          <option value="">Select Section</option>
                          {sections.map(s => <option key={s.TestSectionId} value={s.TestSectionId}>{s.TestSectionName}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-600">Marks</label>
                        <input type="number" placeholder="--" value={markMarks as any} onChange={(e) => setMarkMarks(e.target.value === "" ? "" : Number(e.target.value))} className="border rounded px-2 py-1 text-sm w-24" />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-600">Negative Marks</label>
                        <input type="number" placeholder="--" value={markNegMarks as any} onChange={(e) => setMarkNegMarks(e.target.value === "" ? "" : Number(e.target.value))} className="border rounded px-2 py-1 text-sm w-28" />
                      </div>
                      <div className="ml-auto">
                        <button onClick={applyBulkUpdate} className="rounded bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2">Apply</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Toolbar below Bulk Update: Delete (left) + centered Pagination (match Select grid style) */}
                <div className="py-4 px-4">
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center">
                    <div className="justify-self-start">
                      <button
                        onClick={() => {
                          const ids = Object.keys(delSelected).filter(k=> delSelected[Number(k)]).map(Number);
                          if (ids.length === 0) return;
                          setDraft((d)=>{
                            const qs = Array.isArray(d.testQuestions) ? d.testQuestions : [];
                            const updated = qs.filter((q: any) => !ids.includes(Number(q.TestQuestionId)));
                            return { ...d, testQuestions: updated };
                          });
                          setDelSelected({});
                          // adjust pagination if needed
                          const newTotal = total - ids.length;
                          const maxPage = Math.max(1, Math.ceil(newTotal / pageSize));
                          if (page > maxPage) setPage(maxPage);
                        }}
                        disabled={Object.values(delSelected).every(v=> !v)}
                        className="flex items-center gap-2 rounded bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                    <div className="justify-self-center">
                      <PaginationControls
                        page={page}
                        pageSize={pageSize}
                        total={total}
                        onPageChange={(p) => setPage(p)}
                        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
                        showTotalCount
                      />
                    </div>
                    <div></div>
                  </div>
                </div>

                <div className="overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 border-b w-10 text-left">
                          <input
                            type="checkbox"
                            checked={pageRows.length>0 && pageRows.every((r: any)=> delSelected[r.TestQuestionId])}
                            onChange={() => {
                              const all = pageRows.length>0 && pageRows.every((r: any)=> delSelected[r.TestQuestionId]);
                              setDelSelected((prev)=>{
                                const next = { ...prev } as Record<number, boolean>;
                                if (all) {
                                  pageRows.forEach((r: any) => { delete next[r.TestQuestionId]; });
                                } else {
                                  pageRows.forEach((r: any) => { next[r.TestQuestionId] = true; });
                                }
                                return next;
                              });
                            }}
                          />
                        </th>
                        <th className="px-4 py-2 border-b w-16 text-left">S.No</th>
                        <th className="px-4 py-2 border-b text-left">Question</th>
                        <th className="px-4 py-2 border-b w-28 text-left">Marks</th>
                        <th className="px-4 py-2 border-b w-36 text-left">Negative Marks</th>
                        <th className="px-4 py-2 border-b w-40 text-left">Test Section</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No questions added yet.</td>
                        </tr>
                      ) : (
                        pageRows.map((r: any, idx: number) => (
                          <tr key={r.TestQuestionId ?? idx} className={idx % 2 ? "bg-white" : "bg-gray-50/50"}>
                            <td className="px-4 py-2 border-b">
                              <input type="checkbox" checked={!!delSelected[r.TestQuestionId]} onChange={()=> setDelSelected(prev=> ({...prev, [r.TestQuestionId]: !prev[r.TestQuestionId]}))} />
                            </td>
                            <td className="px-4 py-2 border-b">{(page - 1) * pageSize + idx + 1}</td>
                            <td className="px-4 py-2 border-b">{r?.Question?.Questionoptions?.[0]?.QuestionText ?? "-"}</td>
                            <td className="px-4 py-2 border-b">{Number(r?.Marks ?? 0)}</td>
                            <td className="px-4 py-2 border-b">{Number(r?.NegativeMarks ?? 0)}</td>
                            <td className="px-4 py-2 border-b">{r?.TestSectionId ? (sections.find(s => s.TestSectionId === r.TestSectionId)?.TestSectionName ?? r.TestSectionId) : '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* No separate toolbar; actions are in header */}

              </div>
            </div>
          </div>
        )}

    {/* Default cards; show instructions only when total === 0 */}
    {(total === 0 || (total > 0 && !selectionFromBank)) && (
          <>
      <div className={total === 0 ? "lg:col-span-3" : "lg:col-span-4"}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-md border bg-gray-50 flex flex-col shadow-sm p-2">
                  <div className="p-3 text-center flex-1 flex flex-col items-center">
                    <MousePointerClick className="mx-auto mb-2 h-8 w-8 text-gray-400" strokeWidth={1.5} />
                    <p className="text-xs text-gray-600">Directly add questions from the question bank.</p>
                  </div>
                  <div className="px-4 pb-4 mt-auto">
                    <button onClick={handleSelectQuestions} className="w-full rounded-md bg-green-600 hover:bg-green-700 text-white py-1 text-sm">Select Question</button>
                  </div>
                </div>
                <div className="rounded-md border bg-gray-50 flex flex-col shadow-sm p-2">
                  <div className="p-3 text-center flex-1 flex flex-col items-center">
                    <Key className="mx-auto mb-2 h-8 w-8 text-gray-400" strokeWidth={1.5} />
                    <p className="text-xs text-gray-600">Associate new questions using a passkey.</p>
                  </div>
                  <div className="px-4 pb-4 mt-auto">
                    <button disabled className="w-full rounded-md bg-green-400/60 text-white py-1 text-sm cursor-not-allowed">Add With Passkey</button>
                  </div>
                </div>
                <div className="rounded-md border bg-gray-50 flex flex-col shadow-sm p-2">
                  <div className="p-3 text-center flex-1 flex flex-col items-center">
                    <FileSpreadsheet className="mx-auto mb-2 h-8 w-8 text-gray-400" strokeWidth={1.5} />
                    <p className="text-xs text-gray-600">Add questions via import.</p>
                  </div>
                  <div className="px-4 pb-4 mt-auto">
                    <select value={importType} onChange={handleImportChange} className="w-full rounded-md border border-gray-300 bg-white py-1 text-sm px-2">
                      <option value="">Select Import Type</option>
                      <option value="xls">Import from xls</option>
                      <option value="xml">Import from xml (QTI)</option>
                    </select>
                  </div>
                </div>
                <div className="rounded-md border bg-gray-50 flex flex-col shadow-sm p-2">
                  <div className="p-3 text-center flex-1 flex flex-col items-center">
                    <FilePlus2 className="mx-auto mb-2 h-8 w-8 text-gray-400" strokeWidth={1.5} />
                    <p className="text-xs text-gray-600">Create and add new questions.</p>
                  </div>
                  <div className="px-4 pb-4 mt-auto">
                    <button onClick={handleAddQuestions} className="w-full rounded-md bg-green-600 hover:bg-green-700 text-white py-1 text-sm">Add Questions</button>
                  </div>
                </div>
              </div>
            </div>
            {total === 0 && (
              <div className="lg:col-span-1">
                <ImportantInstructions
                  title="Important Instructions"
                  detail="This is to add questions in a created test. You can add questions using three methods: 1) Select predefined questions using question bank, 2) Import an excel sheet, incorporating multiple questions in one go, 3) Add new questions as per the user requirement."
                />
              </div>
            )}
          </>
        )}

        {/* Right panel actions only on immediate return from selection */}
  {total > 0 && selectionFromBank && (
          <div className="lg:col-span-1 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="rounded-md border bg-gray-50 flex flex-col shadow-sm p-2">
                <div className="p-3 text-center flex-1 flex flex-col items-center">
                  <MousePointerClick className="mx-auto mb-2 h-8 w-8 text-gray-400" strokeWidth={1.5} />
                  <p className="text-xs text-gray-600">Directly add questions from the question bank.</p>
                </div>
                <div className="px-4 pb-4 mt-auto">
                  <button onClick={handleSelectQuestions} className="w-full rounded-md bg-green-600 hover:bg-green-700 text-white py-1 text-sm">Select Question</button>
                </div>
              </div>
              <div className="rounded-md border bg-gray-50 flex flex-col shadow-sm p-2">
                <div className="p-3 text-center flex-1 flex flex-col items-center">
                  <Key className="mx-auto mb-2 h-8 w-8 text-gray-400" strokeWidth={1.5} />
                  <p className="text-xs text-gray-600">Associate new questions using a passkey.</p>
                </div>
                <div className="px-4 pb-4 mt-auto">
                  <button disabled className="w-full rounded-md bg-green-400/60 text-white py-1 text-sm cursor-not-allowed">Add With Passkey</button>
                </div>
              </div>
              <div className="rounded-md border bg-gray-50 flex flex-col shadow-sm p-2">
                <div className="p-3 text-center flex-1 flex flex-col items-center">
                  <FileSpreadsheet className="mx-auto mb-2 h-8 w-8 text-gray-400" strokeWidth={1.5} />
                  <p className="text-xs text-gray-600">Add questions via import.</p>
                </div>
                <div className="px-4 pb-4 mt-auto">
                  <select value={importType} onChange={handleImportChange} className="w-full rounded-md border border-gray-300 bg-white py-1 text-sm px-2">
                    <option value="">Select Import Type</option>
                    <option value="xls">Import from xls</option>
                    <option value="xml">Import from xml (QTI)</option>
                  </select>
                </div>
              </div>
              <div className="rounded-md border bg-gray-50 flex flex-col shadow-sm p-2">
                <div className="p-3 text-center flex-1 flex flex-col items-center">
                  <FilePlus2 className="mx-auto mb-2 h-8 w-8 text-gray-400" strokeWidth={1.5} />
                  <p className="text-xs text-gray-600">Create and add new questions.</p>
                </div>
                <div className="px-4 pb-4 mt-auto">
                  <button onClick={handleAddQuestions} className="w-full rounded-md bg-green-600 hover:bg-green-700 text-white py-1 text-sm">Add Questions</button>
                </div>
              </div>
            </div>
            {/* Hide instructions when questions exist */}
          </div>
        )}
      </div>
    </div>
  );
}
