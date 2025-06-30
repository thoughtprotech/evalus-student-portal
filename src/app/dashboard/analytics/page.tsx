"use client";

import { useEffect, useState } from "react";
import { BarChartBig, Trophy, ListChecks } from "lucide-react";
import AnalyticCard from "./components/AnalyticCard";
import Loader from "@/components/Loader";
import { fetchAnalyticsListAction } from "@/app/actions/dashboard/analyticsList";

export default function AnalyticsDashboard() {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [query] = useState("");
  const [mockTests, setMockTests] = useState<
    {
      id: string;
      name: string;
      date: string;
      score: number;
      totalMarks: number;
      duration: string;
    }[]
  >([]);

  const fetchMockTests = async () => {
    const res = await fetchAnalyticsListAction();
    const { data, status } = res;
    if (status) {
      setMockTests(data!);
      setLoaded(true);
    }
  };

  useEffect(() => {
    fetchMockTests();
  }, []);

  const filteredTests = mockTests.filter((test) =>
    test.name.toLowerCase().includes(query.toLowerCase())
  );

  const totalTests = mockTests.length;
  const averageScore =
    mockTests.reduce((sum, test) => sum + test.score, 0) / totalTests;
  const bestScore = Math.max(...mockTests.map((t) => t.score));

  if (!loaded) {
    return <Loader />;
  }

  return (
    <div className="w-full h-full space-y-10">
      {/* Page Header */}
      <div className="w-full mx-auto">
        <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
            <StatCard
              icon={<ListChecks className="w-6 h-6 text-indigo-500" />}
              label="Total Tests Completed"
              value={totalTests}
            />
            <StatCard
              icon={<BarChartBig className="w-6 h-6 text-green-500" />}
              label="Average Score"
              value={`${averageScore.toFixed(2)}%`}
            />
            <StatCard
              icon={<Trophy className="w-6 h-6 text-yellow-500" />}
              label="Best Score"
              value={`${bestScore}%`}
            />
          </div>
        </div>
      </div>

      {/* Test Cards */}
      <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredTests.length > 0 ? (
          filteredTests.map((test) => (
            <div key={test.id}>
              <AnalyticCard
                id={test.id}
                name={test.name}
                date={test.date}
                score={test.score}
                totalMarks={test.totalMarks}
                duration={test.duration}
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
    <div className="bg-white border border-gray-200 rounded-md shadow-md duration-200 ease-in-out px-6 py-2 flex items-center gap-5 min-w-[150px]">
      <div className="flex-shrink-0 rounded-full">{icon}</div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-gray-800">{value}</span>
        <span className="mt-1 text-sm font-medium text-gray-500">{label}</span>
      </div>
    </div>
  );
}
