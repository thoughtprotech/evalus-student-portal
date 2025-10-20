"use client";

import { useRef, useState, useEffect, useMemo } from "react";
// Sections removed: no normalizeAssignedSections needed
import ImportantInstructions from "@/components/ImportantInstructions";
import YesNoToggle from "@/components/ui/YesNoToggle";
import Modal from "@/components/Modal";
import type {
  TestCategoryOData,
  TestDifficultyLevelOData,
  TestInstructionOData,
  TestTypeOData,
  TestTemplateOData,
} from "@/utils/api/types";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import { useTestDraft } from "@/contexts/TestDraftContext";
// Presentational Step 1 only; container handles StepWizard & actions

export type Step1CreateTestDetailsProps = {
  testTypes: TestTypeOData[];
  categories: TestCategoryOData[];
  instructions: TestInstructionOData[];
  difficultyLevels: TestDifficultyLevelOData[];
  formRef?: React.RefObject<HTMLFormElement | null>;
  infoTitle?: string;
  infoDetail?: string;
  registerValidator?: (fn: () => boolean) => void;
};

// using shared ImportantInstructions component

export default function Step1CreateTestDetails({
  testTypes,
  categories,
  instructions,
  difficultyLevels,
  formRef,
  infoTitle,
  infoDetail,
  registerValidator,
}: Step1CreateTestDetailsProps) {
  // Helpers to read variant keys case-insensitively
  const pickNumberCI = (obj: any, keys: string[]) => {
    if (!obj || typeof obj !== 'object') return undefined as number | undefined;
    const map = new Map<string, any>();
    for (const k of Object.keys(obj)) map.set(k.toLowerCase(), (obj as any)[k]);
    for (const key of keys) {
      const v = map.get(key.toLowerCase());
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
    return undefined;
  };
  const MIN_KEYS = [
    'SectionMinTimeDuration','sectionMinTimeDuration','sectionmintimeduration',
    'SectionMinTime','sectionMinTime','minTime','minimumTime','MinimumTime','sectionMinimumTime'
  ];
  const MAX_KEYS = [
    'SectionMaxTimeDuration','sectionMaxTimeDuration','sectionmaxtimeduration',
    'SectionMaxTime','sectionMaxTime','maxTime','maximumTime','MaximumTime','sectionMaximumTime'
  ];
  const localFormRef = useRef<HTMLFormElement | null>(null);
  const refToUse = formRef ?? localFormRef;
  const optionBoxRef = useRef<HTMLDivElement | null>(null);
  const [templateGridHeight, setTemplateGridHeight] = useState<string | undefined>(undefined);

  const [name, setName] = useState("");
  const [typeId, setTypeId] = useState<string>("");
  const [code, setCode] = useState<string>("");
  // TestCategoryId removed from Test model. Keep a local field only for display; actual assignment is handled in Step 5 via testAssignedTestCategories.
  const [categoryId, setCategoryId] = useState<string>("");
  // New multi-select categories replacing TestCategoryId
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem('admin:newTest:selectedCategoryIds');
        if (raw) {
          const ids = JSON.parse(raw);
          if (Array.isArray(ids) && ids.length > 0) {
            return Array.from(new Set(ids.map((n: any) => Number(n)).filter((n: any) => Number.isFinite(n))));
          }
        }
      } catch { /* ignore */ }
    }
    return [] as number[];
  });
  const categoriesBtnRef = useRef<HTMLButtonElement | null>(null);
  const categoriesRef = useRef<HTMLDivElement | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categoriesPlaceUp, setCategoriesPlaceUp] = useState(false);
  // Tree state
  type CatNode = { id: number; name: string; children?: CatNode[] };
  const [categoryTree, setCategoryTree] = useState<CatNode[] | null>(null);
  const [treeError, setTreeError] = useState<string | null>(null);

  // Category Tree component with cascading selection and indeterminate states
  function CategoryTree({ nodes, selected, onChange }: { nodes: CatNode[]; selected: number[]; onChange: (ids: number[]) => void }) {
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});

    const toggleExpand = (id: number) => setExpanded((m) => ({ ...m, [id]: !m[id] }));

    const collectIds = (n: CatNode): number[] => {
      const base = [n.id];
      if (Array.isArray(n.children)) n.children.forEach((c) => base.push(...collectIds(c)));
      return base;
    };

    const setCheckedCascading = (n: CatNode, checked: boolean) => {
      const ids = collectIds(n);
      if (checked) {
        const next = Array.from(new Set([...selected, ...ids]));
        onChange(next);
      } else {
        const next = selected.filter((id) => !ids.includes(id));
        onChange(next);
      }
    };

    const renderNode = (n: CatNode, level = 0) => {
      const ids = collectIds(n);
      const selCount = ids.filter((id) => selected.includes(id)).length;
      const allChecked = selCount === ids.length && ids.length > 0;
      const someChecked = selCount > 0 && selCount < ids.length;
      const hasChildren = Array.isArray(n.children) && n.children.length > 0;
      const isOpen = !!expanded[n.id];

      return (
        <div key={n.id} className="px-2 py-1">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 12}px` }}>
            {hasChildren && (
              <button type="button" className="shrink-0 text-gray-600 hover:text-gray-800" onClick={() => toggleExpand(n.id)} aria-label={isOpen ? "Collapse" : "Expand"}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  {isOpen ? (
                    <path fillRule="evenodd" d="M5.23 12.79a.75.75 0 001.06-.02L10 9.06l3.71 3.71a.75.75 0 001.06-1.06l-4.24-4.24a.75.75 0 00-1.06 0L5.21 11.71a.75.75 0 00.02 1.08z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M7.21 5.23a.75.75 0 01.02 1.06L3.56 10l3.67 3.71a.75.75 0 11-1.08 1.04l-4.24-4.24a.75.75 0 010-1.06l4.24-4.24a.75.75 0 011.06.02z" clipRule="evenodd" />
                  )}
                </svg>
              </button>
            )}
            {!hasChildren && <span className="w-3.5 h-3.5 inline-block" />}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={allChecked}
                ref={(el) => {
                  if (el) el.indeterminate = someChecked;
                }}
                onChange={(e) => setCheckedCascading(n, e.target.checked)}
              />
              <span className="truncate text-gray-800">{n.name}</span>
            </label>
          </div>
          {hasChildren && isOpen && (
            <div>
              {n.children!.map((c) => renderNode(c, level + 1))}
            </div>
          )}
        </div>
      );
    };

    return <div>{nodes.map((n) => renderNode(n, 0))}</div>;
  }
  const [primaryInstructionId, setPrimaryInstructionId] = useState<string>("");
  const [secondaryInstructionId, setSecondaryInstructionId] = useState<string>("");
  const [duration, setDuration] = useState<number | "">("");
  const [durationHandicapped, setDurationHandicapped] = useState<number | "">(
    ""
  );
  const [totalQuestions, setTotalQuestions] = useState<number | "">("");
  const [totalMarks, setTotalMarks] = useState<number | "">("");
  const [difficultyLevelId, setDifficultyLevelId] = useState<string>("");
  const [templateKey, setTemplateKey] = useState<string>("");
  const [templates, setTemplates] = useState<TestTemplateOData[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [hasAttachments, setHasAttachments] = useState(false);
  // Sections are no longer part of Step 1 per latest requirement
  const { draft, setDraft } = useTestDraft();
  const [errors, setErrors] = useState<Record<string, string>>({});
  // No section display function
  // Track which sections are currently referenced by any test question (for safe removal in edit mode)
  // No section references in draft anymore
  // Keep latest validator without re-registering on every state change
  const validateRef = useRef<() => boolean>(() => true);
  // Strict Mode guard to avoid duplicate template fetch in dev double-mount
  const fetchedTemplatesOnce = useRef(false);
  const normalizedOnce = useRef(false);
  // No section state utilities

  const genGuid = () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });

  // Initialize default values and fetch templates (no draft updates here)
  useEffect(() => {
    if (!code) {
      // In edit mode, prefer draft.TestCode if present
      if (draft?.TestCode) {
  const c = String(draft.TestCode);
  setCode(c);
  // Ensure it's in draft as well - use setTimeout to avoid setState during render
  setTimeout(() => {
    setDraft((d: any) => ({ ...d, TestCode: c }));
  }, 0);
      } else {
  const g = genGuid();
  setCode(g);
  // Persist generated code to draft so it's sent on save - use setTimeout to avoid setState during render
  setTimeout(() => {
    setDraft((d: any) => ({ ...d, TestCode: g }));
  }, 0);
      }
    }
    (async () => {
      if (fetchedTemplatesOnce.current) return;
      fetchedTemplatesOnce.current = true;
  const res = await apiHandler(endpoints.getTestTemplatesOData, null as any);
      if (!res.error && res.data) {
        const list = ((res.data as any).value ?? []) as TestTemplateOData[];
        setTemplates(list);
        // If draft already has a template, prefer that; otherwise select 'Default' or first
        const draftTemplateId = (draft && draft.TestTemplateId) ? Number(draft.TestTemplateId) : undefined;
        if (list.length) {
          if (draftTemplateId && list.some(t => Number(t.TestTemplateId) === draftTemplateId)) {
            setTemplateKey(String(draftTemplateId));
          } else {
            const def = list.find((t) => t.TestTemplateName?.toLowerCase() === "default");
            const selected = def ?? list[0];
            setTemplateKey(String(selected.TestTemplateId));
          }
        }
      }
      // Sections no longer fetched

      // Fetch category tree (best-effort). If not available, we'll fall back to flat categories prop.
      try {
        const tres = await apiHandler(endpoints.getTestCategoryTree as any, null as any);
        if (!tres.error && Array.isArray(tres.data)) {
          // Normalize to CatNode[]; API may return nested arrays or objects; try to detect common shapes
          const normalize = (n: any): CatNode => ({
            id: Number(n?.TestCategoryId ?? n?.testCategoryId ?? n?.Id ?? n?.id),
            name: String(n?.TestCategoryName ?? n?.testCategoryName ?? n?.Name ?? n?.name ?? ""),
            children: Array.isArray(n?.Children ?? n?.children)
              ? (n.Children ?? n.children).map((c: any) => normalize(c))
              : undefined,
          });
          const list = (tres.data as any[]).map(normalize).filter((x) => Number.isFinite(x.id));
          setCategoryTree(list);
        } else {
          setCategoryTree(null);
        }
      } catch (e: any) {
        setTreeError(String(e?.message || ""));
        setCategoryTree(null);
      }
    })();
  }, []);

  // Keep draft.TestCode in sync if local code state changes for any reason
  useEffect(() => {
    if (code && String(draft?.TestCode ?? "") !== String(code)) {
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        setDraft((d: any) => ({ ...d, TestCode: code }));
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);
  

  // No section normalization

  // Hydrate from shared draft on first load (legacy bridging kept for safety)
  useEffect(() => {
    // Only set if draft has values and local state is empty
    if (draft) {
    }
    
    if (draft.TestName && !name) setName(draft.TestName);
    if (draft.TestTypeId && !typeId) setTypeId(String(draft.TestTypeId));
    if (draft.TestCode && !code) setCode(draft.TestCode);
  // draft.TestCategoryId is deprecated; do not hydrate
    // Hydrate new categories multi-select from draft if present
    try {
      const assignedCats: any[] = Array.isArray((draft as any)?.testAssignedTestCategories)
        ? (draft as any).testAssignedTestCategories
        : Array.isArray((draft as any)?.TestAssignedTestCategories)
        ? (draft as any).TestAssignedTestCategories
        : [];
      if (Array.isArray(assignedCats) && assignedCats.length > 0 && selectedCategoryIds.length === 0) {
        const cids = Array.from(new Set(assignedCats.map((a: any) => Number(a?.TestCategoryId)).filter((n: any) => Number.isFinite(n))));
        if (cids.length > 0) setSelectedCategoryIds(cids);
      } else if (selectedCategoryIds.length === 0) {
        // Fallback to session storage snapshot if available
        try {
          const raw = sessionStorage.getItem('admin:newTest:selectedCategoryIds');
          if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
              const cids = Array.from(new Set(arr.map((n: any) => Number(n)).filter((n: any) => Number.isFinite(n))));
              if (cids.length > 0) setSelectedCategoryIds(cids);
            }
          }
        } catch {/* ignore */}
      }
    } catch {/* ignore */}
    const assigned = Array.isArray(draft?.TestAssignedInstructions) ? draft.TestAssignedInstructions[0] : null;
    if (assigned?.TestPrimaryInstructionId && !primaryInstructionId) setPrimaryInstructionId(String(assigned.TestPrimaryInstructionId));
    if (assigned?.TestSecondaryInstructionId && !secondaryInstructionId) setSecondaryInstructionId(String(assigned.TestSecondaryInstructionId));
    if (draft.TestDurationMinutes && duration === "") setDuration(Number(draft.TestDurationMinutes));
    if (draft.TestDurationForHandicappedMinutes && durationHandicapped === "") setDurationHandicapped(Number(draft.TestDurationForHandicappedMinutes));
    if (draft.TotalQuestions && totalQuestions === "") setTotalQuestions(Number(draft.TotalQuestions));
    if (draft.TotalMarks && totalMarks === "") setTotalMarks(Number(draft.TotalMarks));
    if (draft.TestDifficultyLevelId && !difficultyLevelId) setDifficultyLevelId(String(draft.TestDifficultyLevelId));
    if (draft.TestTemplateId && !templateKey) setTemplateKey(String(draft.TestTemplateId));
    if (typeof draft.AllowAttachments === 'boolean') setHasAttachments(draft.AllowAttachments);
    
    // No assigned sections hydration
  }, [draft]);

  // Extra: Immediately hydrate categories from session on first mount if local state is empty
  useEffect(() => {
    if (selectedCategoryIds.length > 0) return;
    try {
      const raw = sessionStorage.getItem('admin:newTest:selectedCategoryIds');
      if (!raw) return;
      const ids = JSON.parse(raw);
      if (!Array.isArray(ids) || ids.length === 0) return;
      const uniq = Array.from(new Set(ids.map((n: any) => Number(n)).filter((n: any) => Number.isFinite(n))));
      if (uniq.length > 0) setSelectedCategoryIds(uniq);
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync local assignedSections edits back to draft safely (avoid setDraft during render of provider)
  // No section sync

  // Inline validation similar to Steps 4 & 5
  const validate = () => {
    const errs: Record<string, string> = {};
  if (!name.trim()) errs.name = "Test Name is required";
  if (!typeId) errs.typeId = "Test Type is required";
  // Category selection moved to Step 5 (testAssignedTestCategories)
  if (!difficultyLevelId) errs.difficultyLevelId = "Difficulty Level is required";
  if (!primaryInstructionId) errs.primaryInstructionId = "Primary Instruction is required";
  // Duration/Questions/Marks are computed in Step 3; no validation here
    setErrors(errs);
    const ok = Object.keys(errs).length === 0;
    try {
      if (ok) {
        sessionStorage.setItem('admin:newTest:step1valid','1');
      } else {
        sessionStorage.removeItem('admin:newTest:step1valid');
      }
    } catch {/* ignore */}
    return ok;
  };

  // Update the validator ref whenever inputs change
  useEffect(() => {
    validateRef.current = () => validate();
  }, [name, typeId, categoryId, difficultyLevelId, primaryInstructionId, duration, totalQuestions, totalMarks]);

  // Register the validator once; it will call the latest validate via ref
  useEffect(() => {
    if (registerValidator) {
      registerValidator(() => validateRef.current());
    }
  }, [registerValidator]);

  // Persist categories multi-select into draft without clobbering preloaded edit data
  useEffect(() => {
    setDraft((prev: any) => {
      const prevCats: any[] = Array.isArray(prev?.testAssignedTestCategories) ? prev.testAssignedTestCategories : [];
      const hasPrev = prevCats.length > 0;
      const hasSel = selectedCategoryIds.length > 0;
      // If nothing selected yet and we already have categories in draft (edit mode), don't overwrite
      if (!hasSel && hasPrev) return prev;
      const next: any = { ...(prev || {}) };
      next.testAssignedTestCategories = selectedCategoryIds.map((id) => ({ TestCategoryId: id }));
      delete next.TestCategoryId; // legacy
      return next;
    });
    // Also keep a simple snapshot for save fallback
    try { sessionStorage.setItem('admin:newTest:selectedCategoryIds', JSON.stringify(selectedCategoryIds)); } catch {/* ignore */}
  }, [selectedCategoryIds]);

  // Close categories dropdown on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (categoriesOpen && categoriesRef.current && !categoriesRef.current.contains(t)) setCategoriesOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [categoriesOpen]);

  useEffect(() => {
    function updateHeight() {
      if (optionBoxRef.current) {
        const rect = optionBoxRef.current.getBoundingClientRect();
        const parentRect = optionBoxRef.current.parentElement?.getBoundingClientRect();
        if (parentRect) {
          setTemplateGridHeight(rect.bottom - parentRect.top + "px");
        }
      }
    }
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return (
    <div className="w-full max-w-[1400px] mx-auto">
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Form (2 columns on large) */}
  <div className="lg:col-span-7 space-y-4 font-sans text-gray-900 min-h-0" id="step1-form-col">
          <form
            ref={refToUse}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Test Name <span className="text-red-600">*</span>
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={name}
                onChange={(e) => { const v = e.target.value; setName(v); setErrors((e)=>({ ...e, name: "" })); setDraft((d: any) => ({ ...d, TestName: v })); }}
                placeholder="Enter test name"
                aria-invalid={!!errors.name}
              />
              {errors.name && <div className="mt-1 text-xs text-red-600 font-bold">{errors.name}</div>}
            </div>
            <div className="md:col-span-2 grid grid-cols-1 gap-4">
              {/* Test Type and Test Code row (no regenerate) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Test Type <span className="text-red-600">*</span>
                  </label>
                  <select
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm font-normal focus:ring-2 transition-colors bg-white ${errors.typeId ? "border-red-400 focus:ring-red-500 focus:border-red-500" : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"}`}
                    value={typeId}
                    onChange={(e) => { const v = e.target.value; setTypeId(v); setErrors((e)=>({ ...e, typeId: "" })); setDraft((d: any) => ({ ...d, TestTypeId: v ? Number(v) : null })); }}
                    aria-invalid={!!errors.typeId}
                  >
                    <option value="">Select type</option>
                    {testTypes?.map((t) => (
                      <option key={t.TestTypeId} value={String(t.TestTypeId)}>
                        {t.TestType1}
                      </option>
                    ))}
                  </select>
                  {errors.typeId && <div className="mt-1 text-xs text-red-600 font-bold">{errors.typeId}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Test Code <span className="text-red-600">*</span>
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={code}
                    readOnly
                    placeholder="Auto-generated code"
                    aria-invalid={false}
                  />
                </div>
              </div>
            </div>
            <div ref={categoriesRef} className="relative">
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Categories
              </label>
              <button
                type="button"
                ref={categoriesBtnRef}
                className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2.5 text-left text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between"
                onClick={() => {
                  const rect = categoriesBtnRef.current?.getBoundingClientRect();
                  const spaceBelow = rect ? window.innerHeight - rect.bottom : 0;
                  setCategoriesPlaceUp(spaceBelow < 320);
                  setCategoriesOpen((v) => !v);
                }}
              >
                <span className="truncate">
                  {selectedCategoryIds.length === 0 ? (
                    <span className="text-gray-500">Select categories</span>
                  ) : (
                    `${selectedCategoryIds.length} selected`
                  )}
                </span>
                <svg className="w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
              </button>
              {categoriesOpen && (
                <div className={`absolute left-0 right-0 ${categoriesPlaceUp ? "bottom-full mb-1" : "mt-1"} z-40 bg-white border border-gray-200 rounded-md shadow-lg max-h-72 overflow-y-auto`}>
                  <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
                    <span className="text-xs text-gray-600">Categories</span>
                    <button
                      type="button"
                      className="text-xs text-blue-600 hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedCategoryIds([]);
                      }}
                    >
                      Clear
                    </button>
                  </div>
                  {/* Tree if available; otherwise fallback to flat list */}
                  {Array.isArray(categoryTree) && categoryTree.length > 0 ? (
                    <div className="py-1">
                      <CategoryTree
                        nodes={categoryTree}
                        selected={selectedCategoryIds}
                        onChange={setSelectedCategoryIds}
                      />
                    </div>
                  ) : categories?.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">No categories found.</div>
                  ) : (
                    <ul className="py-1">
                      {categories.map((c) => (
                        <li key={c.TestCategoryId} className="px-3 py-1 hover:bg-gray-50">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300"
                              checked={selectedCategoryIds.includes(c.TestCategoryId)}
                              onChange={(e) => {
                                setSelectedCategoryIds((prev) =>
                                  e.target.checked
                                    ? Array.from(new Set([...prev, c.TestCategoryId]))
                                    : prev.filter((id) => id !== c.TestCategoryId)
                                );
                              }}
                            />
                            <span className="truncate">{c.TestCategoryName}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Difficulty Level <span className="text-red-600">*</span>
              </label>
              <select
                className={`w-full border rounded-lg px-3 py-2.5 text-sm font-normal focus:ring-2 transition-colors bg-white ${errors.difficultyLevelId ? "border-red-400 focus:ring-red-500 focus:border-red-500" : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"}`}
                value={difficultyLevelId}
                onChange={(e) => { const v = e.target.value; setDifficultyLevelId(v); setErrors((e)=>({ ...e, difficultyLevelId: "" })); setDraft((d: any) => ({ ...d, TestDifficultyLevelId: v ? Number(v) : null })); }}
                aria-invalid={!!errors.difficultyLevelId}
              >
                <option value="">Select difficulty</option>
                {difficultyLevels?.map((d) => (
                  <option
                    key={d.TestDifficultyLevelId}
                    value={String(d.TestDifficultyLevelId)}
                  >
                    {d.TestDifficultyLevel1}
                  </option>
                ))}
              </select>
              {errors.difficultyLevelId && <div className="mt-1 text-xs text-red-600 font-bold">{errors.difficultyLevelId}</div>}
            </div>
            {/* Instructions Row - next row with Primary and Secondary */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Primary Instruction <span className="text-red-600">*</span>
                </label>
                <select
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm font-normal focus:ring-2 transition-colors bg-white ${errors.primaryInstructionId ? "border-red-400 focus:ring-red-500 focus:border-red-500" : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"}`}
                  value={primaryInstructionId}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPrimaryInstructionId(v);
                    setErrors((e)=>({ ...e, primaryInstructionId: "" }));
                    setDraft((d: any) => {
                      const arr = Array.isArray(d.TestAssignedInstructions) ? d.TestAssignedInstructions.slice() : [{}];
                      arr[0] = {
                        ...(arr[0] || {}),
                        TestPrimaryInstructionId: v ? Number(v) : null,
                      };
                      return { ...d, TestAssignedInstructions: arr };
                    });
                  }}
                  aria-invalid={!!errors.primaryInstructionId}
                >
                  <option value="">Select instruction</option>
                  {instructions?.map((i) => (
                    <option key={i.TestInstructionId} value={String(i.TestInstructionId)}>
                      {i.TestInstructionName}
                    </option>
                  ))}
                </select>
                {errors.primaryInstructionId && <div className="mt-1 text-xs text-red-600 font-bold">{errors.primaryInstructionId}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Secondary Instruction
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-normal focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                  value={secondaryInstructionId}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSecondaryInstructionId(v);
                    setDraft((d: any) => {
                      const arr = Array.isArray(d.TestAssignedInstructions) ? d.TestAssignedInstructions.slice() : [{}];
                      arr[0] = {
                        ...(arr[0] || {}),
                        TestSecondaryInstructionId: v ? Number(v) : null,
                      };
                      return { ...d, TestAssignedInstructions: arr };
                    });
                  }}
                >
                  <option value="">Select instruction</option>
                  {instructions?.map((i) => (
                    <option key={i.TestInstructionId} value={String(i.TestInstructionId)}>
                      {i.TestInstructionName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Duration and Marks moved to Step 3 summary (computed) */}
            {/* Sections UI removed per requirement */}
            {/* Options: Attachments (full width column) */}
            <div className="md:col-span-2" ref={optionBoxRef}>
              <div className="border rounded-md p-3 bg-white flex items-center justify-between">
                <div className="max-w-[70%]">
                  <div className="text-sm font-medium text-gray-800">Attachments</div>
                  <div className="text-xs text-gray-500">Allow file uploads</div>
                </div>
                <YesNoToggle
                  className="shrink-0"
                  size="sm"
                  segmentWidthClass="w-12 h-6 text-xs flex items-center"
                  value={hasAttachments}
                  onChange={(v) => { setHasAttachments(v); setDraft((d: any) => ({ ...d, AllowAttachments: v })); }}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Right: Template + Important Instructions side-by-side */}
  <div className="lg:col-span-5 flex flex-col min-h-0 overflow-hidden" style={{ height: '100%' }}>
          <div className="mb-2 text-sm font-semibold text-gray-800">Test Template</div>
          <div className="flex-1 min-h-0 flex flex-row gap-4 h-full">
            <div className="flex-1 min-w-0 flex flex-col" style={{ height: '100%' }}>
              <div className="overflow-y-auto pb-2" style={templateGridHeight ? { height: templateGridHeight, maxHeight: templateGridHeight } : {}}>
                <div className="grid grid-cols-2 gap-2">
                  {templates.map((t) => (
                    <div key={t.TestTemplateId} className={`border rounded-lg overflow-hidden shadow-sm transition-all duration-150 w-full bg-white flex flex-col items-center ${templateKey === String(t.TestTemplateId) ? "ring-2 ring-blue-500 border-blue-400" : "border-gray-200 hover:border-blue-300"}`}>
                      <div className="w-full flex flex-col items-center">
                        <div className="w-full flex items-center justify-center gap-1 mb-2 mt-1 rounded bg-blue-50/60 px-1 py-0.5 shadow-sm">
                          <input
                            type="checkbox"
                            checked={templateKey === String(t.TestTemplateId)}
                            onChange={() => {
                setTemplateKey(String(t.TestTemplateId));
                setDraft((d: any) => ({ ...d, TestTemplateId: Number(t.TestTemplateId) }));
                            }}
                            className="accent-blue-600 w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 transition"
                          />
                          <span className="text-[11px] font-normal text-blue-900 tracking-wide select-none">{t.TestTemplateName}</span>
                        </div>
                        <div
                          className="aspect-[4/3] bg-white flex items-center justify-center w-full cursor-pointer"
                          onClick={() => {
                            setTemplateKey(String(t.TestTemplateId));
                            setDraft((d: any) => ({ ...d, TestTemplateId: Number(t.TestTemplateId) }));
                            if (t.TestHtmlpreview) {
                              setPreviewUrl(t.TestHtmlpreview);
                              setPreviewOpen(true);
                            }
                          }}
                        >
                          <img
                            src={t.TestTemplateThumbNail}
                            alt={t.TestTemplateName}
                            className="w-full h-full object-contain p-1 opacity-95"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
              <div className="bg-white shadow-sm p-4 h-full flex flex-col justify-between">
                <ImportantInstructions />
              </div>
            </div>
          </div>
          <Modal
              title="Template Preview"
              isOpen={previewOpen}
              closeModal={() => setPreviewOpen(false)}
              className="max-w-none w-[90vw] h-[88vh] p-0 space-y-0 flex flex-col"
            >
              {previewUrl ? (
                <div className="flex-1 min-h-0">
                  <iframe src={previewUrl} className="w-full h-full border-0" />
                </div>
              ) : (
                <div className="text-sm text-gray-500 p-4">No preview available.</div>
              )}
          </Modal>
        </div>
      </div>
    </div>
  );
}
