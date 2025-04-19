"use server";

import ActionResponse from "@/types/ActionResponse";
import { cookies } from "next/headers";
import Analytics from "@/mock/mockTestDetails.json";

export type TestId = keyof typeof Analytics;

export async function fetchAnalyticsAction(
  testId: TestId
): Promise<ActionResponse> {
  const token = (await cookies()).get("token")?.value;

  //   TODO: Add filters
  try {
    // const res = await fetch("https://api.example.com/auth", {
    //   method: "GET",
    //   headers: { Authentication: `Bearer ${token}` },
    // });

    // if (!res.ok) {
    //   throw new Error("Authentication failed.");
    // }

    // const {testList} = await res.json();

    return {
      status: "success",
      message: "Fetching Anaytics List Successful",
      data: Analytics[testId],
    };
  } catch (error) {
    console.log("Error Fetching Anaytics", error);
    return { status: "failure", message: "Error Fetching Anaytics" };
  }

  console.log({ token });
}
