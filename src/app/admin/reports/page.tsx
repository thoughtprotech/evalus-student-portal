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
import AuditReports from "./_components/AuditReport/AuditReport";
import SalesReport from "./_components/SalesReport/SalesReport";
import SummaryReport from "./_components/SummaryReport/SummaryReport";

interface Report {
  id: number;
  name: string;
  type: string;
  generatedAt: string;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<AdminDashboardReportDataResponse>();

  const fetchDashboardData = async () => {
    try {
      const res = await fetchAdminDashboardReportDataAction();
      const { status, data, error, errorMessage, message } = res;
      if (status === 200 && data) {
        setData(data);
        setLoading(false);
      }
    } catch (error) {
      console.log("Error fetching dashboard data", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <PageHeader
        icon={<BarChart2 className="w-6 h-6 text-purple-600" />}
        title="Reports"
        showSearch={false}
      />
      <SummaryReport data={data} />

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

          {/* 4: Sales */}
          <SalesReport />

          {/* 5: Audit Logs */}
          <AuditReports />
        </TabsContent>
      </TabsRoot>
    </div>
  );
}
