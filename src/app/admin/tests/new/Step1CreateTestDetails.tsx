"use client";

import { useEffect, useRef, useState } from "react";
import StepWizard from "@/components/StepWizard/StepWizard";
import StepSection from "@/components/StepWizard/StepSection";
import Link from "next/link";
import {
  FilePlus2,
  SlidersHorizontal,
  FileText,
  CheckCheck,
  Users,
  Award,
} from "lucide-react";
import type {
  TestCategoryOData,
  TestDifficultyLevelOData,
  TestInstructionOData,
  TestTypeOData,
} from "@/utils/api/types";

const steps = [
  {
    key: "details",
    title: "Test Details",
    description: "Create / Add test details",
    icon: <FilePlus2 className="w-4 h-4" />,
  },
  {
    key: "settings",
    title: "Test Settings",
    description: "Configure settings",
    icon: <SlidersHorizontal className="w-4 h-4" />,
  },
  {
    key: "questions",
    title: "Add Question",
    description: "Add or import questions",
    icon: <FileText className="w-4 h-4" />,
  },
  {
    key: "publish",
    title: "Publish",
    description: "Make test available",
    icon: <CheckCheck className="w-4 h-4" />,
  },
  {
    key: "assign",
    title: "Assign Test",
    description: "Assign to candidates/groups",
    icon: <Users className="w-4 h-4" />,
  },
  {
    key: "certs",
    title: "Create Certificates",
    description: "Certificate template",
    icon: <Award className="w-4 h-4" />,
  },
];

export type Step1CreateTestDetailsProps = {
  testTypes: TestTypeOData[];
  categories: TestCategoryOData[];
  instructions: TestInstructionOData[];
  difficultyLevels: TestDifficultyLevelOData[];
};

