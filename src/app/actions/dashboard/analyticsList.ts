"use server";

import ActionResponse from "@/types/ActionResponse";
import { cookies } from "next/headers";
import AnalyticsList from "@/mock/mockTests.json";

export async function fetchAnalyticsListAction(): Promise<ActionResponse> {
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
      data: AnalyticsList,
    };
  } catch (error) {
    console.log("Error Fetching Anaytics List", error);
    return { status: "failure", message: "Error Fetching Anaytics List" };
  }

  console.log({ token });
}
