"use client";

import ImportantInstructions from "@/components/ImportantInstructions";
import Toast, { type ToastType } from "@/components/Toast";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTestDraft } from "@/contexts/TestDraftContext";
// Sections are deprecated; no longer importing section normalization

import { MousePointerClick, FilePlus2, MinusCircle, FileInput } from "lucide-react";
import PaginationControls from "@/components/PaginationControls";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import { TextOrHtml } from "@/components/TextOrHtml";

// No TestSection usage anymore

export default function Step3AddQuestions({ editMode, testId, registerValidator }: { editMode?: boolean; testId?: number; registerValidator?: (fn: () => boolean) => void }) {
  const router = useRouter();
  const search = useSearchParams();
  const { draft, setDraft } = useTestDraft();
  // Sections removed: no TestAssignedSections snapshot/normalization

  const [selectionFromBank, setSelectionFromBank] = useState(false);

  // Paging for selected questions grid
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Bulk controls state
  const [assignFrom, setAssignFrom] = useState<number | "">("");
  const [assignTo, setAssignTo] = useState<number | "">("");
  // Section assignment removed
  const [markFrom, setMarkFrom] = useState<number | "">("");
  const [markTo, setMarkTo] = useState<number | "">("");
  const [markMarks, setMarkMarks] = useState<number | "">("");
  const [markNegMarks, setMarkNegMarks] = useState<number | "">("");
  const [markDuration, setMarkDuration] = useState<number | "">("");

  // No sections state
  const [delSelected, setDelSelected] = useState<Record<number, boolean>>({});
  const [toast, setToast] = useState<{ message: string; type?: ToastType } | null>(null);
  // Removed: edit gating confirmations; questions can be edited without restriction
  // Inline validation map per question id
  const [invalidMap, setInvalidMap] = useState<Record<number, string[]>>({});
  // Computed summary and handicapped duration
  const [handiDuration, setHandiDuration] = useState<number | "">("");
  // Subjects map for computing parent subject
  const [subjectMap, setSubjectMap] = useState<Record<number, { name: string; parentId: number }>>({});

  // Load subjects map once (cache in sessionStorage to avoid repeated loads)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cached = typeof window !== 'undefined' ? sessionStorage.getItem('admin:newTest:subjectMap') : null;
        if (cached) {
          const obj = JSON.parse(cached) as Record<number, { name: string; parentId: number }>;
          if (mounted) setSubjectMap(obj);
          return;
        }
      } catch { /* ignore */ }
      try {
  const res = await apiHandler(endpoints.listSubjectsOData as any, { query: "?$select=SubjectId,SubjectName,ParentId" } as any);
  const data: any = (res as any)?.data ?? {};
  const arr: any[] = Array.isArray(data?.value) ? data.value : (Array.isArray(data) ? data : []);
        const map: Record<number, { name: string; parentId: number }> = {};
        for (const s of arr) {
          const id = Number(s?.SubjectId ?? s?.subjectId);
          if (!Number.isFinite(id)) continue;
          map[id] = {
            name: s?.SubjectName ?? s?.subjectName ?? "",
            parentId: Number(s?.ParentId ?? s?.parentId ?? 0) || 0,
          };
        }
        if (mounted) setSubjectMap(map);
        try { sessionStorage.setItem('admin:newTest:subjectMap', JSON.stringify(map)); } catch { /* ignore */ }
      } catch { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, []);

  const computeRootParent = (subjectId?: number | null): { id: number | null; name: string | null } => {
    if (!subjectId || !Number.isFinite(subjectId)) return { id: null, name: null };
    let curr = Number(subjectId);
    const guard = 1000; // avoid infinite loops on bad data
    let steps = 0;
    while (steps < guard) {
      const node = subjectMap[curr];
      if (!node) break;
      if (!node.parentId || node.parentId === 0) return { id: curr, name: node.name ?? null };
      curr = node.parentId;
      steps++;
    }
    // Fallback to immediate node if present
    const n = subjectMap[Number(subjectId)];
    return n ? { id: Number(subjectId), name: n.name ?? null } : { id: null, name: null };
  };

  // No sections to fetch

  // Ingest session selection once when returning from Select Questions
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("admin:newTest:selectedQuestions");
      if (raw) {
        const data = JSON.parse(raw) as { questionIds?: number[]; testQuestions?: any[] };
        const toAdd = Array.isArray(data?.testQuestions) ? data!.testQuestions! : [];
        if (toAdd.length > 0) {
          // Defer to next tick to avoid setState-in-render warnings
          setTimeout(() => {
            setDraft((d) => {
              const existing = Array.isArray(d.testQuestions) ? d.testQuestions : [];
              const map = new Map<number, any>();
              for (const q of existing) map.set(q.TestQuestionId, q);
              for (const q of toAdd) map.set(q.TestQuestionId, q);
              return { ...d, testQuestions: Array.from(map.values()) };
            });
          }, 0);
          setSelectionFromBank(true);
        }
        // selected count banner removed; no longer tracking separate count here
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
          const subjRaw =
            // Prefer API shape: testquestions.question.subject (lower/camel variants)
            resp?.testquestions?.question?.subject
            ?? resp?.testQuestions?.question?.subject
            ?? resp?.question?.subject
            // Fall back to nested under Question
            ?? resp?.Question?.subject
            ?? resp?.Question?.Subject
            // Final fallbacks
            ?? resp?.Subject
            ?? resp?.subject;
          let Subject = subjRaw
            ? {
                ParentSubjectId: subjRaw?.ParentSubjectId ?? subjRaw?.parentSubjectId ?? undefined,
                ParentSubjectName: subjRaw?.ParentSubjectName ?? subjRaw?.parentSubjectName ?? undefined,
                SubjectId: subjRaw?.SubjectId ?? subjRaw?.subjectId ?? undefined,
                SubjectName: subjRaw?.SubjectName ?? subjRaw?.subjectName ?? undefined,
              }
            : undefined;
          // If parent fields are still missing but SubjectId exists, compute from subjectMap
          if ((!Subject?.ParentSubjectId || !Subject?.ParentSubjectName) && Subject?.SubjectId && Object.keys(subjectMap).length > 0) {
            const root = computeRootParent(Number(Subject.SubjectId));
            if (root.id || root.name) {
              Subject = {
                ...(Subject || {}),
                ParentSubjectId: root.id ?? Subject?.ParentSubjectId,
                ParentSubjectName: root.name ?? Subject?.ParentSubjectName,
              } as any;
            }
          }
          // Consider multiple possible fields for question text
          const fetchedText = resp?.questionText
            ?? resp?.question
            ?? resp?.Questionoptions?.[0]?.QuestionText
            ?? resp?.Question?.Questionoptions?.[0]?.QuestionText;
          // Defer update to avoid cross-render updates
          setTimeout(() => {
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
                    ...(Subject ? { Subject } : {}),
                  },
                };
              });
              return { ...d, testQuestions: updated };
            });
          }, 0);
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
    // No section snapshot restore

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search?.toString()]);

  // After selecting/adding questions, backfill Subject for any new rows missing it
  useEffect(() => {
    if (!selectionFromBank) return;
    // Wait until subjectMap is available to compute parents
    if (!subjectMap || Object.keys(subjectMap).length === 0) return;
    const work = async () => {
      try {
        const list: any[] = Array.isArray(draft?.testQuestions) ? draft!.testQuestions! : [];
        const targets = list
          .filter((q) => {
            const psn = q?.Question?.Subject?.ParentSubjectName;
            const sid = q?.Question?.Subject?.SubjectId
              ?? q?.Question?.subject?.subjectId
              ?? q?.SubjectId
              ?? q?.subjectId;
            // If we already have parent subject name, no need to refetch
            return !psn && !sid; // only rows with no subject info at all
          })
          .map((q) => Number(q?.TestQuestionId))
          .filter((id) => Number.isFinite(id) && id > 0);
        if (targets.length === 0) return;
        for (const id of targets) {
          try {
            const res = await apiHandler(endpoints.getQuestionById, { questionId: id } as any);
            const resp: any = res?.data || {};
            const subjRaw = resp?.testquestions?.question?.subject
              ?? resp?.testQuestions?.question?.subject
              ?? resp?.question?.subject
              ?? resp?.Question?.subject
              ?? resp?.Question?.Subject
              ?? resp?.Subject
              ?? resp?.subject;
            let Subject = subjRaw
              ? {
                  ParentSubjectId: subjRaw?.ParentSubjectId ?? subjRaw?.parentSubjectId ?? undefined,
                  ParentSubjectName: subjRaw?.ParentSubjectName ?? subjRaw?.parentSubjectName ?? undefined,
                  SubjectId: subjRaw?.SubjectId ?? subjRaw?.subjectId ?? undefined,
                  SubjectName: subjRaw?.SubjectName ?? subjRaw?.subjectName ?? undefined,
                }
              : undefined;
            if ((!Subject?.ParentSubjectId || !Subject?.ParentSubjectName) && Subject?.SubjectId) {
              const root = computeRootParent(Number(Subject.SubjectId));
              Subject = {
                ...(Subject || {}),
                ...(root.id ? { ParentSubjectId: root.id } : {}),
                ...(root.name ? { ParentSubjectName: root.name } : {}),
              } as any;
            }
            if (!Subject) continue;
            setDraft((d) => {
              const qs: any[] = Array.isArray(d.testQuestions) ? d.testQuestions : [];
              const updated = qs.map((q: any) =>
                Number(q?.TestQuestionId) === id
                  ? { ...q, Question: { ...(q?.Question || {}), Subject: { ...(q?.Question?.Subject || {}), ...Subject } } }
                  : q
              );
              return { ...d, testQuestions: updated };
            });
          } catch { /* ignore per-row failures */ }
        }
      } finally {
        // Done with one-time fix for new selections
        setSelectionFromBank(false);
      }
    };
    // Defer to avoid clashing with the initial ingest setDraft
    const t = setTimeout(() => { work(); }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionFromBank, subjectMap]);

  // Ensure categories are restored into draft if missing when in Step 3
  useEffect(() => {
    try {
      const d: any = draft || {};
      const hasCats = Array.isArray(d?.testAssignedTestCategories) && d.testAssignedTestCategories.length > 0;
      if (hasCats) return;
      const snapRaw = sessionStorage.getItem('admin:newTest:step1snapshot');
      if (snapRaw) {
        const snap = JSON.parse(snapRaw);
        const arr: any[] = Array.isArray(snap?.testAssignedTestCategories) ? snap.testAssignedTestCategories : [];
        if (arr.length > 0) {
          setDraft((prev) => ({ ...(prev || {}), testAssignedTestCategories: arr.map((x: any) => ({ TestCategoryId: Number(x?.TestCategoryId) })) }));
          return;
        }
      }
      const raw = sessionStorage.getItem('admin:newTest:selectedCategoryIds');
      if (raw) {
        const ids = JSON.parse(raw);
        if (Array.isArray(ids) && ids.length > 0) {
          const uniq = Array.from(new Set(ids.map((n: any) => Number(n)).filter((n: any) => Number.isFinite(n))));
          if (uniq.length > 0) {
            setDraft((prev) => ({ ...(prev || {}), testAssignedTestCategories: uniq.map((id) => ({ TestCategoryId: id })) }));
          }
        }
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  // Restore Step1 critical fields if they were lost after returning from editing a question
  useEffect(() => {
    try {
      const snapRaw = sessionStorage.getItem("admin:newTest:step1snapshot");
      if (!snapRaw) return;
      const snap = JSON.parse(snapRaw);
      if (!draft) return;
      // If any required Step1 field is now empty but snapshot has it, restore.
      const requiredKeys = [
        "TestName", "TestTypeId", "CategoryId", "DifficultyLevelId", "PrimaryInstructionId", "TestDuration", "TotalQuestions", "TotalMarks"
      ];
      let needsRestore = false;
      for (const k of requiredKeys) {
        if ((draft as any)[k] == null || (String((draft as any)[k]).trim() === "")) {
          if (snap[k] != null && String(snap[k]).trim() !== "") { needsRestore = true; break; }
        }
      }
      if (needsRestore) {
        setTimeout(() => {
          setDraft(d => ({
            ...snap, ...d, // draft wins for new keys
            // Ensure we don't overwrite updated questions array
            testQuestions: (d as any).testQuestions ?? snap.testQuestions,
          }));
        }, 0);
      }
    } catch {/* ignore */ }
  }, [draft, setDraft]);

  // Removed: selected questions banner and tracking

  const rows = useMemo(() => (Array.isArray(draft?.testQuestions) ? draft.testQuestions : []), [draft?.testQuestions]);
  const total = rows.length;
  const seqOptions = useMemo(() => Array.from({ length: total }, (_, i) => i + 1), [total]);
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  // Backfill Subject on rows to ensure ParentSubjectName/Id always present under Question.Subject
  useEffect(() => {
    setDraft((d) => {
      const qs: any[] = Array.isArray(d?.testQuestions) ? d.testQuestions : [];
      if (qs.length === 0) return d;
      let changed = false;
      const updated = qs.map((q: any) => {
        const subjObj = q?.Question?.Subject;
        const lowerSubj = q?.Question?.subject;
        const altSubj = q?.question?.subject || q?.question?.Subject;
        const parentName = subjObj?.ParentSubjectName
          ?? lowerSubj?.parentSubjectName
          ?? altSubj?.parentSubjectName
          ?? q?.ParentSubjectName
          ?? q?.parentSubjectName
          ?? q?.Question?.ParentSubjectName
          ?? null;
        const parentId = subjObj?.ParentSubjectId
          ?? lowerSubj?.parentSubjectId
          ?? altSubj?.parentSubjectId
          ?? q?.ParentSubjectId
          ?? q?.parentSubjectId
          ?? q?.Question?.ParentSubjectId
          ?? null;
        const childName = subjObj?.SubjectName
          ?? lowerSubj?.subjectName
          ?? altSubj?.subjectName
          ?? q?.SubjectName
          ?? q?.subjectName
          ?? q?.Question?.SubjectName
          ?? null;
        const childId = subjObj?.SubjectId
          ?? lowerSubj?.subjectId
          ?? altSubj?.subjectId
          ?? q?.SubjectId
          ?? q?.subjectId
          ?? q?.Question?.SubjectId
          ?? null;
        // If still missing parent and we have SubjectId plus a loaded subjectMap, compute root parent
        let computedParentName: string | null = parentName;
        let computedParentId: number | null = parentId as any;
        if ((!computedParentName || computedParentId == null) && childId && Object.keys(subjectMap).length > 0) {
          const root = computeRootParent(Number(childId));
          computedParentName = computedParentName ?? root.name;
          computedParentId = computedParentId ?? (root.id as any);
        }
        const needSubjectContainer = !q?.Question?.Subject && (parentName != null || parentId != null || childName != null || childId != null);
        const needParentName = !!q?.Question && (!q?.Question?.Subject?.ParentSubjectName && computedParentName != null);
        const needParentId = !!q?.Question && (!q?.Question?.Subject?.ParentSubjectId && computedParentId != null);
        const needChildName = !!q?.Question && (!q?.Question?.Subject?.SubjectName && childName != null);
        const needChildId = !!q?.Question && (!q?.Question?.Subject?.SubjectId && childId != null);
        if (needSubjectContainer || needParentName || needParentId || needChildName || needChildId) {
          changed = true;
          return {
            ...q,
            Question: {
              ...(q?.Question || {}),
              Subject: {
                ...(q?.Question?.Subject || {}),
                ...(computedParentName != null ? { ParentSubjectName: computedParentName } : {}),
                ...(computedParentId != null ? { ParentSubjectId: computedParentId } : {}),
                ...(childName != null ? { SubjectName: childName } : {}),
                ...(childId != null ? { SubjectId: childId } : {}),
              },
            },
          };
        }
        return q;
      });
      return changed ? { ...d, testQuestions: updated } : d;
    });
    // We intentionally depend on rows to re-check when data changes
  }, [rows, setDraft, subjectMap]);

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
      // Enforce: duration must be strictly greater than 0
      if (!Number.isFinite(dur) || dur <= 0) errs.push("Duration must be greater than 0");
      if (errs.length) next[id] = errs;
    }
    setInvalidMap(next);
  }, [rows]);

  // Initialize handicapped duration from draft once
  useEffect(() => {
    if (handiDuration === "" && draft?.TestDurationForHandicappedMinutes != null) {
      setHandiDuration(Number(draft.TestDurationForHandicappedMinutes));
    }
  }, [draft?.TestDurationForHandicappedMinutes]);

  // Computed totals from selected rows
  const computed = useMemo(() => {
    const list: any[] = Array.isArray(draft?.testQuestions) ? draft!.testQuestions! : [];
    const totalQuestions = list.length;
    const totalMarks = list.reduce((s, q) => s + (Number(q?.Marks === "" ? 0 : (q?.Marks ?? 0)) || 0), 0);
    const totalDuration = list.reduce((s, q) => s + (Number(q?.Duration === "" ? 0 : (q?.Duration ?? 0)) || 0), 0);
    return { totalQuestions, totalMarks, totalDuration };
  }, [draft?.testQuestions]);

  // Keep handicapped in sync with normal whenever selected questions change
  useEffect(() => {
    // Always align handicapped to computed normal duration on question changes
    setHandiDuration(computed.totalDuration);
  }, [computed.totalDuration]);

  // Persist computed Normal duration and totals to draft for save path
  useEffect(() => {
    setDraft((d: any) => ({
      ...d,
      TestDurationMinutes: computed.totalDuration,
      TotalQuestions: computed.totalQuestions,
      TotalMarks: computed.totalMarks,
      // Enforce handicapped >= normal
      TestDurationForHandicappedMinutes:
        handiDuration === "" ? computed.totalDuration : Math.max(Number(handiDuration), computed.totalDuration),
    }));
  }, [computed, handiDuration, setDraft]);

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

  // NOTE: Intentionally NOT auto-updating draft.TotalQuestions / draft.TotalMarks here.
  // Step 1 totals are user-entered business values and must remain stable even if questions are removed/added in Step 3.
  // (Previous auto-sync removed per new requirement.)

  // No per-section aggregates

  // Section assignment removed

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
  const hasMarks = markMarks !== "" || markNegMarks !== "";
    const hasDuration = markDuration !== "";
  if (!hasMarks && !hasDuration) return; // nothing to update
    if (markMarks !== "" && markNegMarks !== "" && Number(markNegMarks) > Number(markMarks)) {
      setToast({ message: "Negative Marks should not be greater than Marks.", type: "error" });
      return;
    }
    if (hasDuration && Number(markDuration) <= 0) {
      setToast({ message: "Duration must be greater than 0.", type: "error" });
      return;
    }

    setDraft((d) => {
      const qs = Array.isArray(d.testQuestions) ? d.testQuestions : [];
      const updated = qs.map((q: any, idx: number) => {
        const sn = idx + 1;
        if (sn < start || sn > end) return q;
        return {
          ...q,
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
      // Also snapshot currently selected categories to ensure persistence on return
      try {
        const cats: any[] = Array.isArray((draft as any)?.testAssignedTestCategories) ? (draft as any).testAssignedTestCategories : [];
        const cids = Array.from(new Set(cats.map((c: any) => Number(c?.TestCategoryId)).filter((n: any) => Number.isFinite(n))));
        if (cids.length > 0) {
          sessionStorage.setItem('admin:newTest:selectedCategoryIds', JSON.stringify(cids));
        }
      } catch { /* ignore */ }
      // Prevent wizard unmount cleanup while we jump to the selection sub-page
      sessionStorage.setItem("admin:newTest:suppressClear", "1");
    } catch { }
    const base = "/admin/tests/new/questions/select";
    const url = editMode && testId ? `${base}?edit=1&id=${testId}` : base;
    router.push(url);
  };
  const handleAddQuestions = () => {
    try {
      // Prevent wizard unmount cleanup while we jump to the question creation page
      sessionStorage.setItem("admin:newTest:suppressClear", "1");
      // Snapshot categories too
      try {
        const cats: any[] = Array.isArray((draft as any)?.testAssignedTestCategories) ? (draft as any).testAssignedTestCategories : [];
        const cids = Array.from(new Set(cats.map((c: any) => Number(c?.TestCategoryId)).filter((n: any) => Number.isFinite(n))));
        if (cids.length > 0) {
          sessionStorage.setItem('admin:newTest:selectedCategoryIds', JSON.stringify(cids));
        }
      } catch { /* ignore */ }
    } catch { }
    const returnPath = (editMode && testId)
      ? `/admin/tests/edit/${testId}?step=3`
      : "/admin/tests/new?step=3";
    router.push(`/admin/questions/new?returnTo=${encodeURIComponent(returnPath)}`);
  };
  const handleImportQuestions = () => {
    // Placeholder – will be linked to import route later
    setToast({ message: "Import from Word parsing coming soon.", type: "info" });
  };

  return (
    <div className="w-full pb-32">
      {/* Removed published-edit confirmation modal */}
      {/* Toast positioned top-right */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {total > 0 && (
          <div className="lg:col-span-3">
            <div className="w-full">
              <div className="rounded-lg border bg-white shadow-sm">
                <div className="bg-blue-600 text-white px-4 py-2 text-base font-semibold rounded-t-lg flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">Selected Questions ({total})</div>
                  <div className="flex-1"></div>
                </div>

                {/* Summary section: split into Marks and Duration boxes, fit in one row on large screens */}
                <div className="p-4 border-b">
                  <div className="flex flex-col lg:flex-row gap-3 mb-3">
                    {/* Marks box */}
                    <div className="bg-gray-50 rounded-md p-3 border flex-1 min-w-[280px]">
                      <div className="text-sm font-semibold mb-2">Test Totals</div>
                      <div className="flex flex-wrap items-end gap-4">
                        <div className="flex flex-col min-w-[8rem]">
                          <label className="text-xs text-gray-600">Total Questions</label>
                          <div className="px-2 py-1 text-sm font-semibold text-gray-900">{computed.totalQuestions}</div>
                        </div>
                        <div className="flex flex-col min-w-[8rem]">
                          <label className="text-xs text-gray-600">Total Marks</label>
                          <div className="px-2 py-1 text-sm font-semibold text-gray-900">{computed.totalMarks}</div>
                        </div>
                      </div>
                    </div>

                    {/* Duration box */}
                    <div className="bg-gray-50 rounded-md p-3 border flex-1 min-w-[300px]">
                      <div className="text-sm font-semibold mb-2">Duration (minutes)</div>
                      <div className="flex flex-nowrap items-end gap-4">
                        <div className="flex flex-col min-w-[8rem]">
                          <label className="text-xs text-gray-600">Normal</label>
                          <div className="px-2 py-1 text-sm font-semibold text-gray-900">{computed.totalDuration}</div>
                        </div>
                        <div className="flex flex-col min-w-[10rem]">
                          <label className="text-xs text-gray-600" htmlFor="handiDuration">Handicapped</label>
                          <input
                            id="handiDuration"
                            type="number"
                            min={computed.totalDuration}
                            className="border rounded px-2 py-1 text-sm w-24"
                            value={handiDuration as any}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v === "") { setHandiDuration(""); return; }
                              const num = Number(v);
                              if (!Number.isFinite(num)) return;
                              // Clamp to normal duration minimum
                              setHandiDuration(Math.max(num, computed.totalDuration));
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
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
                      {/* Subject is derived from the question; no bulk update control */}
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
                          const ids = Object.keys(delSelected).filter(k => delSelected[Number(k)]).map(Number);
                          if (ids.length === 0) return;
                          setDraft((d) => {
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
                        disabled={Object.values(delSelected).every(v => !v)}
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
                            checked={pageRows.length > 0 && pageRows.every((r: any) => delSelected[r.TestQuestionId])}
                            onChange={() => {
                              const all = pageRows.length > 0 && pageRows.every((r: any) => delSelected[r.TestQuestionId]);
                              setDelSelected((prev) => {
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
                        <th className="px-4 py-2 border-b w-40 text-left">Subject</th>
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
                              <input type="checkbox" checked={!!delSelected[r.TestQuestionId]} onChange={() => setDelSelected(prev => ({ ...prev, [r.TestQuestionId]: !prev[r.TestQuestionId] }))} />
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
                                  ? `/admin/tests/edit/${testId}?step=3`
                                  : "/admin/tests/new?step=3";
                                const href = `/admin/questions/${qid}/edit?returnTo=${encodeURIComponent(base)}`;
                                // Removed: no published gating
                                return (
                                  <a
                                    href={href}
                                    className="text-blue-600 visited:text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      // Snapshot Step1 critical fields & sections so they can be restored if lost
                                      try {
                                        const snap: any = {};
                                        const keys = ["TestName", "TestTypeId", "CategoryId", "DifficultyLevelId", "PrimaryInstructionId", "TestDuration", "TotalQuestions", "TotalMarks"];
                                        for (const k of keys) snap[k] = (draft as any)?.[k];
                                        // Include categories in the snapshot for robustness
                                        const cats: any[] = Array.isArray((draft as any)?.testAssignedTestCategories) ? (draft as any).testAssignedTestCategories : [];
                                        if (cats.length > 0) {
                                          snap.testAssignedTestCategories = cats.map((c: any) => ({ TestCategoryId: Number(c?.TestCategoryId) })).filter((x: any) => Number.isFinite(x.TestCategoryId));
                                        } else {
                                          try {
                                            const raw = sessionStorage.getItem('admin:newTest:selectedCategoryIds');
                                            if (raw) {
                                              const ids = JSON.parse(raw);
                                              if (Array.isArray(ids)) {
                                                const uniq = Array.from(new Set(ids.map((n: any) => Number(n)).filter((n: any) => Number.isFinite(n))));
                                                snap.testAssignedTestCategories = uniq.map((id) => ({ TestCategoryId: id }));
                                              }
                                            }
                                          } catch { /* ignore */ }
                                        }
                                        sessionStorage.setItem("admin:newTest:step1snapshot", JSON.stringify(snap));
                                      } catch {/* ignore */ }
                                      // Removed: usage check and published confirmation; always navigate to editor
                                      try { sessionStorage.setItem("admin:newTest:suppressClear", "1"); } catch { }
                                      router.push(href);
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
                                className={`border rounded px-2 py-1 text-sm w-24 ${invalidMap[r?.TestQuestionId]?.some(e => e.toLowerCase().includes('non-negative')) ? 'border-red-500' : ''}`}
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
                                className={`border rounded px-2 py-1 text-sm w-28 ${invalidMap[r?.TestQuestionId]?.some(e => e.toLowerCase().includes('negative marks') || e.toLowerCase().includes('exceed')) ? 'border-red-500' : ''}`}
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
                                min={1}
                                className={`border rounded px-2 py-1 text-sm w-28 ${invalidMap[r?.TestQuestionId]?.some(e => e.toLowerCase().includes('duration')) ? 'border-red-500' : ''}`}
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
                              {(() => {
                                // Show only ParentSubjectName from model.TestQuestions.Question.Subject
                                const name = r?.Question?.Subject?.ParentSubjectName ?? "-";
                                return <span className="inline-block truncate max-w-[12rem]">{name}</span>;
                              })()}
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
