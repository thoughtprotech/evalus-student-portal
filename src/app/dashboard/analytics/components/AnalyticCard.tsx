import formatToDDMMYYYY_HHMM from "@/utils/formatIsoTime";
import { Calendar, Timer, BarChart2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface AnalyticCardProps {
  id: string;
  name: string;
  date: string;
  score: number;
  totalMarks: number;
  duration: string;
  onClick?: () => void; // Add onClick as an optional prop
}

export default function AnalyticCard({
  id,
  name,
  date,
  score,
  totalMarks,
  duration,
  onClick, // Destructure onClick
}: AnalyticCardProps) {
  const percentage = ((score / totalMarks) * 100).toFixed(1);

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl p-4 shadow-md flex flex-col h-full"
      onClick={onClick} // Optionally handle onClick on whole card if needed
    >
      {/* Title */}
      <h2 className="text-xl font-bold text-gray-900 truncate line-clamp-2">
        {name}
      </h2>

      {/* Date and Score */}
      <div className="mt-2 space-y-2 text-sm flex-grow">
        <div className="flex items-center gap-2 text-gray-500">
          <Calendar className="w-4 h-4 text-yellow-500" />
          <span>{formatToDDMMYYYY_HHMM(date)}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <BarChart2 className="w-4 h-4 text-green-500" />
          <span className="font-semibold">Score:</span> {score}/{totalMarks} (
          {percentage}%)
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Timer className="w-4 h-4 text-gray-500" />
          <span className="font-semibold">Completion Time:</span> {duration}
        </div>
      </div>

      {/* View Report Button */}
      <div className="pt-4">
        <Link href={`/dashboard/analytics/${id}`}>
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering card onClick if exists
              onClick?.();
            }}
            className="w-full py-2 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowRight className="w-5 h-5" />
            View Report
          </button>
        </Link>
      </div>
    </div>
  );
}
