"use client";

import { useRef, useState, useEffect } from "react";
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
}: Step1CreateTestDetailsProps) {
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
  const { draft, setDraft } = useTestDraft();

  const genGuid = () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });

  // Initialize default values and fetch templates
  useEffect(() => {
    setCode((prev) => {
      if (prev) return prev;
      const g = genGuid();
      // Persist to draft when auto-generating for the first time
      setDraft((d: any) => ({ ...d, TestCode: g }));
      return g;
    });
    (async () => {
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
            // Also set on draft if absent
            if (!draftTemplateId) {
              setDraft((d: any) => ({ ...d, TestTemplateId: Number(selected.TestTemplateId) }));
            }
          }
        }
      }
    })();
  }, []);

  // Hydrate from shared draft on first load
  useEffect(() => {
    // Only set if draft has values and local state is empty
    if (draft) {
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
    }
  }, [draft]);

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
                onChange={(e) => { const v = e.target.value; setName(v); setDraft((d: any) => ({ ...d, TestName: v })); }}
                placeholder="Enter test name"
                required
              />
            </div>
            <div className="md:col-span-2 grid grid-cols-1 gap-4">
              {/* Test Type and Test Code row (no regenerate) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Test Type <span className="text-red-600">*</span>
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-normal focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                    value={typeId}
                    onChange={(e) => { const v = e.target.value; setTypeId(v); setDraft((d: any) => ({ ...d, TestTypeId: v ? Number(v) : null })); }}
                    required
                  >
                    <option value="">Select type</option>
                    {testTypes?.map((t) => (
                      <option key={t.TestTypeId} value={String(t.TestTypeId)}>
                        {t.TestType1}
                      </option>
                    ))}
                  </select>
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
                    required
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Category <span className="text-red-600">*</span>
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-normal focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                value={categoryId}
                onChange={(e) => { const v = e.target.value; setCategoryId(v); setDraft((d: any) => ({ ...d, TestCategoryId: v ? Number(v) : null })); }}
                required
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Difficulty Level <span className="text-red-600">*</span>
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-normal focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                value={difficultyLevelId}
                onChange={(e) => { const v = e.target.value; setDifficultyLevelId(v); setDraft((d: any) => ({ ...d, TestDifficultyLevelId: v ? Number(v) : null })); }}
                required
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
            </div>
            {/* Instructions Row - next row with Primary and Secondary */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Primary Instruction <span className="text-red-600">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-normal focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                  value={primaryInstructionId}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPrimaryInstructionId(v);
                    setDraft((d: any) => {
                      const arr = Array.isArray(d.TestAssignedInstructions) ? d.TestAssignedInstructions.slice() : [{}];
                      arr[0] = {
                        ...(arr[0] || {}),
                        TestPrimaryInstructionId: v ? Number(v) : null,
                      };
                      return { ...d, TestAssignedInstructions: arr };
                    });
                  }}
                  required
                >
                  <option value="">Select instruction</option>
                  {instructions?.map((i) => (
                    <option key={i.TestInstructionId} value={String(i.TestInstructionId)}>
                      {i.TestInstructionName}
                    </option>
                  ))}
                </select>
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
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        value={duration}
                        onChange={(e) => { const v = e.target.value === "" ? "" : Number(e.target.value); setDuration(v as any); setDraft((d: any) => ({ ...d, TestDurationMinutes: v === "" ? null : Number(v) })); }}
                        placeholder="e.g., 60"
                        required
                      />
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
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        value={totalQuestions}
                        onChange={(e) => { const v = e.target.value === "" ? "" : Number(e.target.value); setTotalQuestions(v as any); setDraft((d: any) => ({ ...d, TotalQuestions: v === "" ? null : Number(v) })); }}
                        placeholder="e.g., 50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Total Marks <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="number"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        value={totalMarks}
                        onChange={(e) => { const v = e.target.value === "" ? "" : Number(e.target.value); setTotalMarks(v as any); setDraft((d: any) => ({ ...d, TotalMarks: v === "" ? null : Number(v) })); }}
                        placeholder="e.g., 100"
                        required
                      />
                    </div>
                  </div>
                </div>
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
