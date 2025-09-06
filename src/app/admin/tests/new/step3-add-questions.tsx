"use client";

import ImportantInstructions from "@/components/ImportantInstructions";
import Toast, { type ToastType } from "@/components/Toast";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTestDraft } from "@/contexts/TestDraftContext";
import { MousePointerClick, FilePlus2, MinusCircle, FileInput } from "lucide-react";
import PaginationControls from "@/components/PaginationControls";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import { TextOrHtml } from "@/components/TextOrHtml";

type TestSection = { TestSectionId: number; TestSectionName: string };

export default function Step3AddQuestions({ editMode, testId, registerValidator }: { editMode?: boolean; testId?: number; registerValidator?: (fn: () => boolean) => void }) {
  const router = useRouter();
  const search = useSearchParams();
  const { draft, setDraft } = useTestDraft();

  const [selectedCount, setSelectedCount] = useState<number>(0);
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
  const [markDuration, setMarkDuration] = useState<number | "">("");

  const [sections, setSections] = useState<TestSection[]>([]);
  const [delSelected, setDelSelected] = useState<Record<number, boolean>>({});
  const [toast, setToast] = useState<{ message: string; type?: ToastType } | null>(null);
  // Confirm editing when test is Published
  const [confirmEditHref, setConfirmEditHref] = useState<string | null>(null);
  // Inline validation map per question id
  const [invalidMap, setInvalidMap] = useState<Record<number, string[]>>({});

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
  // We are back in the wizard; allow cleanup on future exits
  sessionStorage.removeItem("admin:newTest:suppressClear");
      }
    } catch {
      // ignore parse errors
    }
    // If returning from Edit Question with an explicit updatedQuestionId, refresh only that row
    const updatedIdParam = search?.get("updatedQuestionId");
    const updatedId = updatedIdParam ? Number(updatedIdParam) : 0;
    if (updatedId > 0) {
      (async () => {
        try {
          // Ensure the question exists in current draft before calling API
          const exists = Array.isArray(draft?.testQuestions) && (draft!.testQuestions as any[]).some(q => Number(q?.TestQuestionId) === updatedId);
          if (!exists) return;
          const res = await apiHandler(endpoints.getQuestionById, { questionId: updatedId } as any);
          const resp: any = res?.data || {};
          const meta = resp?.questionsMeta || {};
          const marks = Number(resp?.marks ?? meta?.marks ?? 0);
          const neg = Number(resp?.negativeMarks ?? meta?.negativeMarks ?? 0);
          const dur = Number(meta?.duration ?? resp?.duration ?? resp?.questionDuration ?? 0);
          // Consider multiple possible fields for question text
          const fetchedText = resp?.questionText
            ?? resp?.question
            ?? resp?.Questionoptions?.[0]?.QuestionText
            ?? resp?.Question?.Questionoptions?.[0]?.QuestionText;
          setDraft((d) => {
            const qs: any[] = Array.isArray(d.testQuestions) ? d.testQuestions : [];
            const updated = qs.map((q: any) => {
              if (Number(q?.TestQuestionId) !== updatedId) return q;
              const existingText = q?.Question?.Questionoptions?.[0]?.QuestionText;
              const effectiveText = (typeof fetchedText === 'string' && fetchedText.trim() !== '')
                ? fetchedText
                : (existingText ?? "-");
              return {
                ...q,
                Marks: Number.isFinite(marks) ? marks : (q?.Marks ?? 0),
                NegativeMarks: Number.isFinite(neg) ? neg : (q?.NegativeMarks ?? 0),
                Duration: Number.isFinite(dur) ? dur : (q?.Duration ?? 0),
                Question: {
                  ...(q?.Question || {}),
                  Questionoptions: [{ QuestionText: effectiveText }],
                },
              };
            });
            return { ...d, testQuestions: updated };
          });
          setToast({ message: "Question updated.", type: "success" });
        } catch {
          // Ignore refresh errors and keep existing data
        } finally {
          // Clean the URL param to avoid re-fetching on further nav
          try {
            const url = new URL(window.location.href);
            url.searchParams.delete("updatedQuestionId");
            // Preserve other params (like step=3)
            router.replace(url.pathname + (url.search || "") + (url.hash || ""));
          } catch {
            /* noop */
          }
        }
      })();
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

  // Build validation state when rows change
  useEffect(() => {
    const next: Record<number, string[]> = {};
    for (const q of rows as any[]) {
      const id = Number(q?.TestQuestionId);
      if (!id) continue;
      const errs: string[] = [];
      // Treat empty as 0; only validate non-negative and relationship
  const marks = Number(q?.Marks === "" ? 0 : (q?.Marks ?? 0));
  const neg = Number(q?.NegativeMarks === "" ? 0 : (q?.NegativeMarks ?? 0));
  const dur = Number(q?.Duration === "" ? 0 : (q?.Duration ?? 0));
      if (!Number.isFinite(marks) || marks < 0) errs.push("Marks must be a non-negative number");
      if (!Number.isFinite(neg) || neg < 0) errs.push("Negative Marks must be non-negative");
      if (neg > marks) errs.push("Negative Marks cannot exceed Marks");
      if (!Number.isFinite(dur) || dur < 0) errs.push("Duration must be non-negative");
      if (errs.length) next[id] = errs;
    }
    setInvalidMap(next);
  }, [rows]);

  // Register validator with parent to block navigating away when invalid
  useEffect(() => {
    if (!registerValidator) return;
    const fn = () => {
      const hasInvalid = Object.keys(invalidMap).length > 0;
      if (hasInvalid) {
        // Build a concise error summary: show up to first 3 rows with issues
        try {
          const firstThree = Object.entries(invalidMap).slice(0, 3);
          const lines = firstThree.map(([id, errs]) => {
            // Find the 1-based row index for display
            const idx = rows.findIndex((q: any) => Number(q?.TestQuestionId) === Number(id));
            const rowNum = idx >= 0 ? idx + 1 : id;
            const brief = (errs as string[]).slice(0, 2).join("; ");
            return `Row ${rowNum}: ${brief}`;
          });
          const extra = Object.keys(invalidMap).length > 3 ? " …" : "";
          const msg = `Fix inline errors before navigating.\n${lines.join("\n")}${extra}`;
          setToast({ message: msg, type: "error" });
        } catch {
          setToast({ message: "Fix inline errors in Step 3 before navigating.", type: "error" });
        }
        return false;
      }
      return true;
    };
    registerValidator(fn);
  }, [invalidMap, registerValidator]);

  // Recalculate totals when questions change (keeps Step 1 totals consistent)
  useEffect(() => {
    setDraft((d) => {
      const qs: any[] = Array.isArray(d.testQuestions) ? d.testQuestions : [];
      const totalQ = qs.length;
      const totalMarks = qs.reduce((sum, q) => {
        const v = q?.Marks === "" ? 0 : (q?.Marks ?? 0);
        return sum + (Number(v) || 0);
      }, 0);
      // Avoid unnecessary state updates
      if (d.TotalQuestions === totalQ && d.TotalMarks === totalMarks) return d;
      return { ...d, TotalQuestions: totalQ, TotalMarks: totalMarks };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

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
  const hasDuration = markDuration !== "";
  if (!hasSection && !hasMarks && !hasDuration) return; // nothing to update
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
      ...(hasDuration ? { Duration: Number(markDuration) } : {}),
        };
      });
      return { ...d, testQuestions: updated };
    });

  // clear inputs but keep section selection to allow repeated applies if desired
    setMarkMarks("");
    setMarkNegMarks("");
    setMarkDuration("");
  setAssignFrom("");
  setAssignTo("");
  };

  const handleSelectQuestions = () => {
    try {
      const ids = Array.isArray(draft?.testQuestions)
        ? (draft.testQuestions as any[]).map((q: any) => Number(q.TestQuestionId)).filter(Boolean)
        : [];
      sessionStorage.setItem("admin:newTest:preselectedIds", JSON.stringify(ids));
  // Prevent wizard unmount cleanup while we jump to the selection sub-page
  sessionStorage.setItem("admin:newTest:suppressClear", "1");
    } catch {}
  const base = "/admin/tests/new/questions/select";
  const url = editMode && testId ? `${base}?edit=1&id=${encodeURIComponent(String(testId))}` : base;
  router.push(url);
  };
  const handleAddQuestions = () => {
    try {
      // Prevent wizard unmount cleanup while we jump to the question creation page
      sessionStorage.setItem("admin:newTest:suppressClear", "1");
    } catch {}
    const returnPath = (editMode && testId)
      ? `/admin/tests/edit/${encodeURIComponent(String(testId))}?step=3`
      : "/admin/tests/new?step=3";
    router.push(`/admin/questions/new?returnTo=${encodeURIComponent(returnPath)}`);
  };
  const handleImportQuestions = () => {
    // Placeholder – will be linked to import route later
    setToast({ message: "Import from Word parsing coming soon.", type: "info" });
  };

  return (
    <div className="w-full pb-32">
      {/* Confirm before editing when TestStatus is Published */}
      <ConfirmationModal
        isOpen={!!confirmEditHref}
        title="Edit Published Test?"
        message="This test is published. Editing a question may affect ongoing or scheduled exams. Do you want to continue to the question editor?"
        variant="danger"
        confirmText="Proceed to Edit"
        cancelText="Cancel"
        onCancel={() => setConfirmEditHref(null)}
        onConfirm={() => {
          const href = confirmEditHref;
          setConfirmEditHref(null);
          try { sessionStorage.setItem("admin:newTest:suppressClear", "1"); } catch {}
          if (href) {
            try {
              // Prefer full navigation to avoid stuck transitional states
              window.location.assign(href);
            } catch {
              router.push(href);
            }
          }
        }}
      />
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
          <div className="lg:col-span-3">
            <div className="w-full">
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
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-600">Duration</label>
                        <input type="number" placeholder="--" value={markDuration as any} onChange={(e) => setMarkDuration(e.target.value === "" ? "" : Number(e.target.value))} className="border rounded px-2 py-1 text-sm w-28" />
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
                        <MinusCircle className="w-4 h-4" />
                        <span>Remove</span>
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
                        <th className="px-4 py-2 border-b w-28 text-left">Duration</th>
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
                            <td className="px-4 py-2 border-b">
                              {(() => {
                                const qid = Number(r?.TestQuestionId);
                                const qtext = r?.Question?.Questionoptions?.[0]?.QuestionText ?? "-";
                                if (!qid || qid <= 0) {
                                  return <TextOrHtml content={qtext} />;
                                }
                                const base = editMode && testId
                                  ? `/admin/tests/edit/${encodeURIComponent(String(testId))}?step=3`
                                  : "/admin/tests/new?step=3";
                                const href = `/admin/questions/${encodeURIComponent(String(qid))}/edit?returnTo=${encodeURIComponent(base)}`;
                                const isPublished = String((draft as any)?.TestStatus || "").trim().toLowerCase() === "published";
                                return (
                                  <a
                                    href={href}
                                    className="text-blue-600 visited:text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      try {
                                        // First, check if question is in use via OData function
                                        const res = await apiHandler(endpoints.isQuestionInUse, { testQuestionId: qid } as any);
                                        const data: any = res?.data;
                                        // Accept either boolean or object with a boolean field
                                        const inUse = typeof data === 'boolean'
                                          ? data
                                          : (data?.value ?? data?.InUse ?? data?.isInUse ?? false);
                                        if (inUse) {
                                          setToast({ message: "This question is already in use and cannot be edited.", type: "warning" });
                                          return;
                                        }
                                      } catch {
                                        // If the check fails, be safe and block with a message
                                        setToast({ message: "Unable to verify question usage. Please try again later.", type: "error" });
                                        return;
                                      }

                                      // Next, gate editing when test is Published
                                      if (isPublished) {
                                        setConfirmEditHref(href);
                                        return;
                                      }
                                      try { sessionStorage.setItem("admin:newTest:suppressClear", "1"); } catch {}
                                      try {
                                        window.location.assign(href);
                                      } catch {
                                        router.push(href);
                                      }
                                    }}
                                    title="Edit question"
                                  >
                                    <TextOrHtml content={qtext} inheritColor unstyled />
                                  </a>
                                );
                              })()}
                            </td>
                            <td className="px-4 py-2 border-b">
                              <input
                                type="number"
                                min={0}
                                className={`border rounded px-2 py-1 text-sm w-24 ${invalidMap[r?.TestQuestionId]?.some(e=> e.toLowerCase().includes('non-negative')) ? 'border-red-500' : ''}`}
                                value={(r?.Marks === "" ? "" : (r?.Marks ?? 0)) as any}
                                onChange={(e) => {
                                  const valStr = e.target.value;
                                  setDraft((d) => {
                                    const qs = Array.isArray(d.testQuestions) ? d.testQuestions : [];
                                    const updated = qs.map((q: any) =>
                                      Number(q.TestQuestionId) === Number(r.TestQuestionId)
                                        ? { ...q, Marks: valStr === "" ? "" : Number(valStr) }
                                        : q
                                    );
                                    return { ...d, testQuestions: updated };
                                  });
                                }}
                              />
                            </td>
                            <td className="px-4 py-2 border-b">
                              <input
                                type="number"
                                min={0}
                                className={`border rounded px-2 py-1 text-sm w-28 ${invalidMap[r?.TestQuestionId]?.some(e=> e.toLowerCase().includes('negative marks') || e.toLowerCase().includes('exceed')) ? 'border-red-500' : ''}`}
                                value={(r?.NegativeMarks === "" ? "" : (r?.NegativeMarks ?? 0)) as any}
                                onChange={(e) => {
                                  const valStr = e.target.value;
                                  setDraft((d) => {
                                    const qs = Array.isArray(d.testQuestions) ? d.testQuestions : [];
                                    const updated = qs.map((q: any) =>
                                      Number(q.TestQuestionId) === Number(r.TestQuestionId)
                                        ? { ...q, NegativeMarks: valStr === "" ? "" : Number(valStr) }
                                        : q
                                    );
                                    return { ...d, testQuestions: updated };
                                  });
                                }}
                              />
                            </td>
                            <td className="px-4 py-2 border-b">
                              <input
                                type="number"
                                min={0}
                                className={`border rounded px-2 py-1 text-sm w-28 ${invalidMap[r?.TestQuestionId]?.some(e=> e.toLowerCase().includes('duration')) ? 'border-red-500' : ''}`}
                                value={(r?.Duration === "" ? "" : (r?.Duration ?? 0)) as any}
                                onChange={(e) => {
                                  const valStr = e.target.value;
                                  setDraft((d) => {
                                    const qs = Array.isArray(d.testQuestions) ? d.testQuestions : [];
                                    const updated = qs.map((q: any) =>
                                      Number(q.TestQuestionId) === Number(r.TestQuestionId)
                                        ? { ...q, Duration: valStr === "" ? "" : Number(valStr) }
                                        : q
                                    );
                                    return { ...d, testQuestions: updated };
                                  });
                                }}
                              />
                            </td>
                            <td className="px-4 py-2 border-b">
                              <select
                                className="border rounded px-2 py-1 text-sm w-40"
                                value={(r?.TestSectionId as any) ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value ? Number(e.target.value) : "";
                                  setDraft((d) => {
                                    const qs = Array.isArray(d.testQuestions) ? d.testQuestions : [];
                                    const updated = qs.map((q: any) =>
                                      Number(q.TestQuestionId) === Number(r.TestQuestionId)
                                        ? { ...q, TestSectionId: val === "" ? undefined : val }
                                        : q
                                    );
                                    return { ...d, testQuestions: updated };
                                  });
                                }}
                              >
                                <option value="">Select Section</option>
                                {sections.map((s) => (
                                  <option key={s.TestSectionId} value={s.TestSectionId}>
                                    {s.TestSectionName}
                                  </option>
                                ))}
                              </select>
                            </td>
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
  {total === 0 && (
          <>
  <div className="lg:col-span-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="rounded border bg-gray-50 flex flex-col shadow-sm p-1.5">
                  <div className="p-2 text-center flex-1 flex flex-col items-center">
                    <MousePointerClick className="mx-auto mb-1.5 h-6 w-6 text-gray-400" strokeWidth={1.5} />
                    <p className="text-xs text-gray-600">Directly add questions from the question bank.</p>
                  </div>
                  <div className="px-3 pb-3 mt-auto">
                    <button onClick={handleSelectQuestions} className="w-full rounded-md bg-green-600 hover:bg-green-700 text-white py-1 text-xs">Select Question</button>
                  </div>
                </div>
                <div className="rounded border bg-gray-50 flex flex-col shadow-sm p-1.5">
                  <div className="p-2 text-center flex-1 flex flex-col items-center">
                    <FilePlus2 className="mx-auto mb-1.5 h-6 w-6 text-gray-400" strokeWidth={1.5} />
                    <p className="text-xs text-gray-600">Create and add new questions.</p>
                  </div>
                  <div className="px-3 pb-3 mt-auto">
                    <button onClick={handleAddQuestions} className="w-full rounded-md bg-green-600 hover:bg-green-700 text-white py-1 text-xs">Add Questions</button>
                  </div>
                </div>
                <div className="rounded border bg-gray-50 flex flex-col shadow-sm p-1.5">
                  <div className="p-2 text-center flex-1 flex flex-col items-center">
                    <FileInput className="mx-auto mb-1.5 h-6 w-6 text-gray-400" strokeWidth={1.5} />
                    <p className="text-xs text-gray-600">It is for importing questions from word parsing.</p>
                  </div>
                  <div className="px-3 pb-3 mt-auto">
                    <button onClick={handleImportQuestions} className="w-full rounded-md bg-green-600 hover:bg-green-700 text-white py-1 text-xs">Import Questions</button>
                  </div>
                </div>
              </div>
            </div>
            {total === 0 && (
              <div className="lg:col-span-1">
                <ImportantInstructions
                  title="Important Instructions"
          detail="This is to add questions in a created test. You can add questions using two methods: 1) Select predefined questions using the question bank, 2) Create and add new questions as per the requirement."
                />
              </div>
            )}
          </>
        )}
    {/* Right panel actions when there are questions */}
  {total > 0 && (
          <div className="lg:col-span-1 space-y-2">
            <div className="grid grid-cols-1 gap-2">
              <div className="rounded border bg-gray-50 flex flex-col shadow-sm p-1.5">
                <div className="p-2 text-center flex-1 flex flex-col items-center">
                  <MousePointerClick className="mx-auto mb-1.5 h-6 w-6 text-gray-400" strokeWidth={1.5} />
                  <p className="text-xs text-gray-600">Directly add questions from the question bank.</p>
                </div>
                <div className="px-3 pb-3 mt-auto">
                  <button onClick={handleSelectQuestions} className="w-full rounded-md bg-green-600 hover:bg-green-700 text-white py-1 text-xs">Select Question</button>
                </div>
              </div>
              <div className="rounded border bg-gray-50 flex flex-col shadow-sm p-1.5">
                <div className="p-2 text-center flex-1 flex flex-col items-center">
                  <FilePlus2 className="mx-auto mb-1.5 h-6 w-6 text-gray-400" strokeWidth={1.5} />
                  <p className="text-xs text-gray-600">Create and add new questions.</p>
                </div>
                <div className="px-3 pb-3 mt-auto">
                  <button onClick={handleAddQuestions} className="w-full rounded-md bg-green-600 hover:bg-green-700 text-white py-1 text-xs">Add Questions</button>
                </div>
              </div>
              <div className="rounded border bg-gray-50 flex flex-col shadow-sm p-1.5">
                <div className="p-2 text-center flex-1 flex flex-col items-center">
                  <FileInput className="mx-auto mb-1.5 h-6 w-6 text-gray-400" strokeWidth={1.5} />
                  <p className="text-xs text-gray-600">It is for importing questions from word parsing.</p>
                </div>
                <div className="px-3 pb-3 mt-auto">
                  <button onClick={handleImportQuestions} className="w-full rounded-md bg-green-600 hover:bg-green-700 text-white py-1 text-xs">Import Questions</button>
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
