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
  GetReportsAuditSummaryResponse,
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
import { fetchAdminDashboardReportAuditSummaryAction } from "@/app/actions/admin/reports/dashboardReportAuditSummary";

export default function AuditReports() {
  const [tableData, setTableData] = useState<
    GetReportsAuditSummaryResponse[]
  >([]);
  const [testid, setTestid] = useState<number | undefined>(undefined);

  const columns: {
    key: keyof GetReportsAuditSummaryResponse;
    label: string;
  }[] = [
    { key: "userName", label: "User" },
    { key: "activity", label: "Activity" },
    { key: "module", label: "Module" },
    { key: "device", label: "Device" },
    { key: "logDate", label: "Log Date" },
    { key: "logTime", label: "Log Time" },
  ];

  const fetchDashboardReportAuditSummary = async () => {
    try {
      const res =
        await fetchAdminDashboardReportAuditSummaryAction();
      const { status, data, error, errorMessage, message } = res;
      if (status === 200 && data) {
        setTableData(data);
      }
    } catch (error) {
      console.log("Error fetching dashboard audit data", error);
    }
  };

  useEffect(() => {
    fetchDashboardReportAuditSummary();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="py-6">
        <PaginatedTable data={tableData} columns={columns} />
      </div>
    </div>
  );
}
