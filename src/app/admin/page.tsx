"use client";

import { JSX, useState } from "react";
import {
  UserCheck,
  ClipboardList,
  HelpCircle,
  Activity,
  BarChart2,
  PieChart as PieIcon,
  TrendingUp,
  ListChecks,
  PlusCircle,
  Edit2,
  CheckCircle,
  RotateCcw,
  LineChartIcon,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface StatCard {
  title: string;
  statistic: string | number;
  Icon: React.ComponentType<any>;
  color: string;
}

const statCards: StatCard[] = [
  {
    title: "Total Candidates",
    statistic: 128,
    Icon: UserCheck,
    color: "text-green-500 bg-green-100",
  },
  {
    title: "Total Tests",
    statistic: 42,
    Icon: ClipboardList,
    color: "text-blue-500 bg-blue-100",
  },
  {
    title: "Total Questions",
    statistic: 1200,
    Icon: HelpCircle,
    color: "text-yellow-500 bg-yellow-100",
  },
  {
    title: "Total Attempts",
    statistic: 576,
    Icon: Activity,
    color: "text-red-500 bg-red-100",
  },
  {
    title: "Avg. Score",
    statistic: "78%",
    Icon: TrendingUp,
    color: "text-indigo-500 bg-indigo-100",
  },
  {
    title: "Pass Rate",
    statistic: "65%",
    Icon: ListChecks,
    color: "text-teal-500 bg-teal-100",
  },
];

const candidateTrend = [
  { month: "Jan", count: 12 },
  { month: "Feb", count: 24 },
  { month: "Mar", count: 48 },
  { month: "Apr", count: 80 },
  { month: "May", count: 128 },
  { month: "Jun", count: 18 },
  { month: "Jul", count: 108 },
  { month: "Aug", count: 38 },
  { month: "Sep", count: 56 },
  { month: "Oct", count: 40 },
  { month: "Nov", count: 50 },
  { month: "Dec", count: 60 },
];

const testTrend = [
  { month: "Jan", tests: 4 },
  { month: "Feb", tests: 8 },
  { month: "Mar", tests: 16 },
  { month: "Apr", tests: 32 },
  { month: "May", tests: 42 },
];

const passFailData = [
  { name: "Passed", value: 375 },
  { name: "Failed", value: 201 },
];

const avgScoreTrend = [
  { month: "Jan", avg: 62 },
  { month: "Feb", avg: 68 },
  { month: "Mar", avg: 72 },
  { month: "Apr", avg: 75 },
  { month: "May", avg: 78 },
];

const recentActivity = [
  {
    time: "10:05 AM",
    desc: "Alice took Test C (82%)",
    icon: CheckCircle,
    color: "bg-green-100 text-green-600",
  },
  {
    time: "9:45 AM",
    desc: "New question added to Test B",
    icon: Edit2,
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    time: "9:30 AM",
    desc: "Bob registered",
    icon: PlusCircle,
    color: "bg-blue-100 text-blue-600",
  },
  {
    time: "9:15 AM",
    desc: "Charlie completed Test A (55%)",
    icon: CheckCircle,
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    time: "9:00 AM",
    desc: "Diana in progress",
    icon: RotateCcw,
    color: "bg-purple-100 text-purple-600",
  },
];

const TABS = [
  { key: "candidates", label: "Candidate Growth", Icon: BarChart2 },
  { key: "tests", label: "Test Creation", Icon: LineChartIcon },
  { key: "passFail", label: "Pass/Fail Rate", Icon: PieIcon },
  { key: "avgScore", label: "Avg. Score Trend", Icon: TrendingUp },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<string>("candidates");
  const COLORS = ["#10B981", "#EF4444"];

  let chartElement: JSX.Element = <></>;
  switch (activeTab) {
    case "candidates":
      chartElement = (
        <BarChart data={candidateTrend}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#3B82F6" barSize={64} />
        </BarChart>
      );
      break;
    case "tests":
      chartElement = (
        <LineChart data={testTrend}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="tests"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      );
      break;
    case "passFail":
      chartElement = (
        <PieChart>
          <Pie
            data={passFailData}
            dataKey="value"
            nameKey="name"
            innerRadius={"50%"}
            outerRadius={"100%"}
            label
          >
            {passFailData.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Legend verticalAlign="bottom" height={36} />
          <Tooltip />
        </PieChart>
      );
      break;
    case "avgScore":
      chartElement = (
        <AreaChart
          data={avgScoreTrend}
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="avg"
            stroke="#6366F1"
            strokeWidth={2}
            fill="url(#colorAvg)"
          />
        </AreaChart>
      );
      break;
  }

  return (
    <div className="w-full h-full flex flex-col gap-4 p-6 bg-gray-50">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {statCards.map(({ title, statistic, Icon, color }) => (
          <div
            key={title}
            className="flex items-center p-4 bg-white rounded-xl shadow-lg"
          >
            <div className={`p-3 rounded-full ${color} mr-4`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
              <p className="text-2xl font-bold text-gray-900">{statistic}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Recent Activity */}
      <div className="w-full h-full flex flex-col md:flex md:flex-row gap-4">
        {/* Charts Panel */}
        <div className="w-full h-96 md:w-3/4 md:h-full col-span-1 lg:col-span-2 bg-white rounded-xl shadow-lg p-4 flex flex-col">
          {/* Tabs (horizontal scroll on small) */}
          <div className="flex overflow-x-auto space-x-4 border-b border-gray-200 pb-2">
            {TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center space-x-2 px-4 py-2 transition rounded-md cursor-pointer whitespace-nowrap ${
                  activeTab === key
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-700 hover:bg-indigo-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Main Chart */}
          <div className="w-full h-96 md:h-full pt-4">
            <ResponsiveContainer width="100%" height="90%">
              {chartElement}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="w-full md:w-1/4 h-full bg-white rounded-xl shadow-lg p-4 flex flex-col">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Recent Activity
          </h3>
          <ul className="space-y-3 overflow-auto">
            {recentActivity.map(({ time, desc, icon: Icon, color }, idx) => (
              <li
                key={idx}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 transition"
              >
                <div className={`p-2 rounded-full ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-700">{desc}</p>
                  <span className="text-xs text-gray-500">{time}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
