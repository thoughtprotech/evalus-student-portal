"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useExamMode } from "@/hooks/useExamMode";
import mockInstructions from "@/mock/mockInstructions.json";
import { startCandidateTestSessionAction } from "@/app/actions/exam/session/startCandidateTestSession";
import toast from "react-hot-toast";
import { getUserAction } from "@/app/actions/getUser";
import { fetchInstructionsByTestIdAction } from "@/app/actions/exam/instructions/fetchInstructionsByTestId";
import { GetInstructionsByTestIdResponse } from "@/utils/api/types";

import Loader from "@/components/Loader";
import {
  BookOpenText,
  Languages,
  ShieldCheck,
  CheckSquare,
  Info,
} from "lucide-react";
import { TextOrHtml } from "@/components/TextOrHtml";

export interface InstructionData {
  title: string;
  instructions: string[];
}

const instructionsMap: Record<string, InstructionData> = mockInstructions;

export default function ExamStartPage() {
  const { id } = useParams();
  const router = useRouter();

  useExamMode();

  const [instructionData, setInstructionData] = useState<
    GetInstructionsByTestIdResponse[] | undefined
  >();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchInstructionsByTestId = async () => {
    setLoading(true);
    const res = await fetchInstructionsByTestIdAction(Number(id));
    if (res.status === 200) {
      setInstructionData(res.data ?? []);
    } else {
      toast.error("Something went wrong while fetching instructions.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInstructionsByTestId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProceed = async () => {
    const userName = await getUserAction();
    const response = await startCandidateTestSessionAction(Number(id), userName);
    if (response.status === 200) {
      const testResponseId = response.data?.testResponseId;
      router.push(`/exam/${id}/${testResponseId}`);
    } else {
      toast.error("Unable to start test session. Please try again.");
    }
  };

  const instructionGroups = useMemo(() => {
    const arr = instructionData ?? [];
    return arr.map((g) => {
      const lines = (g.testInstruction1 || "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => l.replace(/^\d+\.\s*/, ""));
      return {
        id: g.testInstructionId,
        name: g.testInstructionName,
        lines,
        language: g.language,
      };
    });
  }, [instructionData]);

  if (loading) return <Loader />;

  return (
    <div className="w-full min-h-screen flex justify-center items-center px-3 sm:px-4 py-6">
      <div className="max-w-5xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-6 sm:px-8 py-5">
          <div className="text-center">
            <div className="mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
              <BookOpenText className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Instructions</h1>
            <p className="mt-1 text-sm text-gray-600">
              Read all instructions carefully before you start your exam.
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="px-5 sm:px-8">
          <div
            className={`py-4 pr-1 overflow-auto ${
              instructionGroups.length === 1 ? "max-h-[60vh]" : "max-h-[62vh]"
            }`}
          >
            {instructionGroups.length === 0 ? (
              <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-gray-600 text-sm">
                <Info className="h-4 w-4 text-gray-500" />
                No instructions available for this test.
              </div>
            ) : (
              <div
                className={`grid gap-4 ${
                  instructionGroups.length === 1
                    ? "grid-cols-1 max-w-md mx-auto"
                    : "grid-cols-1 md:grid-cols-2"
                }`}
              >
                {instructionGroups.map((group, gIdx) => (
                  <div
                    key={group.id}
                    className="rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold">
                          {gIdx + 1}
                        </span>
                        <span className="truncate text-sm font-semibold text-gray-900">
                          {group.name}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200">
                        <Languages className="h-3 w-3" />
                        {group.language}
                      </span>
                    </div>

                    <ol className="px-3 pb-3 pt-2 space-y-1.5">
                      {group.lines.map((line, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 rounded-md border border-gray-100 bg-gray-50 px-2.5 py-1.5 hover:bg-indigo-50/40 transition-colors"
                        >
                          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-gray-700 ring-1 ring-inset ring-gray-200 text-[11px] font-semibold">
                            {i + 1}
                          </span>
                          <div className="text-gray-800 text-[13px] leading-5">
                            <TextOrHtml content={line} />
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-white/90 backdrop-blur-sm border-t border-gray-200 px-5 sm:px-8">
          <div className="py-3">
            <div className="mb-3 flex items-start gap-2.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
              <input
                id="agree"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer mt-0.5"
              />
              <label htmlFor="agree" className="cursor-pointer">
                <div className="flex items-center gap-1.5 text-gray-900 font-medium text-sm">
                  <ShieldCheck className="h-4 w-4 text-indigo-600" />
                  I have read and agreed to the instructions.
                </div>
                <p className="mt-0.5 text-xs text-gray-600">
                  Ensure system readiness and test integrity before proceeding.
                </p>
              </label>
            </div>

            <button
              onClick={handleProceed}
              disabled={!agreed}
              className={`w-full py-2.5 rounded-md font-semibold transition-all ${
                agreed
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Proceed to Test
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
