import {
  CheckCircle,
  ClipboardList,
  Clock,
  Percent,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { DetailCard } from "../../page";

export default function TestReports() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-6">
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
    </div>
  );
}
