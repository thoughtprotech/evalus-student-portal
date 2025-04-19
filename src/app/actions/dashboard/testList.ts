"use server";

import ActionResponse from "@/types/ActionResponse";
import { cookies } from "next/headers";
import TestList from "@/mock/testList.json";

export async function fetchTestListAction(): Promise<ActionResponse> {
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
      message: "Fetching Test List Successful",
      data: TestList,
    };
  } catch (error) {
    console.log("Error Fetching Test List", error);
    return { status: "failure", message: "Error Fetching Test List" };
  }

  console.log({ token });
}
