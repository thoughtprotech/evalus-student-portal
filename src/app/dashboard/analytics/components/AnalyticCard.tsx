import { Calendar, Timer, BarChart2, ArrowRight, Hash, Percent } from "lucide-react";
import Link from "next/link";

interface AnalyticCardProps {
  id: number;
  name: string;
  date: string;
  testScore: string;
  completionTimeInMinutes: number;
  testRank: number;
  testPercentile: number;
  testResponseId: number;
}

export default function AnalyticCard({
  id,
  name,
  date,
  testScore,
  completionTimeInMinutes,
  testRank,
  testPercentile,
  testResponseId,
}: AnalyticCardProps) {
  return (
    <div
      className="bg-white border border-gray-100 rounded-lg p-5 shadow hover:shadow-lg transition flex flex-col h-full w-full"
    >
      {/* Name & Date */}
      <div className="mb-2">
        <h2 className="text-xl font-semibold text-gray-900 truncate">{name}</h2>
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
          <Calendar className="w-4 h-4 text-yellow-500" />
          <span>{date}</span>
        </div>
      </div>
      {/* Test Score */}
      <div className="flex items-center justify-between border-y border-gray-100 py-3 my-2">
        <span className="flex items-center gap-2 text-gray-700">
          <BarChart2 className="w-5 h-5 text-indigo-500" />
          <span className="text-base font-bold">{testScore}</span>
        </span>
      </div>
      {/* Metrics */}
      <div className="flex gap-3 justify-between py-2">
        <div className="flex flex-col items-center flex-1">
          <Timer className="w-4 h-4 text-green-500" />
          <span className="text-xs text-gray-400 mt-0.5">Completion Time</span>
          <span className="font-bold text-sm text-gray-800">{completionTimeInMinutes}</span>
        </div>
        <div className="flex flex-col items-center flex-1 border-x border-gray-100 px-2">
          <Hash className="w-4 h-4 text-blue-500" />
          <span className="text-xs text-gray-400 mt-0.5">Rank</span>
          <span className="font-bold text-sm text-gray-800">{testRank}</span>
        </div>
        <div className="flex flex-col items-center flex-1">
          <Percent className="w-4 h-4 text-indigo-500" />
          <span className="text-xs text-gray-400 mt-0.5">Percentile</span>
          <span className="font-bold text-sm text-gray-800">{testPercentile}</span>
        </div>
      </div>
      {/* Spacer */}
      <div className="flex-grow" />
      <div className="mt-4">
        <Link href={`/dashboard/analytics/${testResponseId}`}>
          <button
            className="w-full py-2 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 cursor-pointer"
            type="button"
          >
            <ArrowRight className="w-5 h-5" />
            View Report
          </button>
        </Link>
      </div>
    </div>
  );
}
