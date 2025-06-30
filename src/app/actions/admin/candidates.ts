"use server";

import { ApiResponse } from "@/utils/api/types";

interface Candidate {
  id: number;
  name: string;
  email: string;
  appliedRole: string;
  appliedAt: string;
}

const generateMockCandidates = (count: number): Candidate[] => {
  const roles = [
    "Frontend Dev",
    "Backend Dev",
    "UI/UX Designer",
    "QA Engineer",
  ];
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Candidate ${i + 1}`,
    email: `candidate${i + 1}@example.com`,
    appliedRole: roles[i % roles.length],
    appliedAt: new Date(Date.now() - i * 43200000).toISOString(), // 12 hr diff
  }));
};

export async function fetchCandidatesAction(): Promise<
  ApiResponse<Candidate[]>
> {
  try {
    const allCandidates = generateMockCandidates(25);

    return {
      status: 200,
      message: "Fetching Candidates Successful",
      data: allCandidates,
    };
  } catch (error) {
    console.log("Error Fetching Candidates", error);
    return { status: 500, message: "Error Fetching Candidates" };
  }
}
