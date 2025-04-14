"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, BarChartBig, Trophy, ListChecks } from "lucide-react";
import AnalyticCard from "./components/AnalyticCard";

const mockTests = [
  {
    id: "1",
    name: "Aptitude Practice Test 1",
    date: "2025-03-15",
    score: 78,
    totalMarks: 100,
    duration: "60 mins",
  },
  {
    id: "2",
    name: "Logical Reasoning Test",
    date: "2025-03-20",
    score: 85,
    totalMarks: 100,
    duration: "45 mins",
  },
  {
    id: "3",
    name: "Quantitative Test 2",
    date: "2025-04-01",
    score: 66,
    totalMarks: 100,
    duration: "60 mins",
  },
  {
    id: "4",
    name: "Final Mock Test",
    date: "2025-04-10",
    score: 91,
    totalMarks: 100,
    duration: "90 mins",
  },
  {
    id: "5",
    name: "Final Mock Test",
    date: "2025-04-10",
    score: 91,
    totalMarks: 100,
    duration: "90 mins",
  },
];

export default function AnalyticsDashboard() {
  const [query] = useState("");

  const filteredTests = mockTests.filter((test) =>
    test.name.toLowerCase().includes(query.toLowerCase())
  );

  const totalTests = mockTests.length;
  const averageScore =
    mockTests.reduce((sum, test) => sum + test.score, 0) / totalTests;
  const bestScore = Math.max(...mockTests.map((t) => t.score));

  return (
    <div className="w-full h-full space-y-10">
      {/* Page Header */}
      <div className="w-full mx-auto">
        <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-5xl">
            <StatCard
              icon={<ListChecks className="w-6 h-6 text-indigo-500" />}
              label="Total Tests Taken"
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
      <div className="flex-shrink-0 p-3 bg-indigo-50 rounded-full">{icon}</div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-gray-800">{value}</span>
        <span className="mt-1 text-sm font-medium text-gray-500">{label}</span>
      </div>
    </div>
  );
}
