"use client";

import { useEffect, useRef, useState } from "react";
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
import { useRouter, useSearchParams } from "next/navigation";
import {
  ClipboardList,
  SlidersHorizontal,
  FilePlus2,
  Rocket,
  Users,
  Award,
} from "lucide-react";
import { TestDraftProvider } from "@/contexts/TestDraftContext";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";

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
  const [queryHydrated, setQueryHydrated] = useState(false);
  const step1FormRef = useRef<HTMLFormElement | null>(null);
  const router = useRouter();
  const search = useSearchParams();
  // Stable primitives derived from search params
  const stepParamString = search?.get("step") ?? null;
  const searchString = search?.toString() ?? "";

  const [draftInitial, setDraftInitial] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const res = await apiHandler(endpoints.getNewTestModel, null as any);
      setDraftInitial(res?.data ?? {});
    })();
  }, []);

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

  // Initialize current step from query param (?step=1-based), then mark hydrated
  useEffect(() => {
    if (stepParamString) {
      const idx = Math.max(
        0,
        Math.min(stepsLength - 1, Number(stepParamString) - 1 || 0)
      );
      if (!Number.isNaN(idx) && idx !== current) setCurrent(idx);
    }
    setQueryHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepParamString, stepsLength]);

  // Reflect current step into the URL (after render), avoiding updates during render
  useEffect(() => {
    if (!queryHydrated) return;
    const desiredStepString = String(current + 1);
    if (stepParamString !== desiredStepString) {
      const params = new URLSearchParams(searchString);
      params.set("step", desiredStepString);
      router.replace(`?${params.toString()}`);
    }
    // Depend on stable primitives only to avoid re-running unnecessarily
  }, [current, stepParamString, searchString, router, queryHydrated]);

  const handleBack = () => {
  const next = Math.max(0, current - 1);
  setCurrent(next);
  const params = new URLSearchParams(searchString);
  params.set("step", String(next + 1));
  router.replace(`?${params.toString()}`);
  };
  const handleNext = () => {
    if (current === 0) {
      if (step1FormRef.current && !step1FormRef.current.reportValidity())
        return;
    }
  const next = Math.min(stepsLength - 1, current + 1);
  setCurrent(next);
  const params = new URLSearchParams(searchString);
  params.set("step", String(next + 1));
  router.replace(`?${params.toString()}`);
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
  const params = new URLSearchParams(searchString);
  params.set("step", String(idx + 1));
  router.replace(`?${params.toString()}`);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow border border-gray-200 font-sans text-gray-900">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create Test</h1>
        <Link
          href="/admin/tests"
          className="text-base font-semibold text-blue-600 hover:text-blue-700 underline transition-colors rounded-lg px-4 py-2"
        >
          Back to Tests
        </Link>
      </div>
      <TestDraftProvider initial={draftInitial ?? {}}>
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

  <div className="sticky bottom-0 z-20 flex items-center justify-between p-6 border-t bg-white">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg border border-gray-300 text-base font-semibold bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
              onClick={handleBack}
              disabled={current === 0}
            >
              Back
            </button>
          </div>
          <div className="flex items-center gap-4">
            {current < stepsLength - 1 ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white text-base font-semibold shadow hover:bg-blue-700 transition-colors disabled:opacity-50"
                onClick={handleNext}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-green-600 text-white text-base font-semibold shadow hover:bg-green-700 transition-colors disabled:opacity-50"
                onClick={handleSave}
              >
                Save Test
              </button>
            )}
          </div>
        </div>
        </StepWizard>
      </TestDraftProvider>
    </div>
  );
}
