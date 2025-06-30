"use server";

import UserMock from "@/mock/user.json";

// Fetch a single candidate by ID
export async function fetchCandidateAction(userId: number) {
  try {
    const user = UserMock.filter((user) => user.CandidateID === userId);
    return {
      status: 200,
      message: "Fetching Candidate Successful",
      data: user[0],
    };
  } catch (error) {
    console.error("Error Fetching Candidate", error);
    return { status: "failure", message: "Error Fetching Candidate" };
  }
}

// Create a new candidate
export async function createCandidateAction(formData: FormData) {
  try {
    // TODO: Replace mock logic with actual API call
    console.log(
      "Creating candidate with data:",
      Object.fromEntries(formData.entries())
    );

    return {
      status: 200,
      message: "Candidate created successfully",
      data: {}, // Return newly created user data here
    };
  } catch (error) {
    console.error("Error Creating Candidate", error);
    return { status: "failure", message: "Error Creating Candidate" };
  }
}

// Update an existing candidate
export async function updateCandidateAction(
  userId: number,
  formData: FormData
) {
  try {
    // TODO: Replace mock logic with actual API call
    console.log(
      `Updating candidate ${userId} with data:`,
      Object.fromEntries(formData.entries())
    );

    return {
      status: 200,
      message: "Candidate updated successfully",
      data: {}, // Return updated user data here
    };
  } catch (error) {
    console.error("Error Updating Candidate", error);
    return { status: "failure", message: "Error Updating Candidate" };
  }
}
