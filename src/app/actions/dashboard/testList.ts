"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse, GetCandidateTestResponse } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";
import { getUserAction } from "../getUser";

export async function fetchCandidateTestList(
  groupId: number,
  opts?: { useGroupEndpoint?: boolean }
): Promise<ApiResponse<GetCandidateTestResponse[]>> {
  // If user is explicitly browsing a group, caller can pass useGroupEndpoint:true
  try {
    const username = await getUserAction();

    if (username) {
      const useGroup = !!opts?.useGroupEndpoint && Number.isFinite(groupId);
      console.log({ username, groupId, useGroup });

      const endpoint = useGroup
        ? endpoints.getCandidateTests
        : endpoints.getStudentDashboardTests;

      const { status, error, data, errorMessage, message } = await apiHandler(
        endpoint,
        useGroup ? ({ username, groupId } as any) : ({ username } as any)
      );

      console.log({ status, error, data, errorMessage, message });

      if (error) {
        return { status, error: true, message, errorMessage } as ApiResponse<
          GetCandidateTestResponse[]
        >;
      }

      let list: GetCandidateTestResponse[] = [];
      // If backend already returns an array
      let hasExplicitUpNext = false;
      if (Array.isArray(data)) {
        list = data as any;
      } else if (data && typeof data === "object") {
        // Accept case-insensitive keys from StudentDashboard endpoint
        const rawObj: any = data;
        hasExplicitUpNext = Object.keys(rawObj).some(
          (k) => k.toLowerCase() === "upnext"
        );
        for (const key of Object.keys(rawObj)) {
          const arr = rawObj[key];
          if (!Array.isArray(arr)) continue;
          const lower = key.toLowerCase();
          // Derive base status label from key if not provided on item
          let baseLabel: string = key;
          if (lower === "inprogress") baseLabel = "In Progress";
          else if (lower === "registered") baseLabel = "Registered";
          else if (lower === "completed") baseLabel = "Completed";
          else if (lower === "missed") baseLabel = "Missed";
          else if (lower === "cancelled") baseLabel = "Cancelled";
          else if (lower === "upnext") baseLabel = "Up Next";

          list.push(
            ...arr.map((t: any) => {
              const rawStatus =
                t.testCandidateRegistrationStatus ||
                t.testRegistrationStatus ||
                t.type ||
                t.status ||
                baseLabel;
              let finalStatus = rawStatus;
              if (finalStatus === "InProgress") finalStatus = "In Progress";
              if (finalStatus === "UpNext") finalStatus = "Up Next";
              return {
                testName: t.testName || t.TestName || t.name,
                testStartDate:
                  t.testStartDate || t.StartDate || t.TestStartDate,
                testEndDate: t.testEndDate || t.EndDate || t.TestEndDate,
                testCandidateRegistrationStatus: finalStatus,
                testId: t.testId || t.TestId || t.id,
              } as GetCandidateTestResponse;
            })
          );
        }
      }

      // Derive "Up Next" if not supplied: upcoming Registered tests whose start date > now
      let withUpNext = list;
      if (!hasExplicitUpNext) {
        // Only derive Up Next bucket if API didn't supply one
        const now = new Date();
        withUpNext = list.map((t) => {
          if (
            t.testCandidateRegistrationStatus === "Registered" &&
            t.testStartDate &&
            new Date(t.testStartDate) > now
          ) {
            return {
              ...t,
              testCandidateRegistrationStatus: "Up Next" as const,
            };
          }
          return t;
        });
      }

      return {
        status: 200,
        error: false,
        data: withUpNext,
        message: "Candidate Test List Retrieved",
      };
    }
    return {
      status: 500,
      error: true,
      message: "Something Went Wrong",
    };
  } catch (error) {
    console.log("Error Retrieving Candidate Test List", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Retrieving Candidate Test List",
    };
  }
}
