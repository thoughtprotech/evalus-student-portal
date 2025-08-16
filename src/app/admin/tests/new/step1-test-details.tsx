"use client";

import { useRef, useState } from "react";
import ImportantInstructions from "@/components/ImportantInstructions";
import YesNoToggle from "@/components/ui/YesNoToggle";
import { useEffect } from "react";
import type {
  TestCategoryOData,
  TestDifficultyLevelOData,
  TestInstructionOData,
  TestTypeOData,
} from "@/utils/api/types";
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

  const [name, setName] = useState("");
  const [typeId, setTypeId] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [instructionId, setInstructionId] = useState<string>("");
  const [duration, setDuration] = useState<number | "">("");
  const [durationHandicapped, setDurationHandicapped] = useState<number | "">(
    ""
  );
  const [totalQuestions, setTotalQuestions] = useState<number | "">("");
  const [totalMarks, setTotalMarks] = useState<number | "">("");
  const [difficultyLevelId, setDifficultyLevelId] = useState<string>("");
  const [templateKey, setTemplateKey] = useState<string>("classic");
  const [isPool, setIsPool] = useState(false);
  const [isTypingTest, setIsTypingTest] = useState(false);
  const [hasAttachments, setHasAttachments] = useState(false);

  const genGuid = () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });

  // Initialize default values
  useEffect(() => {
    setCode((prev) => prev || genGuid());
  }, []);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left: Form (2 columns on large) */}
        <div className="lg:col-span-2 space-y-4">
          <form
            ref={refToUse}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Name <span className="text-red-600">*</span>
              </label>
              <input
                className="w-full border rounded-md px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter test name"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Type <span className="text-red-600">*</span>
              </label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={typeId}
                onChange={(e) => setTypeId(e.target.value)}
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Code <span className="text-red-600">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  className="w-full border rounded-md px-3 py-2"
                  value={code}
                  readOnly
                  placeholder="Auto-generated code"
                  required
                />
                <button
                  type="button"
                  className="px-3 py-2 rounded-md border text-sm"
                  onClick={() => setCode(genGuid())}
                >
                  Regenerate
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-600">*</span>
              </label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instruction <span className="text-red-600">*</span>
              </label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={instructionId}
                onChange={(e) => setInstructionId(e.target.value)}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (mins) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                className="w-full border rounded-md px-3 py-2"
                value={duration}
                onChange={(e) =>
                  setDuration(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="e.g., 60"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (Handicapped)
              </label>
              <input
                type="number"
                className="w-full border rounded-md px-3 py-2"
                value={durationHandicapped}
                onChange={(e) =>
                  setDurationHandicapped(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="e.g., 75"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Questions <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                className="w-full border rounded-md px-3 py-2"
                value={totalQuestions}
                onChange={(e) =>
                  setTotalQuestions(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="e.g., 50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Marks <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                className="w-full border rounded-md px-3 py-2"
                value={totalMarks}
                onChange={(e) =>
                  setTotalMarks(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="e.g., 100"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty Level <span className="text-red-600">*</span>
              </label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={difficultyLevelId}
                onChange={(e) => setDifficultyLevelId(e.target.value)}
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
            <div className="md:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-md p-3 bg-white">
                  <div className="flex items-center justify-between gap-3">
                    <div className="max-w-[70%]">
                      <div className="text-sm font-medium text-gray-800">
                        Pool
                      </div>
                      <div className="text-xs text-gray-500">
                        Enable question pool
                      </div>
                    </div>
                    <YesNoToggle className="shrink-0" size="sm" segmentWidthClass="w-20" value={isPool} onChange={setIsPool} />
                  </div>
                </div>
                <div className="border rounded-md p-3 bg-white">
                  <div className="flex items-center justify-between gap-3">
                    <div className="max-w-[70%]">
                      <div className="text-sm font-medium text-gray-800">
                        Typing Test
                      </div>
                      <div className="text-xs text-gray-500">
                        Enable typing mode
                      </div>
                    </div>
          <YesNoToggle className="shrink-0" size="sm" segmentWidthClass="w-20" value={isTypingTest} onChange={setIsTypingTest} />
                  </div>
                </div>
        <div className="border rounded-md p-3 bg-white">
                  <div className="flex items-center justify-between gap-3">
                    <div className="max-w-[70%]">
                      <div className="text-sm font-medium text-gray-800">
                        Attachments
                      </div>
                      <div className="text-xs text-gray-500">
                        Allow file uploads
                      </div>
                    </div>
          <YesNoToggle className="shrink-0" size="sm" segmentWidthClass="w-20" value={hasAttachments} onChange={setHasAttachments} />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Right: Template column */}
        <div className="lg:col-span-1 h-full flex flex-col">
          <div className="mb-2 text-sm font-medium text-gray-700">
            Test Template
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "classic", name: "Classic", img: "/window.svg" },
                { key: "modern", name: "Modern", img: "/globe.svg" },
                { key: "compact", name: "Compact", img: "/file.svg" },
                { key: "sleek", name: "Sleek", img: "/next.svg" },
                { key: "minimal", name: "Minimal", img: "/vercel.svg" },
                { key: "vivid", name: "Vivid", img: "/under_construction.svg" },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTemplateKey(t.key)}
                  className={`text-left border rounded-md overflow-hidden hover:shadow transition ${
                    templateKey === t.key
                      ? "ring-2 ring-indigo-500 border-indigo-400"
                      : "border-gray-200"
                  }`}
                  aria-pressed={templateKey === t.key}
                >
                  <div className="aspect-video bg-white flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.img}
                      alt={t.name}
                      className="w-20 h-20 opacity-80"
                    />
                  </div>
                  <div className="px-3 py-2 text-sm font-medium">{t.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Far Right: Important Instructions column */}
        <div className="lg:col-span-1 h-full flex flex-col">
          <ImportantInstructions title={infoTitle} detail={infoDetail} />
        </div>
      </div>
    </div>
  );
}
