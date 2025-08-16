"use client";

import { useRef, useState } from "react";
import type {
  TestCategoryOData,
  TestDifficultyLevelOData,
  TestInstructionOData,
  TestTypeOData,
} from "@/utils/api/types";
import StepWizard from "@/components/StepWizard/StepWizard";
import StepSection from "@/components/StepWizard/StepSection";
import Step1CreateTestDetails from "./step1-test-details";
import Step2TestSettings from "./step2-test-settings";
import Step3AddQuestions from "./step3-add-questions";
import Step4Publish from "./step4-publish";
import ImportantInstructions from "@/components/ImportantInstructions";
import Link from "next/link";
import {
  ClipboardList,
  SlidersHorizontal,
  FilePlus2,
  Rocket,
  Users,
  Award,
} from "lucide-react";

type Props = {
  testTypes: TestTypeOData[];
  categories: TestCategoryOData[];
  instructions: TestInstructionOData[];
  difficultyLevels: TestDifficultyLevelOData[];
};

export default function TestSteps({
  testTypes,
  categories,
  instructions,
  difficultyLevels,
}: Props) {
  const [current, setCurrent] = useState(0);
  const step1FormRef = useRef<HTMLFormElement | null>(null);

  const steps = [
    {
      key: "details",
      title: "Test Details",
      description: "Create / Add test details",
  icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      key: "settings",
      title: "Test Settings",
      description: "Configure settings",
      icon: <SlidersHorizontal className="w-4 h-4" />,
    },
    {
      key: "questions",
  title: "Add Questions",
      description: "Add or import questions",
  icon: <FilePlus2 className="w-4 h-4" />,
    },
    {
      key: "publish",
      title: "Publish",
      description: "Make test available",
  icon: <Rocket className="w-4 h-4" />,
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

  const stepsLength = steps.length;

  const handleBack = () => setCurrent((c) => Math.max(0, c - 1));
  const handleNext = () => {
    if (current === 0) {
      if (step1FormRef.current && !step1FormRef.current.reportValidity())
        return;
    }
    setCurrent((c) => Math.min(stepsLength - 1, c + 1));
  };
  const handleSave = () => {
    // TODO: final save wiring
  };

  const handleStepChange = (idx: number) => {
    // Allow moving back freely
    if (idx <= current) {
      setCurrent(idx);
      return;
    }
    // Moving forward: enforce validation for Step 1
    if (current === 0) {
      if (step1FormRef.current && !step1FormRef.current.reportValidity())
        return;
    }
    setCurrent(idx);
  };

  return (
    <div className="p-2 sm:p-3">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold">Create Test</h1>
        <Link
          href="/admin/tests"
          className="text-sm text-indigo-600 hover:text-indigo-700 underline"
        >
          Back to Tests
        </Link>
      </div>
      <StepWizard
        steps={steps}
        current={current}
        onStepChange={handleStepChange}
      >
        {current === 0 && (
          <StepSection>
            <Step1CreateTestDetails
              testTypes={testTypes}
              categories={categories}
              instructions={instructions}
              difficultyLevels={difficultyLevels}
              formRef={step1FormRef}
              infoTitle="Before you start"
              infoDetail="Fill out the test details including name, type, category, and defaults. You can adjust settings later."
            />
          </StepSection>
        )}

        {current === 1 && (
          <StepSection>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Step2TestSettings />
              </div>
              <ImportantInstructions
                title="Settings Guide"
                detail="Configure timing, randomization, and display options for your test. These settings affect the candidate experience."
              />
            </div>
          </StepSection>
        )}

        {current === 2 && (
          <StepSection>
            <Step3AddQuestions />
          </StepSection>
        )}

        {current === 3 && (
          <StepSection>
            <Step4Publish />
          </StepSection>
        )}

        {current > 3 && current < stepsLength && (
          <StepSection>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 p-4 text-sm text-gray-700">
                Step {current + 1} content goes here.
              </div>
              <ImportantInstructions
                title={`Step ${current + 1} Notes`}
                detail="Follow the guidance for this step. Provide the required data before moving forward."
              />
            </div>
          </StepSection>
        )}

        <div className="sticky bottom-0 z-20 flex items-center justify-between p-3 md:p-4 border-t bg-white/70 supports-[backdrop-filter]:bg-white/60 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="px-3 py-2 rounded-md border border-gray-300 text-sm bg-white hover:bg-gray-50"
              onClick={handleBack}
              disabled={current === 0}
            >
              Back
            </button>
          </div>
          <div className="flex items-center gap-2">
            {current < stepsLength - 1 ? (
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700"
                onClick={handleNext}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium shadow hover:bg-green-700"
                onClick={handleSave}
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
