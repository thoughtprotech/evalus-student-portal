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
} from "@/utils/api/types";
import { useEffect, useState } from "react";
import { fetchAdminDashboardReportDataAction } from "@/app/actions/admin/reports/dashboardReportData";
import {
  formatMinutesToHourMinute,
  formatMinutesToHourMinuteAlt,
} from "@/utils/formatIsoTime";
import { fetchAdminDashboardTestPerformanceSummaryAction } from "@/app/actions/admin/reports/dashboardTestPerformanceSummary";
import PaginatedTable from "../PaginatedTable";

export default function TestReports() {
  const [data, setData] = useState<AdminDashboardReportDataResponse>();
  const [tableData, setTableData] = useState<
    AdminDashboardTestPerformanceSummaryResponse[]
  >([]);
  const [testid, setTestid] = useState<number | undefined>(undefined);

  const columns: {
    key: keyof AdminDashboardTestPerformanceSummaryResponse;
    label: string;
  }[] = [
    { key: "testName", label: "Test Name" },
    { key: "totalCandidates", label: "Total Candidates" },
    { key: "completed", label: "Completed" },
    { key: "averageScore", label: "Avg Score" },
    { key: "maxScore", label: "Max Score" },
    { key: "aboveAverageCount", label: "Above Avg" },
    { key: "belowAverageCount", label: "Below Avg" },
  ];

  const fetchDashboardData = async () => {
    try {
      const res = await fetchAdminDashboardReportDataAction();
      const { status, data, error, errorMessage, message } = res;
      if (status === 200 && data) {
        setData(data);
      }
    } catch (error) {
      console.log("Error fetching dashboard data", error);
    }
  };

  const fetchDashboardTestPerformanceSummary = async () => {
    try {
      const res = await fetchAdminDashboardTestPerformanceSummaryAction();
      const { status, data, error, errorMessage, message } = res;
      if (status === 200 && data) {
        setTableData(data);
      }
    } catch (error) {
      console.log("Error fetching dashboard data", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchDashboardTestPerformanceSummary();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-6">
        <DetailCard
          icon={<ClipboardList className="w-6 h-6 text-indigo-600" />}
          label="Total Tests"
          value={data?.testCount?.toString() || "0"}
          footer="Since launch"
        />
        <DetailCard
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          label="Passed"
          value={data?.passCount?.toString() || "0"}
          footer={`${data?.passRatePercent?.toFixed(2) || "0"}% pass rate`}
        />
        <DetailCard
          icon={<XCircle className="w-6 h-6 text-red-600" />}
          label="Failed"
          value={data?.failCount?.toString() || "0"}
          footer={`${data?.failRatePercent?.toFixed(2) || "0"}% fail rate`}
        />
        <DetailCard
          icon={<TrendingUp className="w-6 h-6 text-indigo-600" />}
          label="Avg. Score"
          value={`${data?.averageTotalMarks?.toFixed(2) || "0"}%`}
          footer="Across all tests"
        />
        <DetailCard
          icon={<Percent className="w-6 h-6 text-teal-600" />}
          label="Pass Rate"
          value={`${data?.passRatePercent?.toFixed(2) || "0"}%`}
          footer="Across all tests"
        />
        <DetailCard
          icon={<Clock className="w-6 h-6 text-gray-600" />}
          label="Avg. Duration"
          value={formatMinutesToHourMinuteAlt(
            Number(data?.avgDurationMinutes) || 0
          )}
          footer="Per test"
        />
      </div>
      <div className="p-6">
        <h1 className="text-xl font-bold mb-4">Test Reports</h1>
        <PaginatedTable data={tableData} columns={columns} />
      </div>
    </div>
  );
}
