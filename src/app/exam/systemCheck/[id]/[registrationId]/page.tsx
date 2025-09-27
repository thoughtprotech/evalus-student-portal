"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useExamMode } from "@/hooks/useExamMode";
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Rocket,
  Wifi,
  Cpu,
  ShieldCheck,
  Info,
  ChevronRight,
  AppWindow,
} from "lucide-react";

// Define the type for each check step
type StepStatus = "pending" | "in-progress" | "passed" | "failed" | "warning";

interface Step {
  id: number;
  name: string;
  status: StepStatus;
}

interface ExtendedNavigator extends Navigator {
  deviceMemory?: number;
}

export default function SystemCheckPage() {
  const { id, registrationId } = useParams();
  const router = useRouter();

  // Prevent auto-logout during exam
  useExamMode();

  // The check steps
  const [steps, setSteps] = useState<Step[]>([
    { id: 1, name: "Browser Compatibility", status: "pending" },
    { id: 2, name: "Internet Connectivity", status: "pending" },
    { id: 3, name: "Hardware Capability", status: "pending" },
  ]);

  const [checking, setChecking] = useState(false);
  const [checkComplete, setCheckComplete] = useState(false);
  const [allPassed, setAllPassed] = useState(false);

  // --- Actual Check Functions ---

  const checkBrowserCompatibility = (): boolean => {
    if (typeof fetch !== "function" || typeof Promise === "undefined")
      return false;
    if (typeof window.WebAssembly !== "object") return false;
    return true;
  };

  const checkInternetConnectivity = async (): Promise<boolean> => {
    if (!navigator.onLine) return false;
    try {
      await fetch("/favicon.ico", { method: "HEAD", cache: "no-store" });
      return true;
    } catch {
      return false;
    }
  };

  const checkHardwareCapability = (): StepStatus => {
    const nav = navigator as ExtendedNavigator;
    const ram = nav.deviceMemory;
    const cores = nav.hardwareConcurrency;

    const hasEnoughRAM = typeof ram === "number" ? ram > 2 : undefined;
    const hasMultiCore = typeof cores === "number" ? cores > 1 : false;
    const hasWebGL = (() => {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      return Boolean(gl);
    })();

    if (hasEnoughRAM === undefined) {
      return hasMultiCore && hasWebGL ? "warning" : "failed";
    }

    return hasEnoughRAM && hasMultiCore && hasWebGL ? "passed" : "failed";
  };

  const runSystemCheck = async () => {
    setChecking(true);
    setCheckComplete(false);
    setAllPassed(false);

    setSteps((prev) => prev.map((step) => ({ ...step, status: "pending" })));

    // Step 1: Browser Compatibility
    setSteps((prev) =>
      prev.map((step) =>
        step.id === 1 ? { ...step, status: "in-progress" } : step
      )
    );
    const browserOk = checkBrowserCompatibility();
    setSteps((prev) =>
      prev.map((step) =>
        step.id === 1
          ? { ...step, status: browserOk ? "passed" : "failed" }
          : step
      )
    );

    // Step 2: Internet Connectivity
    setSteps((prev) =>
      prev.map((step) =>
        step.id === 2 ? { ...step, status: "in-progress" } : step
      )
    );
    const connectivityOk = await checkInternetConnectivity();
    setSteps((prev) =>
      prev.map((step) =>
        step.id === 2
          ? { ...step, status: connectivityOk ? "passed" : "failed" }
          : step
      )
    );

    // Step 3: Hardware
    setSteps((prev) =>
      prev.map((step) =>
        step.id === 3 ? { ...step, status: "in-progress" } : step
      )
    );
    const hardwareStatus = checkHardwareCapability();
    setSteps((prev) =>
      prev.map((step) =>
        step.id === 3 ? { ...step, status: hardwareStatus } : step
      )
    );

    const allOk =
      browserOk &&
      connectivityOk &&
      (hardwareStatus === "passed" || hardwareStatus === "warning");

    setAllPassed(allOk);
    setChecking(false);
    setCheckComplete(true);
  };

  const handleProceed = () => {
    if (allPassed) {
      router.push(`/exam/instructions/${id}/${registrationId}`);
    }
  };

  // Helpers for UI
  const getStepIcon = (status: StepStatus) => {
    switch (status) {
      case "passed":
        return (
          <CheckCircle className="w-4.5 h-4.5 text-emerald-600" aria-hidden />
        );
      case "failed":
        return <XCircle className="w-4.5 h-4.5 text-rose-600" aria-hidden />;
      case "in-progress":
        return (
          <Loader2
            className="w-4.5 h-4.5 text-indigo-600 animate-spin"
            aria-hidden
          />
        );
      case "warning":
        return (
          <AlertCircle className="w-4.5 h-4.5 text-amber-600" aria-hidden />
        );
      default:
        return (
          <AlertCircle className="w-4.5 h-4.5 text-gray-400" aria-hidden />
        );
    }
  };

  const statusTone: Record<StepStatus, string> = {
    passed: "text-emerald-700 bg-emerald-50 ring-emerald-200",
    failed: "text-rose-700 bg-rose-50 ring-rose-200",
    "in-progress": "text-indigo-700 bg-indigo-50 ring-indigo-200",
    pending: "text-gray-700 bg-gray-50 ring-gray-200",
    warning: "text-amber-700 bg-amber-50 ring-amber-200",
  };

  const completedCount = steps.filter((s) => s.status === "passed").length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="w-full h-full flex justify-center items-center px-3 sm:px-4 py-6">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Sticky compact header (aligned with Instructions page style) */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-5 sm:px-8 py-4">
          <div className="text-center">
            <div className="mx-auto mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              System Check
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Run the checks before starting your test.
            </p>
          </div>

          {/* Slim progress bar under header */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Overall Compatibility</span>
              <span className="font-medium">{progressPct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${checking ? "bg-indigo-500" : "bg-emerald-500"
                  }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Scrollable content to match page density */}
        <div className="px-5 sm:px-8">
          <div className="max-h-[62vh] overflow-auto py-4 pr-1">
            <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5">
              <div className="space-y-3.5">
                {/* Step row template repeated for each step */}
                {/* Step 1 */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">{getStepIcon(steps[0].status)}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <AppWindow className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-900 font-semibold text-sm">
                          {steps[0].name}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] ring-1 ring-inset ${statusTone[steps[0].status]
                            }`}
                        >
                          {steps[0].status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[13px] text-gray-600">
                        Requires modern browser features like Fetch, Promises,
                        and WebAssembly.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                {/* Step 2 */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">{getStepIcon(steps[1].status)}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-900 font-semibold text-sm">
                          {steps[1].name}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] ring-1 ring-inset ${statusTone[steps[1].status]
                            }`}
                        >
                          {steps[1].status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[13px] text-gray-600">
                        Checks online status and makes a quick reachability
                        probe.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                {/* Step 3 */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">{getStepIcon(steps[2].status)}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-900 font-semibold text-sm">
                          {steps[2].name}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] ring-1 ring-inset ${statusTone[steps[2].status]
                            }`}
                        >
                          {steps[2].status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[13px] text-gray-600">
                        Evaluates CPU cores, RAM availability, and WebGL
                        support. Limited RAM info may show a warning.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Helper note */}
              <div className="mt-4 flex items-start gap-2 text-[12px] text-gray-500">
                <Info className="w-4 h-4 mt-0.5" />
                <p>
                  If the hardware check shows a warning, it usually means RAM
                  details were unavailable. As long as CPU cores and WebGL are
                  supported, proceeding is allowed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky compact footer (uniform buttons) */}
        <div className="sticky bottom-0 z-10 bg-white/90 backdrop-blur-sm border-t border-gray-200 px-5 sm:px-8">
          <div className="py-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {!checking && !checkComplete && (
                <button
                  onClick={runSystemCheck}
                  className="col-span-1 sm:col-span-2 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors cursor-pointer"
                >
                  <Rocket className="w-4 h-4" />
                  Start System Check
                </button>
              )}

              {checking && (
                <div className="col-span-1 sm:col-span-2 flex items-center justify-center gap-2 text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md py-2.5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running system check... Please wait.
                </div>
              )}

              {checkComplete && allPassed && (
                <>
                  <div className="col-span-1 inline-flex items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 py-2.5 px-3 text-emerald-800">
                    <CheckCircle className="w-4 h-4" />
                    All essential checks passed.
                  </div>
                  <button
                    onClick={handleProceed}
                    className="col-span-1 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors cursor-pointer"
                  >
                    Proceed to Instructions
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {checkComplete && !allPassed && (
                <div className="col-span-1 sm:col-span-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-rose-800 text-sm">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">
                        System requirements not met
                      </p>
                      <p className="text-[12.5px]">
                        Ensure stable internet, a modern browser, and adequate
                        hardware support before proceeding.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
