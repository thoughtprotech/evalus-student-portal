"use server";

import { ApiResponse } from "@/utils/api/types";

interface Test {
  id: number;
  name: string;
  subject: string;
  date: string;
}

const generateMockTests = (count: number): Test[] => {
  const subjects = ["Math", "Science", "English", "Computer"];
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Test ${i + 1}`,
    subject: subjects[i % subjects.length],
    date: new Date(Date.now() - i * 604800000).toISOString(), // Weekly gap
  }));
};

export async function fetchTestsAction(): Promise<ApiResponse<Test[]>> {
  try {
    const allTests = generateMockTests(30);

    return {
      status: 200,
      message: "Fetching Tests Successful",
      data: allTests,
    };
  } catch (error) {
    console.log("Error Fetching Tests", error);
    return { status: 500, message: "Error Fetching Tests" };
  }
}
