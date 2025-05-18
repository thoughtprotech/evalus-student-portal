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

interface Report {
  id: number;
  name: string;
  type: string;
  generatedAt: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetchReportsAction();
      if (res.status === "success" && Array.isArray(res.data)) {
        setReports(res.data);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <TabsRoot defaultIndex={0}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold flex items-center text-gray-800">
            <BarChart2 className="w-6 h-6 text-indigo-600" />
            <span className="ml-2">Reports</span>
          </h1>
          <TabsList
            labels={[
              "Test Report",
              "Status Report",
              "Sales Report",
              "Subjective Eval",
              "Audit Log",
            ]}
          />
        </div>

        <TabsContent>
          {/* 0: Test Report */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <DetailCard
              icon={<ClipboardList className="w-6 h-6 text-indigo-600" />}
              label="Total Tests"
              value="128"
              footer="Since launch"
            />
            <DetailCard
              icon={<CheckCircle className="w-6 h-6 text-green-600" />}
              label="Passed"
              value="375"
              footer="75% pass rate"
            />
            <DetailCard
              icon={<XCircle className="w-6 h-6 text-red-600" />}
              label="Failed"
              value="125"
              footer="25% fail rate"
            />
            <DetailCard
              icon={<TrendingUp className="w-6 h-6 text-indigo-600" />}
              label="Avg. Score"
              value="78%"
              footer="Across all tests"
            />
            <DetailCard
              icon={<Percent className="w-6 h-6 text-teal-600" />}
              label="Pass Rate"
              value="75%"
              footer="Up 5% MoM"
            />
            <DetailCard
              icon={<Clock className="w-6 h-6 text-gray-600" />}
              label="Avg. Duration"
              value="35m"
              footer="Per test"
            />
          </div>

          {/* 1: Status Report */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <DetailCard
              icon={<UserCheck className="w-6 h-6 text-green-600" />}
              label="Active Users"
              value="342"
              footer="Last 24h"
            />
            <DetailCard
              icon={<UserX className="w-6 h-6 text-red-600" />}
              label="Inactive Users"
              value="58"
              footer="Not logged in 30d"
            />
            <DetailCard
              icon={<UserPlus className="w-6 h-6 text-indigo-600" />}
              label="New Sign‑ups"
              value="92"
              footer="Last week"
            />
            <DetailCard
              icon={<Zap className="w-6 h-6 text-yellow-500" />}
              label="Sessions"
              value="1.2K"
              footer="Today"
            />
            <DetailCard
              icon={<RefreshCw className="w-6 h-6 text-teal-600" />}
              label="Returning"
              value="78%"
              footer="Of total users"
            />
            <DetailCard
              icon={<Clock className="w-6 h-6 text-gray-600" />}
              label="Avg. Session"
              value="10m"
              footer="Per user"
            />
          </div>

          {/* 2: Sales Report */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <DetailCard
              icon={<DollarSign className="w-6 h-6 text-green-600" />}
              label="Revenue"
              value="$12,430"
              footer="Month to date"
            />
            <DetailCard
              icon={<ShoppingCart className="w-6 h-6 text-indigo-600" />}
              label="Orders"
              value="1,254"
              footer="This month"
            />
            <DetailCard
              icon={<RefreshCw className="w-6 h-6 text-teal-600" />}
              label="Repeat Buys"
              value="34%"
              footer="Of total"
            />
            <DetailCard
              icon={<Zap className="w-6 h-6 text-yellow-500" />}
              label="Average Cart"
              value="$98"
              footer="Per order"
            />
            <DetailCard
              icon={<Percent className="w-6 h-6 text-purple-600" />}
              label="Conversion"
              value="4.2%"
              footer="Site visits → orders"
            />
            <DetailCard
              icon={<Clock className="w-6 h-6 text-gray-600" />}
              label="Avg. Fulfillment"
              value="2d"
              footer="Order to ship"
            />
          </div>

          {/* 3: Subjective Eval */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <DetailCard
              icon={<Edit2 className="w-6 h-6 text-indigo-600" />}
              label="Evaluated"
              value="410"
              footer="Completed reviews"
            />
            <DetailCard
              icon={<Clock className="w-6 h-6 text-gray-600" />}
              label="Pending"
              value="65"
              footer="Awaiting feedback"
            />
            <DetailCard
              icon={<AlertCircle className="w-6 h-6 text-red-600" />}
              label="Flagged"
              value="12"
              footer="Needs re-evaluation"
            />
            <DetailCard
              icon={<CheckCircle className="w-6 h-6 text-green-600" />}
              label="Approved"
              value="388"
              footer="Pass threshold"
            />
            <DetailCard
              icon={<XCircle className="w-6 h-6 text-red-600" />}
              label="Rejected"
              value="22"
              footer="Below standard"
            />
            <DetailCard
              icon={<Percent className="w-6 h-6 text-teal-600" />}
              label="Approval Rate"
              value="85%"
              footer="Of evaluated"
            />
          </div>

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

function DetailCard({
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
    <div className="flex flex-col justify-between p-4 bg-white rounded-lg shadow hover:shadow-lg transition">
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
