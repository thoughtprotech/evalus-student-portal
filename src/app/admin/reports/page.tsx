"use client";

import { useEffect, useState, ReactNode } from "react";
import {
  BarChart2,
  ClipboardList,
  CheckCircle,
  XCircle,
  TrendingUp,
  Percent,
  Clock,
  UserCheck,
  UserX,
  UserPlus,
  DollarSign,
  ShoppingCart,
  RefreshCw,
  Edit2,
  AlertCircle,
  Zap,
} from "lucide-react";
import { fetchReportsAction } from "@/app/actions/admin/reports";
import Loader from "@/components/Loader";
import { TabsContent, TabsList, TabsRoot } from "@/components/Tabs";
import PageHeader from "@/components/PageHeader";
import TestReports from "./_components/TestReports/TestReports";
import QuestionReports from "./_components/QuestionReports/QuestionReports";
import CandidateReports from "./_components/CandidateReports/CandidateReports";
import { AdminDashboardReportDataResponse } from "@/utils/api/types";
import { fetchAdminDashboardReportDataAction } from "@/app/actions/admin/reports/dashboardReportData";
import { formatMinutesToHourMinuteAlt } from "@/utils/formatIsoTime";
import StatusReports from "./_components/StatusReports/StatusReports";

interface Report {
  id: number;
  name: string;
  type: string;
  generatedAt: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [data, setData] = useState<AdminDashboardReportDataResponse>();

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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetchReportsAction();
      if (res.status === 200 && Array.isArray(res.data)) {
        setReports(res.data);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <PageHeader
        icon={<BarChart2 className="w-6 h-6 text-purple-600" />}
        title="Reports"
        showSearch={false}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-6 mt-4">
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
      <TabsRoot defaultIndex={0}>
        <div className="flex justify-between items-center mt-4">
          <TabsList
            labels={[
              "Tests",
              "Questions",
              "Candidates",
              "Status",
              "Sales",
              "Audit Log",
            ]}
          />
        </div>

        <TabsContent>
          {/* 0: Test Report */}
          <TestReports />

          {/* 1: Status Report */}
          <QuestionReports />

          {/* 2: Candidate Report */}
          <CandidateReports />

          {/* 3: Subjective Eval */}
          <StatusReports />

          {/* 4: Audit Log */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <DetailCard
              icon={<BarChart2 className="w-6 h-6 text-indigo-600" />}
              label="Total Actions"
              value="5,320"
              footer="All time"
            />
            <DetailCard
              icon={<Zap className="w-6 h-6 text-yellow-500" />}
              label="Warnings"
              value="374"
              footer="Logged"
            />
            <DetailCard
              icon={<AlertCircle className="w-6 h-6 text-red-600" />}
              label="Errors"
              value="27"
              footer="Critical"
            />
            <DetailCard
              icon={<RefreshCw className="w-6 h-6 text-teal-600" />}
              label="Retries"
              value="112"
              footer="Auto attempts"
            />
            <DetailCard
              icon={<UserCheck className="w-6 h-6 text-green-600" />}
              label="Admins Active"
              value="8"
              footer="Last 30 days"
            />
            <DetailCard
              icon={<Clock className="w-6 h-6 text-gray-600" />}
              label="Last Entry"
              value="2h ago"
              footer="Timestamp"
            />
          </div>
        </TabsContent>
      </TabsRoot>
    </div>
  );
}

export function DetailCard({
  icon,
  label,
  value,
  footer,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  footer: string;
}) {
  return (
    <div className="flex flex-col justify-between p-4 bg-white rounded-md shadow-md border border-gray-300 transition">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-indigo-50 rounded-full">{icon}</div>
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
      <p className="mt-4 text-xs text-gray-400">{footer}</p>
    </div>
  );
}
