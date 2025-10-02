"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChartBig, Trophy, ListChecks } from "lucide-react";
import Loader from "@/components/Loader";
import AnalyticCard from "./components/AnalyticCard";
import {
  fetchAnalyticsSummaryAction,
} from "@/app/actions/dashboard/analyticsSummary";
import { CandidateAnalyticsDetailsResponse } from "@/utils/api/types";
import { getUserAction } from "@/app/actions/getUser";
import { fetchAnalyticsDetailsAction } from "@/app/actions/dashboard/analyticsDetail";

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{
    testsCompleted: number;
    averageScore: number;
    maxScore: number;
  } | null>(null);
  const [testDetails, setTestDetails] = useState<CandidateAnalyticsDetailsResponse[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const username = await getUserAction();
      // Fetch summary
      const summaryRes = await fetchAnalyticsSummaryAction(username!);
      if (summaryRes.status === 200 && summaryRes.data) {
        setSummary(summaryRes.data);
      }
      // Fetch details
      const detailsRes = await fetchAnalyticsDetailsAction(username!)
      if (detailsRes.status === 200) {
        const detailsData: CandidateAnalyticsDetailsResponse[] = detailsRes.data!;
        setTestDetails(detailsData);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return <Loader />;
  }

  const handleDetailClick = (testResponseId: number) => {
    router.push(`/detailedAnalytics/${testResponseId}`);
  };

  return (
    <div className="w-full h-full space-y-10">
      {/* Page Header with Summary Stats */}
      <div className="w-full mx-auto">
        <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
            <StatCard
              icon={<ListChecks className="w-6 h-6 text-indigo-500" />}
              label="Total Tests Completed"
              value={summary?.testsCompleted ?? 0}
            />
            <StatCard
              icon={<BarChartBig className="w-6 h-6 text-green-500" />}
              label="Average Score"
              value={`${summary?.averageScore.toFixed(2) ?? "0"}`}
            />
            <StatCard
              icon={<Trophy className="w-6 h-6 text-yellow-500" />}
              label="Best Score"
              value={`${summary?.maxScore ?? 0}%`}
            />
          </div>
        </div>
      </div>

      {/* Test Details Cards */}
      <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {testDetails.length > 0 ? (
          testDetails.map((test) => (
            <div key={test.testResponseId}>
              <AnalyticCard
                id={test.testResponseId.toString()}
                name={test.testName}
                date={test.testDate}
                score={parseFloat(test.testScore)}
                totalMarks={100} // Assuming totalMarks fixed or else add to response/interface if available
                duration={`${test.completionTimeInMinutes} min`}
                onClick={() => handleDetailClick(test.testResponseId)}
              />
            </div>
          ))
        ) : (
          <p className="text-center col-span-full text-gray-400">
            No tests found
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md duration-200 ease-in-out px-6 py-1 flex items-center gap-5 min-w-[150px]">
      <div className="flex-shrink-0 rounded-full">{icon}</div>
      <div className="flex flex-col">
        <span className="text-xl font-bold text-gray-800">{value}</span>
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
    </div>
  );
}
