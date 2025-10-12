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
  AdminDashboardTestPerformanceSummaryResponse,
  GetAdminDashboardTestStatusSummaryResponse,
  GetReportsTestQuestionsPerformanceSummaryResponse,
} from "@/utils/api/types";
import { useEffect, useState } from "react";
import { fetchAdminDashboardReportDataAction } from "@/app/actions/admin/reports/dashboardReportData";
import {
  formatMinutesToHourMinute,
  formatMinutesToHourMinuteAlt,
} from "@/utils/formatIsoTime";
import PaginatedTable from "../PaginatedTable";
import { fetchAdminReportsTestsQuestionsPerformanceSummmaryAction } from "@/app/actions/admin/reports/dashboardReportsTestQuestionsPerformanceSummary";
import { fetchAdminDashboardTestStatusSummaryAction } from "@/app/actions/admin/reports/dashboardTestStatusSummary";

export default function StatusReports() {
  const [data, setData] = useState<AdminDashboardReportDataResponse>();
  const [tableData, setTableData] = useState<
    GetAdminDashboardTestStatusSummaryResponse[]
  >([]);
  const [testid, setTestid] = useState<number | undefined>(undefined);

  const columns: {
    key: keyof GetAdminDashboardTestStatusSummaryResponse;
    label: string;
  }[] = [
    { key: "testName", label: "Test Name" },
    { key: "inProgressCount", label: "In Progress" },
    { key: "resultGeneratedCount", label: "Result Generated" },
    { key: "totalCount", label: "Total" },
  ];

  const fetchDashboardTestPerformanceSummary = async () => {
    try {
      const res =
        await fetchAdminDashboardTestStatusSummaryAction();
      const { status, data, error, errorMessage, message } = res;
      if (status === 200 && data) {
        setTableData(data);
      }
    } catch (error) {
      console.log("Error fetching dashboard data", error);
    }
  };

  useEffect(() => {
    fetchDashboardTestPerformanceSummary();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="py-6">
        <PaginatedTable data={tableData} columns={columns} />
      </div>
    </div>
  );
}
