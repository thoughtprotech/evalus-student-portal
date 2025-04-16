"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface InstructionData {
  title: string;
  instructions: string[];
}

// Mock instructions data for different tests
const mockInstructions: Record<string, InstructionData> = {
  "1": {
    title: "Aptitude Practice Test 1",
    instructions: [
      "Read all the questions carefully.",
      "Manage your time effectively.",
      "Do not use any external resources.",
      "Once you start the exam, you cannot pause it.",
      "Review your answers before submitting.",
    ],
  },
  "2": {
    title: "Logical Reasoning Test",
    instructions: [
      "Focus on the logic behind each question.",
      "Ensure to answer all questions.",
      "Time management is key.",
      "Double-check answers for accuracy.",
    ],
  },
  // Additional instruction data can be added here
};

export default function ExamStartPage() {
  const { id } = useParams();
  const router = useRouter();
  const [instructionData, setInstructionData] =
    useState<InstructionData | null>(null);
  const [agreed, setAgreed] = useState(false);

  // Load instructions based on the test id
  useEffect(() => {
    if (id && mockInstructions[id as string]) {
      setInstructionData(mockInstructions[id as string]);
    }
  }, [id]);

  if (!instructionData) {
    return (
      <div className="w-full h-full flex justify-center items-center px-4 py-8">
        Loading instructions...
      </div>
    );
  }

  const handleProceed = () => {
    // Navigate to the exam start page (adjust the route as needed)
    router.push(`/exam/${id}`);
  };

  return (
    <div className="w-full h-full flex justify-center items-center px-4 py-8">
      {/* Main container card */}
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl p-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">
            {instructionData.title}
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Please read the following instructions carefully before proceeding.
          </p>
        </div>
        {/* Instructions List */}
        <div className="mb-8 space-y-4">
          {instructionData.instructions.map((inst, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <span className="bg-indigo-500 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold">
                  {index + 1}
                </span>
              </div>
              <p className="text-gray-700 text-base">{inst}</p>
            </div>
          ))}
        </div>
        {/* Agreement Section */}
        <div className="mb-8 flex items-center">
          <label className="flex items-center space-x-4">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 cusor-pointer"
            />
            <span className="text-gray-700 text-base cusor-pointer">
              I have read and agreed to the instructions.
            </span>
          </label>
        </div>
        {/* Action Button */}
        <div className="flex justify-center">
          <button
            onClick={handleProceed}
            disabled={!agreed}
            className={`w-full py-3 rounded-lg font-semibold transition-colors cursor-pointer ${
              agreed
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Proceed to Exam
          </button>
        </div>
      </div>
    </div>
  );
}
