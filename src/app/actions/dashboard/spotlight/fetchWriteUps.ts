"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse, GetWriteUpsResponse, ODataList } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

export async function fetchWriteUpsAction(): Promise<ApiResponse<GetWriteUpsResponse[]>> {
  try {
    // Prefer OData open endpoint
    const odataRes = await apiHandler(endpoints.getWriteUpsOData, null);
    if (!odataRes.error && odataRes.status === 200) {
      const raw = ((odataRes.data as unknown as ODataList<any>)?.value || []) as any[];
      const list: GetWriteUpsResponse[] = raw.map((r) => ({
        writeUpId: r.WriteUpId ?? r.writeUpId,
        writeUpName: r.WriteUpName ?? r.writeUpName,
        writeUp1: r.WriteUp1 ?? r.writeUp1 ?? "",
        language: r.Language ?? r.language ?? "",
        isActive: r.IsActive ?? r.isActive ?? 1,
        createdBy: r.CreatedBy ?? r.createdBy ?? "",
        createdDate: r.CreatedDate ?? r.createdDate ?? "",
        modifiedBy: r.ModifiedBy ?? r.modifiedBy ?? null,
        modifiedDate: r.ModifiedDate ?? r.modifiedDate ?? "",
        writeuptags: r.Writeuptags ?? r.writeuptags ?? [],
      }));
      return { status: 200, data: list, message: "WriteUps Fetched" };
    }

    // Fallback to legacy
    const legacy = await apiHandler(endpoints.getWriteUps, null);
    if (!legacy.error && legacy.status === 200) {
      return { status: 200, data: legacy.data, message: legacy.message || "WriteUps Fetched" };
    }

    return {
      status: legacy.status || odataRes.status || 500,
      error: true,
      errorMessage: legacy.errorMessage || odataRes.errorMessage || "Error Fetching WriteUps",
    };
  } catch (error) {
    console.log("Error Fetching WriteUps", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Fetching WriteUps",
    };
  }
}
