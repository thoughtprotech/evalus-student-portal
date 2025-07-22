import React, { useState } from "react";
import { Check } from "lucide-react";

interface StepperProps {
  /** Initial step (1-based) */
  initialStep?: number;
  /** Content for each step */
  children: React.ReactNode[];
  /** Optional array of step labels */
  stepNames?: string[];
  /** Fires on step change */
  onStepChange?: (step: number) => void;
  /** Fires when final step's Submit is clicked */
  onSubmit?: () => void;
}

export default function Stepper({
  initialStep = 1,
  children,
  stepNames = [],
  onStepChange,
  onSubmit,
}: StepperProps) {
  const total = React.Children.count(children);

  // Generate display names, fallback to "Step X" if name not provided
  const names = Array.from({ length: total }, (_v, i) => {
    const name = stepNames[i];
    return name != null && name.trim() ? name : `Step ${i + 1}`;
  });

  const [current, setCurrent] = useState(
    Math.min(Math.max(initialStep, 1), total)
  );

  const change = (step: number) => {
    const valid = Math.min(Math.max(step, 1), total);
    setCurrent(valid);
    onStepChange?.(valid);
  };

  const next = () => change(current + 1);
  const prev = () => change(current - 1);
  const last = current === total;

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col space-y-4">
      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {names.map((label, idx) => {
          const step = idx + 1;
          const completed = step < current;
          const active = step === current;

          return (
            <div
              key={step}
              className="relative flex-1 flex flex-col items-center"
            >
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full border-2 transition-all 
                  ${
                    completed
                      ? "bg-indigo-500 border-indigo-500"
                      : active
                      ? "bg-white border-indigo-500"
                      : "bg-white border-gray-300"
                  }`}
              >
                {completed ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <span
                    className={`${
                      active ? "text-indigo-500" : "text-gray-500"
                    }`}
                  >
                    {step}
                  </span>
                )}
              </div>
              <div
                className={`mt-2 text-xs font-medium text-center transition-colors 
                  ${active ? "text-indigo-600" : "text-gray-500"}`}
              >
                {label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Step Content */}
      <div className="bg-white rounded-xl shadow-md">
        {React.Children.toArray(children)[current - 1]}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={prev}
          disabled={current === 1}
          className="px-5 py-2 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-100 disabled:opacity-50 transition cursor-pointer"
        >
          Previous
        </button>

        {last ? (
          <button
            onClick={onSubmit}
            className="px-5 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition cursor-pointer"
          >
            Submit
          </button>
        ) : (
          <button
            onClick={next}
            className="px-5 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition cursor-pointer"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Usage Example:
 *
 * <Stepper
 *   initialStep={1}
 *   stepNames={["Config", null, "Review"]}
 *   onStepChange={step => console.log(step)}
 *   onSubmit={() => console.log("Done")}
 * >
 *   <ConfigForm />
 *   <QuestionsForm />
 *   <ReviewForm />
 * </Stepper>
 */
