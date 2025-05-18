"use server";

import ActionResponse from "@/types/ActionResponse";

interface Question {
  id: number;
  title: string;
  category: string;
  difficulty: string;
  createdAt: string;
}

const generateMockQuestions = (count: number): Question[] => {
  const categories = ["Math", "Science", "History", "Literature"];
  const difficulties = ["Easy", "Medium", "Hard"];
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `Sample Question ${i + 1}`,
    category: categories[i % categories.length],
    difficulty: difficulties[i % difficulties.length],
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  }));
};

export async function fetchQuestonsAction(): Promise<ActionResponse> {
  //   TODO: Add filters
  try {
    // const { token, role, username, roleDetailsJson, isAuthorized, message } =
    //   await apiHandler<LoginResponse>("/analyticsList", {
    //     method: "GET",
    //     routeType: "close",
    //   });
    const allQuestions = generateMockQuestions(50);

    return {
      status: "success",
      message: "Fetching Anaytics List Successful",
      data: allQuestions,
    };
  } catch (error) {
    console.log("Error Fetching Anaytics", error);
    return { status: "failure", message: "Error Fetching Anaytics" };
  }
}
