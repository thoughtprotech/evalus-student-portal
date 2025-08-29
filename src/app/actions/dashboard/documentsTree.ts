"use server";

import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import { ApiResponse, PublishedDocumentTreeItem } from "@/utils/api/types";

export async function fetchDocumentsTreeAction(): Promise<ApiResponse<PublishedDocumentTreeItem[]>> {
  try {
    const { data, status, error, errorMessage, message } = await apiHandler(endpoints.getPublishedDocumentsTree, null as any);

    if (error) {
      return { status, error: true, message, errorMessage };
    }

    return {
      status: 200,
      error: false,
      message: "Documents tree fetched",
      data,
    };
  } catch (err) {
    console.error("Error fetching documents tree", err);
    return {
      status: 500,
      error: true,
      message: "Failed to fetch documents tree",
      errorMessage: (err as any)?.message,
    };
  }
}
