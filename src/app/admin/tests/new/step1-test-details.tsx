"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { normalizeAssignedSections, assignedSectionsDiffer } from "@/utils/normalizeAssignedSections";
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
  const [categoryId, setCategoryId] = useState<string>("");
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
  // Sections selection
  type SectionLite = { TestSectionId: number; TestSectionName: string };
  const [allSections, setAllSections] = useState<SectionLite[]>([]);
  // Canonical section ids are always the catalog TestSectionId values, stored in TestAssignedSectionId
  const [selectedSectionIds, setSelectedSectionIds] = useState<number[]>([]);
  const [assignedSections, setAssignedSections] = useState<any[]>([]);
  const { draft, setDraft } = useTestDraft();
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Track which sections are currently referenced by any test question (for safe removal in edit mode)
  const usedSectionIds = useMemo(() => {
    const set = new Set<number>();
    const qs: any[] = Array.isArray((draft as any)?.testQuestions) ? (draft as any).testQuestions : [];
    for (const q of qs) {
      const sid = Number(q?.TestSectionId ?? q?.testAssignedSectionId ?? q?.TestAssignedSectionId);
      if (Number.isFinite(sid)) set.add(sid);
    }
    return set;
  }, [draft?.testQuestions]);
  // Keep latest validator without re-registering on every state change
  const validateRef = useRef<() => boolean>(() => true);
  // Strict Mode guard to avoid duplicate template fetch in dev double-mount
  const fetchedTemplatesOnce = useRef(false);
  const normalizedOnce = useRef(false);
  const promotedAssignedSectionsOnce = useRef(false); // retained for backward compatibility of logic
  const hydratedAssignedSections = useRef(false); // track if we've completed initial hydration
  const attemptedDeepPromote = useRef(false); // retained; normalization supersedes but keep guard
  // Utility: ensure only one row per TestSectionId
  const dedupAssigned = (list: any[]) => {
    if (!Array.isArray(list)) return [] as any[];
    const map = new Map<number, any>();
    for (const rec of list) {
      const r: any = { ...rec };
  // Canonical id = TestAssignedSectionId (legacy may use various casings)
  const id = Number(r?.TestAssignedSectionId ?? r?.testAssignedSectionId ?? r?.Testassignedsectionid ?? r?.TestSectionId);
      if (!Number.isFinite(id)) continue;
  r.TestAssignedSectionId = id;
      if (!map.has(id)) {
        map.set(id, r);
      }
    }
    const arr = Array.from(map.values());
    arr.sort((a: any, b: any) => (a.SectionOrder || 0) - (b.SectionOrder || 0));
    arr.forEach((r: any, i: number) => { r.SectionOrder = i + 1; });
    return arr;
  };
  // Compare assigned sections shallowly (order/id/min/max) using canonical TestAssignedSectionId
  const sectionsDiffer = (a: any[], b: any[]) => {
    if (a.length !== b.length) return true;
    for (let i = 0; i < a.length; i++) {
      const ra = a[i]; const rb = b[i];
      if (Number(ra?.TestAssignedSectionId ?? ra?.testAssignedSectionId) !== Number(rb?.TestAssignedSectionId ?? rb?.testAssignedSectionId)) return true;
      if (Number(ra?.SectionOrder) !== Number(rb?.SectionOrder)) return true;
      if ((ra?.SectionMinTimeDuration ?? null) !== (rb?.SectionMinTimeDuration ?? null)) return true;
      if ((ra?.SectionMaxTimeDuration ?? null) !== (rb?.SectionMaxTimeDuration ?? null)) return true;
    }
    return false;
  };

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
      // fetch sections
      try {
        const secRes = await apiHandler(endpoints.getTestSectionsOData, null as any);
        const secs = Array.isArray(secRes?.data?.value) ? secRes.data.value as SectionLite[] : [];
        setAllSections(secs);
      } catch {}
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
  

  // Early normalization (one-shot) for legacy / variant assigned sections payloads
  useEffect(() => {
    if (!draft || normalizedOnce.current) return;
    const normalized = normalizeAssignedSections(draft);
    if (normalized.length) {
      const existing = Array.isArray((draft as any).TestAssignedSections) ? (draft as any).TestAssignedSections : [];
      if (assignedSectionsDiffer(existing, normalized)) {
        normalizedOnce.current = true;
        // Use setTimeout to avoid setState during render
        setTimeout(() => {
          setDraft((d: any) => ({ ...d, TestAssignedSections: normalized }));
        }, 0);
        return; // wait for next render; hydration effect will pick up
      }
    }
    normalizedOnce.current = true;
  }, [draft]);

  // Hydrate from shared draft on first load (legacy bridging kept for safety)
  useEffect(() => {
    // Only set if draft has values and local state is empty
    if (draft) {
      // Bridge: some edit payloads may use lowerCamelCase testAssignedSections
      if (!promotedAssignedSectionsOnce.current) {
        if (!Array.isArray((draft as any).TestAssignedSections) && Array.isArray((draft as any).testAssignedSections)) {
          promotedAssignedSectionsOnce.current = true;
          if (process.env.NODE_ENV !== 'production') {
            try { console.log('[Step1] Bridging testAssignedSections to TestAssignedSections:', (draft as any).testAssignedSections); } catch {}
          }
          const dedup = dedupAssigned((draft as any).testAssignedSections);
          // Use setTimeout to avoid setState during render
          setTimeout(() => {
            setDraft((d: any) => ({ ...d, TestAssignedSections: dedup }));
          }, 0);
          return; // wait for next render
        }
        promotedAssignedSectionsOnce.current = true;
      }
      // Deep search fallback: sometimes sections may arrive nested (e.g., model.testAssignedSections or data.testAssignedSections)
      if (!attemptedDeepPromote.current && !Array.isArray((draft as any).TestAssignedSections)) {
        attemptedDeepPromote.current = true;
        const visited = new Set<any>();
        const maxDepth = 4;
        const findArray = (obj: any, depth: number): any[] | null => {
          if (!obj || typeof obj !== 'object' || depth > maxDepth || visited.has(obj)) return null;
            visited.add(obj);
          for (const key of Object.keys(obj)) {
            const val = (obj as any)[key];
            if (Array.isArray(val) && val.length && val.every(v => v && typeof v === 'object' && (('TestAssignedSectionId' in v) || ('testAssignedSectionId' in v) || ('TestSectionId' in v)))) {
              return val as any[];
            }
          }
          for (const key of Object.keys(obj)) {
            const val = (obj as any)[key];
            const found = findArray(val, depth + 1);
            if (found) return found;
          }
          return null;
        };
        const candidate = findArray(draft, 0);
        if (candidate) {
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.log('[Step1] Promoting discovered nested assigned sections array to TestAssignedSections');
          }
          const dedup = dedupAssigned(candidate);
          // Use setTimeout to avoid setState during render
          setTimeout(() => {
            setDraft((d: any) => ({ ...d, TestAssignedSections: dedup }));
          }, 0);
          return; // re-run hydration with unified property
        }
      }
    }
    
    if (draft.TestName && !name) setName(draft.TestName);
    if (draft.TestTypeId && !typeId) setTypeId(String(draft.TestTypeId));
    if (draft.TestCode && !code) setCode(draft.TestCode);
    if (draft.TestCategoryId && !categoryId) setCategoryId(String(draft.TestCategoryId));
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
    
    // hydrate assigned sections from draft (check for changes, not just empty state)
    const unifiedAssigned = Array.isArray(draft.TestAssignedSections) ? dedupAssigned(draft.TestAssignedSections) : [];
    if (unifiedAssigned.length > 0) {
      // Always check if draft sections differ from current local state
      if (assignedSections.length === 0 || sectionsDiffer(assignedSections, unifiedAssigned)) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[Step1] Re-hydrating assigned sections from draft:', unifiedAssigned.length, 'sections');
          console.log('[Step1] Current local state:', assignedSections.length, 'sections');
        }
        
        // If dedup removed any entries, persist back once
        if (unifiedAssigned.length !== (draft.TestAssignedSections as any[])?.length) {
          // Use setTimeout to avoid setState during render
          setTimeout(() => {
            setDraft((d: any) => ({ ...d, TestAssignedSections: unifiedAssigned }));
          }, 0);
        }
        setAssignedSections(unifiedAssigned.map((s: any) => {
          const r = { ...s };
          // Ensure canonical id is set
          if (!Number.isFinite(Number(r.TestAssignedSectionId))) {
            const fallbackId = Number(r.testAssignedSectionId ?? r.TestSectionId);
            if (Number.isFinite(fallbackId)) r.TestAssignedSectionId = fallbackId;
          }
          // Promote camelCase variants to canonical PascalCase if present (for UI compatibility)
          if (r.sectionMinTimeDuration != null && r.SectionMinTimeDuration == null) r.SectionMinTimeDuration = r.sectionMinTimeDuration;
          if (r.sectionMaxTimeDuration != null && r.SectionMaxTimeDuration == null) r.SectionMaxTimeDuration = r.sectionMaxTimeDuration;
          if (r.sectionMinTime != null && r.SectionMinTimeDuration == null) r.SectionMinTimeDuration = r.sectionMinTime;
          if (r.sectionMaxTime != null && r.SectionMaxTimeDuration == null) r.SectionMaxTimeDuration = r.sectionMaxTime;
          
          return r;
        }));
        const ids = unifiedAssigned
          .map((s: any) => Number(s?.TestAssignedSectionId ?? s?.testAssignedSectionId ?? s?.Testassignedsectionid ?? s?.TestSectionId))
          .filter((n: any) => Number.isFinite(n));
        setSelectedSectionIds(Array.from(new Set(ids)));
      }
    }
  }, [draft]);

  // Sync local assignedSections edits back to draft safely (avoid setDraft during render of provider)
  useEffect(() => {
    if (!draft) return;
    const existing: any[] = Array.isArray((draft as any).TestAssignedSections) ? (draft as any).TestAssignedSections : [];
    if (sectionsDiffer(existing, assignedSections)) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Step1] Syncing assignedSections to draft:', JSON.stringify(assignedSections, null, 2));
        console.log('[Step1] Existing draft sections:', JSON.stringify(existing, null, 2));
      }
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        setDraft((d: any) => ({ ...d, TestAssignedSections: assignedSections.map(r => ({ ...r })) }));
      }, 0);
    }
  }, [assignedSections, draft]);

  // Inline validation similar to Steps 4 & 5
  const validate = () => {
    const errs: Record<string, string> = {};
  if (!name.trim()) errs.name = "Test Name is required";
  if (!typeId) errs.typeId = "Test Type is required";
  if (!categoryId) errs.categoryId = "Category is required";
  if (!difficultyLevelId) errs.difficultyLevelId = "Difficulty Level is required";
  if (!primaryInstructionId) errs.primaryInstructionId = "Primary Instruction is required";
  if (duration === "" || Number(duration) <= 0) errs.duration = "Duration (mins) must be a positive number";
  if (totalQuestions === "" || Number(totalQuestions) <= 0) errs.totalQuestions = "Total Questions must be a positive number";
  if (totalMarks === "" || Number(totalMarks) <= 0) errs.totalMarks = "Total Marks must be a positive number";
    setErrors(errs);
    return Object.keys(errs).length === 0;
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
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Category <span className="text-red-600">*</span>
              </label>
              <select
                className={`w-full border rounded-lg px-3 py-2.5 text-sm font-normal focus:ring-2 transition-colors bg-white ${errors.categoryId ? "border-red-400 focus:ring-red-500 focus:border-red-500" : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"}`}
                value={categoryId}
                onChange={(e) => { const v = e.target.value; setCategoryId(v); setErrors((e)=>({ ...e, categoryId: "" })); setDraft((d: any) => ({ ...d, TestCategoryId: v ? Number(v) : null })); }}
                aria-invalid={!!errors.categoryId}
              >
                <option value="">Select category</option>
                {categories?.map((c) => (
                  <option
                    key={c.TestCategoryId}
                    value={String(c.TestCategoryId)}
                  >
                    {c.TestCategoryName}
                  </option>
                ))}
              </select>
              {errors.categoryId && <div className="mt-1 text-xs text-red-600 font-bold">{errors.categoryId}</div>}
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
            <div className="md:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Duration Section */}
                <div className="border rounded-lg p-4 bg-white flex flex-col gap-2">
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Duration (mins)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Normal <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="number"
                        className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-white focus:ring-2 transition ${errors.duration ? "border-red-400 focus:ring-red-500 focus:border-red-500" : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"}`}
                        value={duration}
                        onChange={(e) => { const v = e.target.value === "" ? "" : Number(e.target.value); setDuration(v as any); setErrors((e)=>({ ...e, duration: "" })); setDraft((d: any) => ({ ...d, TestDurationMinutes: v === "" ? null : Number(v) })); }}
                        placeholder="e.g., 60"
                        aria-invalid={!!errors.duration}
                      />
                      {errors.duration && <div className="mt-1 text-xs text-red-600 font-bold">{errors.duration}</div>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Handicapped
                      </label>
                      <input
                        type="number"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        value={durationHandicapped}
                        onChange={(e) => { const v = e.target.value === "" ? "" : Number(e.target.value); setDurationHandicapped(v as any); setDraft((d: any) => ({ ...d, TestDurationForHandicappedMinutes: v === "" ? null : Number(v) })); }}
                        placeholder="e.g., 75"
                      />
                    </div>
                  </div>
                </div>
                {/* Marks Section */}
                <div className="border rounded-lg p-4 bg-white flex flex-col gap-2">
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Marks
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Total Questions <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="number"
                        className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-white focus:ring-2 transition ${errors.totalQuestions ? "border-red-400 focus:ring-red-500 focus:border-red-500" : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"}`}
                        value={totalQuestions}
                        onChange={(e) => { const v = e.target.value === "" ? "" : Number(e.target.value); setTotalQuestions(v as any); setErrors((e)=>({ ...e, totalQuestions: "" })); setDraft((d: any) => ({ ...d, TotalQuestions: v === "" ? null : Number(v) })); }}
                        placeholder="e.g., 50"
                        aria-invalid={!!errors.totalQuestions}
                      />
                      {errors.totalQuestions && <div className="mt-1 text-xs text-red-600 font-bold">{errors.totalQuestions}</div>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Total Marks <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="number"
                        className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-white focus:ring-2 transition ${errors.totalMarks ? "border-red-400 focus:ring-red-500 focus:border-red-500" : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"}`}
                        value={totalMarks}
                        onChange={(e) => { const v = e.target.value === "" ? "" : Number(e.target.value); setTotalMarks(v as any); setErrors((e)=>({ ...e, totalMarks: "" })); setDraft((d: any) => ({ ...d, TotalMarks: v === "" ? null : Number(v) })); }}
                        placeholder="e.g., 100"
                        aria-invalid={!!errors.totalMarks}
                      />
                      {errors.totalMarks && <div className="mt-1 text-xs text-red-600 font-bold">{errors.totalMarks}</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Combined: Test Sections selection + details table */}
            <div className="md:col-span-2">
              <div className="border rounded-lg p-4 bg-white flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-gray-800">Test Sections & Details</label>
                    {draft?.TestId && (
                      <span className="text-[10px] text-gray-500">(You can remove a section only if no questions are assigned to it)</span>
                    )}
                  </div>
                  {/* Chips */}
                  <div className="flex flex-wrap gap-2 min-h-[2rem]">
                    {selectedSectionIds.length === 0 && (
                      <span className="text-xs text-gray-500">No sections selected.</span>
                    )}
                    {selectedSectionIds.map(id => {
                      const sec = allSections.find(s => s.TestSectionId === id);
                      const canRemove = !draft?.TestId || !usedSectionIds.has(id);
                      return (
                        <span key={id} className={`inline-flex items-center gap-1 border rounded-full px-2 py-0.5 text-xs ${canRemove ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-500 border-gray-300'}`}> 
                          {sec?.TestSectionName || id}
                          {canRemove && (
                            <button
                              type="button"
                              className="text-blue-500 hover:text-blue-700 focus:outline-none"
                              onClick={() => {
                                setSelectedSectionIds(prev => prev.filter(x => x !== id));
                                setAssignedSections(prev => {
                                  const next = prev.filter(r => Number(r.TestAssignedSectionId) !== id).map((r,i) => ({ ...r, SectionOrder: i+1 }));
                                  setDraft(d => ({ ...d, TestAssignedSections: next }));
                                  return next;
                                });
                              }}
                              title="Remove section"
                            >
                              ×
                            </button>
                          )}
                          {!canRemove && <span title="Section has questions and cannot be removed" className="ml-0.5 cursor-not-allowed select-none">🔒</span>}
                        </span>
                      );
                    })}
                  </div>
                  {/* Add dropdown */}
                  <div className="flex items-center gap-2">
                    <select
                      className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value=""
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : 0;
                        if (!val) return;
                        setSelectedSectionIds(prev => {
                          if (prev.includes(val)) return prev; // guard
                          const nextIds = [...prev, val];
                          setAssignedSections(prevRows => {
                const exists = prevRows.find(r => Number(r.TestAssignedSectionId) === val);
                            const next = exists ? [...prevRows] : [...prevRows, {
                  TestAssignedSectionId: val,
                  TestId: draft?.TestId || 0,
                              SectionOrder: nextIds.length,
                              SectionTotalQuestions: null,
                              SectionTotalMarks: null,
                              SectionMinTimeDuration: null,
                              SectionMaxTimeDuration: null,
                            }];
                            next.sort((a,b)=> (a.SectionOrder||0)-(b.SectionOrder||0));
                            next.forEach((r,i)=> { r.SectionOrder = i+1; });
                            setDraft(d => ({ ...d, TestAssignedSections: next }));
                            return next;
                          });
                          return nextIds;
                        });
                        e.target.value = ""; // reset
                      }}
                    >
                      <option value="">Add section...</option>
                      {allSections.filter(s => !selectedSectionIds.includes(s.TestSectionId)).map(s => (
                        <option key={s.TestSectionId} value={s.TestSectionId}>{s.TestSectionName}</option>
                      ))}
                    </select>
                    <div className="text-[11px] text-gray-500">Select one at a time to add.</div>
                  </div>
                </div>
                {/* Details Table */}
                {selectedSectionIds.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div className="text-sm font-semibold text-gray-800">Assigned Section Details</div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50 text-gray-700">
                            <th className="px-2 py-1 text-left">Section</th>
                            <th className="px-2 py-1 text-left">Order</th>
                            <th className="px-2 py-1 text-left">Min Time</th>
                            <th className="px-2 py-1 text-left">Max Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignedSections.map((row, idx) => {
                            const section = allSections.find(s => Number(s.TestSectionId) === Number(row.TestAssignedSectionId));
                            const canRemove = !draft?.TestId || !usedSectionIds.has(Number(row.TestAssignedSectionId));
                            return (
                              <tr key={row.TestAssignedSectionId ?? idx} className={idx % 2 ? 'bg-white' : 'bg-gray-50/60'}>
                                <td className="px-2 py-1 whitespace-nowrap text-gray-800 text-[11px] flex items-center gap-2">
                                  <span>{section?.TestSectionName || row.TestAssignedSectionId}</span>
                                  {canRemove && (
                                    <button
                                      type="button"
                                      className="text-red-500 hover:text-red-700 text-[10px] font-bold"
                                      title="Remove"
                                      onClick={() => {
                                        setAssignedSections(prev => {
                                          const next = prev.filter(r => Number(r.TestAssignedSectionId) !== Number(row.TestAssignedSectionId)).map((r,i)=> ({ ...r, SectionOrder: i+1 }));
                                          setSelectedSectionIds(next.map(r=> Number(r.TestAssignedSectionId)));
                                          return next;
                                        });
                                      }}
                                    >✕</button>
                                  )}
                                  {!canRemove && <span title="Section has questions and cannot be removed" className="cursor-not-allowed select-none text-[10px]">🔒</span>}
                                </td>
                                <td className="px-2 py-1">
                                  <select
                                    className="border rounded px-1 py-0.5 text-[11px]"
                                    value={row.SectionOrder ?? idx + 1}
                                    onChange={(e) => {
                                      const targetOrder = Number(e.target.value);
                                      setAssignedSections(prev => {
                                        const list = prev.map(r => ({ ...r }));
                                        const currentIndex = idx;
                                        const item = list[currentIndex];
                                        list.splice(currentIndex, 1);
                                        const insertIndex = Math.min(Math.max(targetOrder - 1, 0), list.length);
                                        list.splice(insertIndex, 0, item);
                                        list.forEach((r,i)=> { r.SectionOrder = i+1; });
                                        return list;
                                      });
                                    }}
                                  >
                                    {assignedSections.map((_,i2)=><option key={i2} value={i2+1}>{i2+1}</option>)}
                                  </select>
                                </td>
                                <td className="px-2 py-1">
                                  <input 
                                    type="number" 
                                    className="border rounded px-1 py-0.5 w-20 text-[11px]" 
                                    value={row.SectionMinTimeDuration ?? row.sectionMinTimeDuration ?? ''} 
                                    onChange={(e)=>{
                                      const val = e.target.value;
                                      const v = val === '' ? null : Number(val);
                                      setAssignedSections(prev=>{ 
                                        const copy=prev.map(r=>({...r})); 
                                        copy[idx].SectionMinTimeDuration=v; 
                                        copy[idx].sectionMinTimeDuration=v; 
                                        return copy; 
                                      });
                                    }} 
                                    placeholder="Min time"
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <input 
                                    type="number" 
                                    className="border rounded px-1 py-0.5 w-20 text-[11px]" 
                                    value={row.SectionMaxTimeDuration ?? row.sectionMaxTimeDuration ?? ''} 
                                    onChange={(e)=>{
                                      const val = e.target.value;
                                      const v = val === '' ? null : Number(val);
                                      setAssignedSections(prev=>{ 
                                        const copy=prev.map(r=>({...r})); 
                                        copy[idx].SectionMaxTimeDuration=v; 
                                        copy[idx].sectionMaxTimeDuration=v; 
                                        return copy; 
                                      });
                                    }}
                                    placeholder="Max time"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
