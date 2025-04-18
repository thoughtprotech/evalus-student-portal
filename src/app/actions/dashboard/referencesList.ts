"use server";

import ActionResponse from "@/types/ActionResponse";
import { cookies } from "next/headers";
import ReferenceList from "@/mock/referencesList.json";

export async function fetchReferencesListAction(): Promise<ActionResponse> {
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
      message: "Fetching References List Successful",
      data: ReferenceList,
    };
  } catch (error) {
    console.log("Error Fetching References List", error);
    return { status: "failure", message: "Error Fetching References List" };
  }

  console.log({ token });
}
