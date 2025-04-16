"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";

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
  const { id } = useParams();
  const router = useRouter();

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

    const hasEnoughRAM =
      typeof ram === "number" ? ram > 2 : undefined;
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

    setSteps((prev) =>
      prev.map((step) => ({
        ...step,
        status: "pending",
      }))
    );

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
      router.push(`/exam/instructions/${id}`);
    }
  };

  return (
    <div className="h-full bg-white flex flex-col items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-10">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4 text-center">
          System Check
        </h1>
        <p className="text-center text-gray-600 mb-6">
          To ensure the best experience, please run our system check to verify
          that your device meets all the exam requirements.
        </p>

        {/* Steps */}
        <div className="space-y-4 mb-8">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {step.status === "passed" && (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                )}
                {step.status === "failed" && (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
                {step.status === "in-progress" && (
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                )}
                {step.status === "pending" && (
                  <AlertCircle className="w-6 h-6 text-gray-400" />
                )}
                {step.status === "warning" && (
                  <AlertCircle className="w-6 h-6 text-yellow-500" />
                )}
                <span className="text-gray-800 font-medium">{step.name}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600 capitalize">
                  {step.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Buttons & Feedback */}
        <div className="flex flex-col items-center gap-4">
          {!checking && !checkComplete && (
            <button
              onClick={runSystemCheck}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
            >
              Start System Check
            </button>
          )}
          {checking && (
            <p className="text-lg text-gray-700">
              Running system check... Please wait.
            </p>
          )}
          {checkComplete && allPassed && (
            <button
              onClick={handleProceed}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
            >
              Proceed to Instructions
            </button>
          )}
          {checkComplete && !allPassed && (
            <p className="text-lg text-red-600 font-semibold text-center">
              Your system does not meet the exam requirements. Please update
              your device.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
