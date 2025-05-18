"use server";

import ActionResponse from "@/types/ActionResponse";

interface Report {
  id: number;
  name: string;
  type: string;
  generatedAt: string;
}

const generateMockReports = (count: number): Report[] => {
  const types = ["Performance", "Attendance", "Finance", "Engagement"];
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Report ${i + 1}`,
    type: types[i % types.length],
    generatedAt: new Date(Date.now() - i * 86400000).toISOString(), // Daily
  }));
};

export async function fetchReportsAction(): Promise<ActionResponse> {
  try {
    const allReports = generateMockReports(15);

    return {
      status: "success",
      message: "Fetching Reports Successful",
      data: allReports,
    };
  } catch (error) {
    console.log("Error Fetching Reports", error);
    return { status: "failure", message: "Error Fetching Reports" };
  }
}
