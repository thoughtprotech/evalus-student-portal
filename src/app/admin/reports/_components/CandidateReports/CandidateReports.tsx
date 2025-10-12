import {
  CheckCircle,
  ClipboardList,
  Clock,
  Percent,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { DetailCard } from "../../page";
import {
  AdminDashboardReportDataResponse,
  GetAdminDashboardTestCandidatePerformanceSummaryResponse,
  GetCandidateGroupsInorderResponse,
  GetReportsTestQuestionsPerformanceSummaryResponse,
} from "@/utils/api/types";
import { useEffect, useState } from "react";
import { fetchAdminDashboardReportDataAction } from "@/app/actions/admin/reports/dashboardReportData";
import { formatMinutesToHourMinuteAlt } from "@/utils/formatIsoTime";
import PaginatedTable from "../PaginatedTable";
import { fetchAdminDashboardTestCandidatePerformanceSummaryAction } from "@/app/actions/admin/reports/dashboardTestCandidatePerformanceSummary";
import {
  CandidateGroupRow,
  fetchCandidateGroupsInorderAction,
  fetchCandidateGroupsODataAction,
} from "@/app/actions/admin/candidateGroups";

export default function CandidateReports() {
  const [data, setData] = useState<GetCandidateGroupsInorderResponse[]>();
  const [tableData, setTableData] = useState<
    GetAdminDashboardTestCandidatePerformanceSummaryResponse[]
  >([]);
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [groupId, setGroupId] = useState<string>("");

  const columns: {
    key: keyof GetAdminDashboardTestCandidatePerformanceSummaryResponse;
    label: string;
  }[] = [
    { key: "candidateName", label: "Candidate Name" },
    { key: "email", label: "Email" },
    { key: "cellPhone", label: "Cell Phone" },
    { key: "testName", label: "Test Name" },
    { key: "isActive", label: "Is Active" },
    { key: "groupNames", label: "Group Names" },
    { key: "totalMarks", label: "Total Marks" },
    { key: "marksScored", label: "Marks Scored" },
  ];

  const fetchCandidateGroups = async () => {
    try {
      const res = await fetchCandidateGroupsInorderAction();
      const { status, data, error, errorMessage, message } = res;
      if (status === 200 && data) {
        setData(data);
      }
    } catch (error) {
      console.log("Error fetching dashboard data", error);
    }
  };

  const fetchAdminDashboardTestCandidatePerformanceSummary = async (
    search?: string,
    groupId?: string
  ) => {
    try {
      const res =
        await fetchAdminDashboardTestCandidatePerformanceSummaryAction(
          search,
          groupId ? parseInt(groupId) : undefined
        );
      const { status, data, error, errorMessage, message } = res;
      if (status === 200 && data) {
        setTableData(data);
      }
    } catch (error) {
      console.log("Error fetching dashboard data", error);
    }
  };

  useEffect(() => {
    fetchCandidateGroups();
  }, []);

  useEffect(() => {
    console.log({ groupId });
    if (groupId && groupId !== "") {
      fetchAdminDashboardTestCandidatePerformanceSummary(undefined, groupId);
    }
  }, [groupId]);

  return (
    <div className="flex flex-col gap-4">
      <div className="py-6">
        <PaginatedTable
          data={tableData}
          columns={columns}
          externalFilters={[
            {
              label: "Candidate Groups",
              options:
                data?.map((group) => {
                  return {
                    label: group?.fullPath,
                    value: group?.candidateGroupID?.toString(),
                  };
                }) || [],
              value: groupId?.toString() || "",
              setValue: setGroupId,
            },
          ]}
        />
      </div>
    </div>
  );
}
