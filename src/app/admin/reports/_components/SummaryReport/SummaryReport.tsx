import { fetchAdminDashboardReportDataAction } from "@/app/actions/admin/reports/dashboardReportData";
import { AdminDashboardReportDataResponse } from "@/utils/api/types";
import { formatMinutesToHourMinuteAlt } from "@/utils/formatIsoTime";
import {
  CheckCircle,
  ClipboardList,
  Clock,
  Percent,
  TrendingUp,
  XCircle,
} from "lucide-react";
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useState,
} from "react";

export default function SummaryReport({
  data,
}: {
  data: AdminDashboardReportDataResponse | undefined;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-6 mt-4">
      <DetailCard
        icon={<ClipboardList className="w-6 h-6 text-indigo-600" />}
        label="Test Attempts"
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
