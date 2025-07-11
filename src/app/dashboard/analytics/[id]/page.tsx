"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Calendar,
  Clock,
  BarChart2,
  ClipboardList,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import formatToDDMMYYYY_HHMM from "@/utils/formatIsoTime";
import {
  fetchAnalyticsAction,
  TestId,
} from "@/app/actions/dashboard/analytics";
import Loader from "@/components/Loader";

// Type definitions
interface TestDetails {
  name: string;
  score: number;
  totalMarks: number;
  date: string;
  duration: string;
  scoreBreakdown: {
    questionsAttempted: number;
    correctAnswers: number;
    incorrectAnswers: number;
    unanswered: number;
    score: number;
  };
  analytics: { date: string; score: number }[];
}

const COLORS = ["#4CAF50", "#F44336", "#FF9800", "#9E9E9E"];

export default function TestDetailsPage() {
  // Use useParams to obtain the route parameter.
  const [loaded, setLoaded] = useState<boolean>(false);

  const { id } = useParams();
  const [testDetails, setTestDetails] = useState<TestDetails | null>(null);

  const fetchAnalytics = async () => {
    const res = await fetchAnalyticsAction(id as TestId);
    const { data, status } = res;
    if (status === 200) {
      setTestDetails(data);
      setLoaded(true);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAnalytics();
    }
  }, [id]);

  if (!testDetails) return;

  const { name, score, totalMarks, date, duration, scoreBreakdown, analytics } =
    testDetails;

  const percentageScore = ((score / totalMarks) * 100).toFixed(2);
  const accuracy = (
    (scoreBreakdown.correctAnswers / scoreBreakdown.questionsAttempted) *
    100
  ).toFixed(2);

  const pieData = [
    { name: "Correct", value: scoreBreakdown.correctAnswers },
    { name: "Incorrect", value: scoreBreakdown.incorrectAnswers },
    { name: "Unanswered", value: scoreBreakdown.unanswered },
  ];

  const barData = [
    {
      name: "Score Summary",
      Score: score,
      Max: totalMarks,
    },
  ];

  if (!loaded) {
    return <Loader />;
  }

  return (
    <div className="h-full w-full">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="w-full flex flex-col lg:flex lg:flex-row justify-between lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div>
              <Link href="/dashboard/analytics">
                <ArrowLeft className="w-7 h-7 md:w-8 md:h-8" />
              </Link>
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-black">
                {name}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Clock className="text-gray-500 w-5 h-5" />
              <h1 className="text-gray-500 font-bold">{duration}</h1>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="text-gray-500 w-5 h-5" />
              <h1 className="text-gray-500 font-bold">
                {formatToDDMMYYYY_HHMM(date)}
              </h1>
            </div>
          </div>
        </div>

        {/* Overview Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Score Card */}
          <div className="bg-white shadow-md px-6 py-4 flex flex-col items-start justify-center rounded-xl border border-gray-300">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-500" />
              <p className="text-lg font-bold text-gray-500">Score</p>
            </div>
            <p className="text-2xl font-bold mt-2">
              {score}/{totalMarks} ({percentageScore}%)
            </p>
          </div>

          {/* Questions Attempted Card */}
          <div className="bg-white shadow-md px-6 py-4 flex flex-col items-start justify-center rounded-xl border border-gray-300 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-500" />
              <p className="text-lg font-bold text-gray-500">
                Questions Attempted
              </p>
            </div>
            <p className="text-2xl font-bold mt-2">
              {scoreBreakdown.questionsAttempted}
            </p>
          </div>

          {/* Accuracy Card */}
          <div className="bg-white shadow-md px-6 py-4 flex flex-col items-start justify-center rounded-xl border border-gray-300 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              <p className="text-lg font-bold text-gray-500">Accuracy</p>
            </div>
            <p className="text-2xl font-bold mt-2">{accuracy}%</p>
          </div>
        </div>

        {/* Pie + Bar Chart Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow-md p-6 rounded-xl border border-gray-300">
            <h3 className="text-lg font-semibold mb-4">Answer Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center mt-4">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center mx-2">
                  <div
                    className="w-3 h-3 rounded-full mr-1"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">
                    {entry.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white shadow-md p-6 rounded-xl border border-gray-300">
            <h3 className="text-lg font-semibold mb-4">Score Comparison</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Score" fill="#4CAF50" />
                <Bar dataKey="Max" fill="#432dd7" />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center mt-4">
              <div className="flex items-center mx-2">
                <div
                  className="w-3 h-3 rounded-full mr-1"
                  style={{ backgroundColor: "#4CAF50" }}
                ></div>
                <span className="text-sm font-medium text-gray-700">Score</span>
              </div>
              <div className="flex items-center mx-2">
                <div
                  className="w-3 h-3 rounded-full mr-1"
                  style={{ backgroundColor: "#432dd7" }}
                ></div>
                <span className="text-sm font-medium text-gray-700">Max</span>
              </div>
            </div>
          </div>
        </div>

        {/* Area + Line Chart Row */}
        <div className="bg-white shadow-md p-6 rounded-xl border border-gray-300">
          <h3 className="text-xl font-semibold mb-4">Progress Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#8884d8"
                fillOpacity={1}
                fill="url(#colorScore)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
