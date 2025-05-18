"use server";

import ActionResponse from "@/types/ActionResponse";

interface Candidate {
  id: number;
  name: string;
  email: string;
  appliedRole: string;
  appliedAt: string;
}

const generateMockCandidates = (count: number): Candidate[] => {
  const roles = ["Frontend Dev", "Backend Dev", "UI/UX Designer", "QA Engineer"];
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Candidate ${i + 1}`,
    email: `candidate${i + 1}@example.com`,
    appliedRole: roles[i % roles.length],
    appliedAt: new Date(Date.now() - i * 43200000).toISOString(), // 12 hr diff
  }));
};

export async function fetchCandidatesAction(): Promise<ActionResponse> {
  try {
    const allCandidates = generateMockCandidates(25);

    return {
      status: "success",
      message: "Fetching Candidates Successful",
      data: allCandidates,
    };
  } catch (error) {
    console.log("Error Fetching Candidates", error);
    return { status: "failure", message: "Error Fetching Candidates" };
  }
}
