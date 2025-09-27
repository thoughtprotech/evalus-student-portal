"use server";

import UserMock from "@/mock/user.json";

// Fetch user and candidateRegistration by userName
export async function fetchCandidateAction(userName: string) {
  try {
    const { API_BASE_URL: baseUrl } = require("@/utils/env").env;
    const res = await fetch(`${baseUrl}/api/Users/${userName}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) throw new Error("Failed to fetch user");
    const data = await res.json();
    return {
      status: true,
      message: "Fetching Candidate Successful",
      data,
    };
  } catch (error) {
    console.error("Error Fetching Candidate", error);
    return { status: false, message: "Error Fetching Candidate" };
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

// Update user and candidateRegistration by userName
export async function updateCandidateAction(
  userName: string,
  payload: any
) {
  try {
    const { API_BASE_URL: baseUrl } = require("@/utils/env").env;
    const res = await fetch(`${baseUrl}/api/Users/${userName}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update user");
    const data = await res.json();
    return {
      status: true,
      message: "Candidate updated successfully",
      data,
    };
  } catch (error) {
    console.error("Error Updating Candidate", error);
    return { status: false, message: "Error Updating Candidate" };
  }
}

// Update user profile with both user and candidateRegistration data
export async function updateUserProfileAction(
  userName: string,
  payload: any
) {
  try {
    const { API_BASE_URL: baseUrl } = require("@/utils/env").env;
    console.log("=== PUT /api/Users/", userName, "/both payload ===", JSON.stringify(payload, null, 2));
    const res = await fetch(`${baseUrl}/api/Users/${userName}/both`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    console.log("PUT response status:", res.status);
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Profile update failed with status:", res.status, "Error:", errorText);
      throw new Error(`Failed to update user profile: ${res.status}`);
    }
    const data = await res.json();
    return {
      status: true,
      message: "User profile updated successfully",
      data,
    };
  } catch (error) {
    console.error("Error Updating User Profile", error);
    return {
      status: false,
      message: "Error Updating User Profile",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
