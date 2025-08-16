"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

/**
 * Creates a new company with the provided form data.
 * Accepts FormData to support file upload (companyLogo).
 */
export async function createCompanyAction(
  formData: FormData
): Promise<ApiResponse<null>> {
  try {
    const { status, error, data, errorMessage, message } = await apiHandler(
      endpoints.createCompany,
      formData
    );

    console.log("CREATING COMPANY", {
      status,
      error,
      data,
      errorMessage,
      message,
    });

    const isSuccess =
      (status >= 200 && status < 300) ||
      status === 201 ||
      status === 200 ||
      (!error && status !== 0);

    if (isSuccess) {
      return {
        status,
        error: false,
        data,
        message: message || "Company Created Successfully",
      };
    }

    if (data && typeof data === "object") {
      const errorData = data as any;
      if ("errors" in errorData) {
        console.error("Validation errors:", errorData.errors);
      }
    }

    return {
      status: status || 500,
      error: true,
      errorMessage: errorMessage || message || "Error Creating Company",
    };
  } catch (error) {
    console.log("Error Creating Company", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Creating Company",
    };
  }
}