export default function Step1CreateTestDetails({
  testTypes,
  categories,
  instructions,
  difficultyLevels,
}: Step1CreateTestDetailsProps) {
  const [current, setCurrent] = useState(0);

  // Step 1 form state
  const [name, setName] = useState("");
  const [typeId, setTypeId] = useState<number | "">("");
  const [code, setCode] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [instructionId, setInstructionId] = useState<number | "">("");
  const [duration, setDuration] = useState<number | "">("");
  const [durationHandicapped, setDurationHandicapped] = useState<number | "">(
    ""
  );
  const [totalQuestions, setTotalQuestions] = useState<number | "">("");
  const [totalMarks, setTotalMarks] = useState<number | "">("");
  const [difficultyLevelId, setDifficultyLevelId] = useState<number | "">("");
  const [templateKey, setTemplateKey] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement | null>(null);

  // Helpers
  const genGuid = () =>
    typeof crypto !== "undefined" && (crypto as any).randomUUID
      ? (crypto as any).randomUUID()
      : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0,
            v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });

  useEffect(() => {
    setCode(genGuid());
  }, []);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Create Test</h1>
        <Link
          href="/admin/tests"
          className="text-sm text-blue-600 hover:underline"
        >
          Back to Tests
        </Link>
      </div>
      <StepWizard steps={steps} current={current} onStepChange={setCurrent}>
        {current === 0 && (
          <StepSection>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left: two-column form area */}
              <form
                ref={formRef}
                className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2"
              >
                {/* 1. Test Name - two columns - required */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="Enter test name"
                  />
                </div>

                {/* 2. Test Type - two columns - required (OData) */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Type <span className="text-red-600">*</span>
                  </label>
                  <select
                    required
                    value={typeId as any}
                    onChange={(e) =>
                      setTypeId(e.target.value ? Number(e.target.value) : "")
                    }
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="">Select a type</option>
                    {testTypes.map((t) => (
                      <option key={t.TestTypeId} value={t.TestTypeId}>
                        {t.TestType1}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Test Code - two columns - required read-only - GUID */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Code <span className="text-red-600">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      required
                      readOnly
                      value={code}
                      className="w-full border rounded-md px-3 py-2 bg-gray-50"
                    />
                    <button
                      type="button"
                      className="px-3 py-2 border rounded-md text-sm"
                      onClick={() => setCode(genGuid())}
                    >
                      Regenerate
                    </button>
                  </div>
                </div>

                {/* 4. Test Category - one column - required (OData) */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Category <span className="text-red-600">*</span>
                  </label>
                  <select
                    required
                    value={categoryId as any}
                    onChange={(e) =>
                      setCategoryId(
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="">Select a category</option>
                    {categories.map((c) => (
                      <option key={c.TestCategoryId} value={c.TestCategoryId}>
                        {c.TestCategoryName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4b. Test Instructions - one column - required (OData) */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Instructions <span className="text-red-600">*</span>
                  </label>
                  <select
                    required
                    value={instructionId as any}
                    onChange={(e) =>
                      setInstructionId(
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="">Select instructions</option>
                    {instructions.map((i) => (
                      <option
                        key={i.TestInstructionId}
                        value={i.TestInstructionId}
                      >
                        {i.TestInstructionName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Duration (Mins) - required / For Handicapped - optional */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (Mins) <span className="text-red-600">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={duration as any}
                    onChange={(e) =>
                      setDuration(e.target.value ? Number(e.target.value) : "")
                    }
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="e.g., 60"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    For Handicapped (Mins)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={durationHandicapped as any}
                    onChange={(e) =>
                      setDurationHandicapped(
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="Optional"
                  />
                </div>

                {/* 6. Total Questions - required / Total Marks - required */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Questions <span className="text-red-600">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={totalQuestions as any}
                    onChange={(e) =>
                      setTotalQuestions(
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="e.g., 50"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Marks <span className="text-red-600">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={totalMarks as any}
                    onChange={(e) =>
                      setTotalMarks(
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="e.g., 100"
                  />
                </div>

                {/* 7. Difficulty Level - two columns - OData */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty Level <span className="text-red-600">*</span>
                  </label>
                  <select
                    required
                    value={difficultyLevelId as any}
                    onChange={(e) =>
                      setDifficultyLevelId(
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="">Select a level</option>
                    {difficultyLevels.map((l) => (
                      <option
                        key={l.TestDifficultyLevelId}
                        value={l.TestDifficultyLevelId}
                      >
                        {l.TestDifficultyLevel1}
                      </option>
                    ))}
                  </select>
                </div>
              </form>

              {/* Right: Template selection with preview */}
              <div className="lg:col-span-1">
                <div className="mb-2 text-sm font-medium text-gray-700">
                  Test Template
                </div>
                <div className="max-h-[600px] overflow-y-auto pr-2">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "classic", name: "Classic", img: "/window.svg" },
                      { key: "modern", name: "Modern", img: "/globe.svg" },
                      { key: "compact", name: "Compact", img: "/file.svg" },
                      { key: "sleek", name: "Sleek", img: "/next.svg" },
                      { key: "minimal", name: "Minimal", img: "/vercel.svg" },
                      {
                        key: "vivid",
                        name: "Vivid",
                        img: "/under_construction.svg",
                      },
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
                        <div className="px-3 py-2 text-sm font-medium">
                          {t.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </StepSection>
        )}

        {current === 1 && (
          <StepSection>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="e.g., 60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Randomize Questions
                </label>
                <select className="w-full border rounded-md px-3 py-2">
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
            </div>
          </StepSection>
        )}

        {current === 2 && (
          <StepSection>
            <div className="space-y-2">
              <div className="text-sm text-gray-700">
                Add questions manually or import from the bank.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Level
                  </label>
                  <select className="w-full border rounded-md px-3 py-2">
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Questions
                  </label>
                  <input
                    type="number"
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="e.g., 50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template
                  </label>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="Select template"
                  />
                </div>
              </div>
            </div>
          </StepSection>
        )}

        {current === 3 && (
          <StepSection>
            <div className="space-y-3 text-sm text-gray-700">
              <div>Publish the test to make it available to assignees.</div>
              <button
                className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm shadow hover:bg-indigo-700"
                type="button"
              >
                Publish Now
              </button>
            </div>
          </StepSection>
        )}

        {current === 4 && (
          <StepSection>
            <div className="space-y-3 text-sm text-gray-700">
              <div>Assign this test to candidates or groups.</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign to Group
                  </label>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="Group name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Or Users
                  </label>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="Comma-separated usernames"
                  />
                </div>
              </div>
            </div>
          </StepSection>
        )}

        {current === 5 && (
          <StepSection>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                Create or select a certificate template to award upon
                completion.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Certificate Template
                  </label>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="Template name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issuer Name
                  </label>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="e.g., Evalus"
                  />
                </div>
              </div>
            </div>
          </StepSection>
        )}

        <div className="flex items-center justify-between p-3 border-t bg-gray-50">
          <button
            type="button"
            className="px-3 py-2 rounded-md border border-gray-300 text-sm"
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
          >
            Back
          </button>
          <div className="flex items-center gap-2">
            {current < steps.length - 1 ? (
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm shadow hover:bg-indigo-700"
                onClick={() => {
                  if (current === 0) {
                    if (formRef.current && !formRef.current.reportValidity())
                      return;
                    if (!templateKey) setTemplateKey("classic");
                  }
                  setCurrent((c) => Math.min(steps.length - 1, c + 1));
                }}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-green-600 text-white text-sm shadow hover:bg-green-700"
              >
                Save Test
              </button>
            )}
          </div>
        </div>
      </StepWizard>
    </div>
  );
}
