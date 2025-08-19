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
  const [instructionId, setInstructionId] = useState<string>("");
  const [duration, setDuration] = useState<number | "">("");
  const [handicappedDuration, setHandicappedDuration] = useState<number | "">(
    ""
  );
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
  const [isPool, setIsPool] = useState(false);
  const [isTypingTest, setIsTypingTest] = useState(false);
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
    setCode((prev) => prev || genGuid());
    (async () => {
      const res = await apiHandler(endpoints.getTestTemplatesOData, null as any);
      if (!res.error && res.data) {
        const list = ((res.data as any).value ?? []) as TestTemplateOData[];
        setTemplates(list);
        // Set 'Default' template as selected by default if exists; else first
        if (list.length) {
          const def = list.find(
            (t) => t.TestTemplateName?.toLowerCase() === "default"
          );
          setTemplateKey(String((def ?? list[0]).TestTemplateId));
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
      if (draft.TestInstructionId && !instructionId) setInstructionId(String(draft.TestInstructionId));
      if (draft.Duration && duration === "") setDuration(Number(draft.Duration));
      if (draft.HandicappedDuration && durationHandicapped === "") setDurationHandicapped(Number(draft.HandicappedDuration));
      if (draft.TotalQuestions && totalQuestions === "") setTotalQuestions(Number(draft.TotalQuestions));
      if (draft.TotalMarks && totalMarks === "") setTotalMarks(Number(draft.TotalMarks));
      if (draft.TestDifficultyLevelId && !difficultyLevelId) setDifficultyLevelId(String(draft.TestDifficultyLevelId));
      if (draft.TemplateKey && !templateKey) setTemplateKey(String(draft.TemplateKey));
      if (typeof draft.IsPool === 'boolean') setIsPool(draft.IsPool);
      if (typeof draft.IsTypingTest === 'boolean') setIsTypingTest(draft.IsTypingTest);
      if (typeof draft.HasAttachments === 'boolean') setHasAttachments(draft.HasAttachments);
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
    <div className="w-full">
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Form (2 columns on large) */}
  <div className="lg:col-span-7 space-y-4 font-sans text-gray-900 min-h-0" id="step1-form-col">
          <form
            ref={refToUse}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Test Name <span className="text-red-600">*</span>
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={name}
                onChange={(e) => { const v = e.target.value; setName(v); setDraft((d: any) => ({ ...d, TestName: v })); }}
                placeholder="Enter test name"
                required
              />
            </div>
            <div className="md:col-span-2 grid grid-cols-1 gap-4">
              {/* Test Type and Test Code row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Test Type <span className="text-red-600">*</span>
                  </label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Test Code <span className="text-red-600">*</span>
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={code}
                      readOnly
                      placeholder="Auto-generated code"
                      required
                    />
                    <button
                      type="button"
                      className="px-2 py-1 rounded-md border border-gray-300 text-sm font-medium bg-white hover:bg-gray-50 transition-colors shadow-sm h-[32px]"
                      style={{ minHeight: "32px" }}
                      onClick={() => { const g = genGuid(); setCode(g); setDraft((d: any) => ({ ...d, TestCode: g })); }}
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Category <span className="text-red-600">*</span>
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Instruction <span className="text-red-600">*</span>
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={instructionId}
                onChange={(e) => { const v = e.target.value; setInstructionId(v); setDraft((d: any) => ({ ...d, TestInstructionId: v ? Number(v) : null })); }}
                required
              >
                <option value="">Select instruction</option>
                {instructions?.map((i) => (
                  <option
                    key={i.TestInstructionId}
                    value={String(i.TestInstructionId)}
                  >
                    {i.TestInstructionName}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Duration Section */}
                <div className="border rounded-lg p-4 bg-white flex flex-col gap-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Duration (mins)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Normal <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="number"
                        className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        value={duration}
                        onChange={(e) => { const v = e.target.value === "" ? "" : Number(e.target.value); setDuration(v as any); setDraft((d: any) => ({ ...d, Duration: v === "" ? null : Number(v) })); }}
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
                        className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        value={durationHandicapped}
                        onChange={(e) => { const v = e.target.value === "" ? "" : Number(e.target.value); setDurationHandicapped(v as any); setDraft((d: any) => ({ ...d, HandicappedDuration: v === "" ? null : Number(v) })); }}
                        placeholder="e.g., 75"
                      />
                    </div>
                  </div>
                </div>
                {/* Marks Section */}
                <div className="border rounded-lg p-4 bg-white flex flex-col gap-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Marks
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Total Questions <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="number"
                        className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
                        className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Difficulty Level <span className="text-red-600">*</span>
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
            {/* Options: two columns on desktop; first two in row one, attachments in row two single column */}
            <div className="md:col-span-2" ref={optionBoxRef}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-md p-3 bg-white flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-3">
                    <div className="max-w-[70%]">
                      <div className="text-sm font-medium text-gray-800">
                        Pool
                      </div>
                      <div className="text-xs text-gray-500">
                        Enable question pool
                      </div>
                    </div>
                    <YesNoToggle
                      className="shrink-0"
                      size="sm"
                      segmentWidthClass="w-12 h-6 text-xs flex items-center"
                      value={isPool}
                      onChange={(v) => { setIsPool(v); setDraft((d: any) => ({ ...d, IsPool: v })); }}
                    />
                  </div>
                </div>
                <div className="border rounded-md p-3 bg-white flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-3">
                    <div className="max-w-[70%]">
                      <div className="text-sm font-medium text-gray-800">
                        Typing Test
                      </div>
                      <div className="text-xs text-gray-500">
                        Enable typing mode
                      </div>
                    </div>
                    <YesNoToggle
                      className="shrink-0"
                      size="sm"
                      segmentWidthClass="w-12 h-6 text-xs flex items-center"
                      value={isTypingTest}
                      onChange={(v) => { setIsTypingTest(v); setDraft((d: any) => ({ ...d, IsTypingTest: v })); }}
                    />
                  </div>
                </div>
                <div className="border rounded-md p-3 bg-white flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-3">
                    <div className="max-w-[70%]">
                      <div className="text-sm font-medium text-gray-800">
                        Attachments
                      </div>
                      <div className="text-xs text-gray-500">
                        Allow file uploads
                      </div>
                    </div>
                    <YesNoToggle
                      className="shrink-0"
                      size="sm"
                      segmentWidthClass="w-12 h-6 text-xs flex items-center"
                      value={hasAttachments}
                      onChange={(v) => { setHasAttachments(v); setDraft((d: any) => ({ ...d, HasAttachments: v })); }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Right: Template + Important Instructions side-by-side */}
  <div className="lg:col-span-5 flex flex-col min-h-0 overflow-hidden" style={{ height: '100%' }}>
          <div className="mb-2 text-sm font-semibold text-gray-800">
            Test Template
          </div>
          <div className="flex-1 min-h-0 flex flex-row gap-4 h-full">
            <div className="flex-1 min-w-0 flex flex-col" style={{ height: '100%' }}>
              <div
                className="overflow-y-auto pb-2"
                style={templateGridHeight ? { height: templateGridHeight, maxHeight: templateGridHeight } : {}}
              >
                  <div className="grid grid-cols-2 gap-2">
                    {(templates?.length
                      ? templates.map((t) => ({
                          key: String(t.TestTemplateId),
                          name: t.TestTemplateName,
                          img: t.TestTemplateThumbNail,
                          html: t.TestHtmlpreview,
                        }))
                      : [
                          { key: "classic", name: "Classic", img: "/window.svg" },
                          { key: "modern", name: "Modern", img: "/globe.svg" },
                          { key: "compact", name: "Compact", img: "/file.svg" },
                          { key: "sleek", name: "Sleek", img: "/next.svg" },
                          { key: "minimal", name: "Minimal", img: "/vercel.svg" },
                          { key: "vivid", name: "Vivid", img: "/under_construction.svg" },
                        ]
                    ).map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => {
                          setTemplateKey(t.key);
                          if ((t as any).html) {
                            setPreviewUrl((t as any).html);
                            setPreviewOpen(true);
                          }
                          setDraft((d: any) => ({ ...d, TemplateKey: t.key }));
                        }}
                        className={`text-left border rounded-lg overflow-hidden shadow-sm transition-all duration-150 w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          templateKey === t.key
                            ? "ring-2 ring-blue-500 border-blue-400"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                        aria-pressed={templateKey === t.key}
                      >
                        <div className="aspect-[4/3] bg-white flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={t.img}
                            alt={t.name}
                            className="w-full h-full object-contain p-1 opacity-95"
                          />
                        </div>
                        <div className="px-2 py-1 text-xs font-semibold text-center">{t.name}</div>
                      </button>
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
