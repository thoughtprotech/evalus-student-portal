"use server";

import { ApiResponse } from "@/utils/api/types";

interface Question {
  id: number;
  title: string;
  subject: string;
  topic: string;
  level: string;
  createdAt: string;
  updatedAt: string;
}

const generateMockQuestions = (count: number): Question[] => {
  const subjects = ["English", "Math", "Science", "History"];
  const topics = ["Chapter 1", "Chapter 2", "Chapter 3", "Chapter 4"];
  const levels = ["Beginner", "Intermediate", "Advanced"];
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `Test${i + 1}`,
    subject: subjects[i % subjects.length],
    topic: topics[i % topics.length],
    level: levels[i % levels.length],
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - i * 43200000).toISOString(), // 12 hours later
  }));
};

export async function fetchQuestonsAction(): Promise<ApiResponse<Question[]>> {
  //   TODO: Add filters
  try {
    // const { token, role, username, roleDetailsJson, isAuthorized, message } =
    //   await apiHandler<LoginResponse>("/analyticsList", {
    //     method: "GET",
    //     routeType: "close",
    //   });
    const allQuestions = generateMockQuestions(50);

    return {
      status: 200,
      message: "Fetching Anaytics List Successful",
      data: allQuestions,
    };
  } catch (error) {
    console.log("Error Fetching Anaytics", error);
    return { status: 500, message: "Error Fetching Anaytics" };
  }
}
