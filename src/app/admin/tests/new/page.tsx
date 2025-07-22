"use client";

import React, { useEffect, useState } from "react";
import Stepper from "@/components/Stepper";
import TestConfiguration from "./_components/stepper/TestConfiguration";

export default function Index() {
  // Combined state for Step 1 fields
  const [testConfiguration, setTestConfiguration] = useState({
    testName: "",
    testType: "",
    testCode: "",
    category: "",
    instructions: "",
    duration: "",
    handicappedDuration: "",
    totalQuestions: "",
    totalMarks: "",
    difficulty: "",
    secondaryTestType: "",
  });

  // Generic change handler
  const handleStep1Change = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTestConfiguration((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    console.log({ testConfiguration });
  }, [testConfiguration]);

  return (
    <div className="w-full min-h-screen bg-gray-100 flex justify-center p-4">
      <Stepper
        initialStep={1}
        stepNames={["Test Configuration"]}
        onStepChange={(step) => console.log("Step:", step)}
        onSubmit={() => console.log("Form Data:", testConfiguration)}
      >
        {/* Step 1: Test Setup Form */}
        <TestConfiguration testConfiguration={testConfiguration} handleChange={handleStep1Change} />

        {/* Placeholder for Step 2 & 3 */}
        <div>Step 2 content...</div>
        <div>Step 3 content...</div>
      </Stepper>
    </div>
  );
}
