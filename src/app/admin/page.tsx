"use client";

import { JSX, useEffect, useState } from "react";
import {
  UserCheck,
  ClipboardList,
  HelpCircle,
  Activity,
  BarChart2,
  CheckCircle,
  Edit2,
  PlusCircle,
  RotateCcw,
  User,
  Info,
  Edit,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { fetchAdminAnalyticsAction } from "../actions/admin/dashboard/getAdminDashboardAnalytics";
import {
  AdminDashboardAnallyticsResponse,
  AdminDashboardRecentActivitiesResponse,
} from "@/utils/api/types";
import toast from "react-hot-toast";
import { fetchAdminDashboardRecentActivititesAction } from "../actions/admin/dashboard/getAdminDashboardRecentActivities";

interface StatCard {
  title: string;
  statistic: string | number;
  Icon: React.ComponentType<any>;
  color: string;
}

const TABS = [
  { key: "candidates", label: "Candidates", Icon: BarChart2 },
  { key: "questions", label: "Questions", Icon: BarChart2 },
  { key: "tests", label: "Tests", Icon: BarChart2 },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<string>("candidates");
  const [data, setData] = useState<
    AdminDashboardAnallyticsResponse | undefined
  >();
  const [recentActivities, setRecentActivities] =
    useState<AdminDashboardRecentActivitiesResponse[]>();

  const statCards: StatCard[] = [
    {
      title: "Total Candidates",
      statistic: data?.totalcandidates ?? 0,
      Icon: UserCheck,
      color: "text-green-500 bg-green-100",
    },
    {
      title: "Total Tests",
      statistic: data?.totaltest ?? 0,
      Icon: ClipboardList,
      color: "text-blue-500 bg-blue-100",
    },
    {
      title: "Total Questions",
      statistic: data?.totalquestions ?? 0,
      Icon: HelpCircle,
      color: "text-yellow-500 bg-yellow-100",
    },
  ];

  // Transform graph data to recharts compatible format with short month labels
  const transformGraphData = (
    graphData?: { count: number; monthYear: string }[]
  ): { month: string; count: number }[] => {
    if (!graphData) return [];
    return graphData.map(({ count, monthYear }) => {
      const dateParts = monthYear.split("-");
      const monthNum = parseInt(dateParts[1], 10);
      const monthShort =
        [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ][monthNum - 1] ?? monthYear;
      return { month: monthShort, count };
    });
  };

  const fetchAdminAnalyticsData = async () => {
    const res = await fetchAdminAnalyticsAction();

    if (res.status === 200) {
      setData(res.data);
    } else {
      toast.error("Something Went Wrong");
    }
  };

  const fetchRecentActivities = async () => {
    const res = await fetchAdminDashboardRecentActivititesAction();
    if (res && typeof res.status !== "undefined" && res.status === 200) {
      setRecentActivities(res.data);
    } else {
      toast.error("Something Went Wrong");
    }
  };

  useEffect(() => {
    fetchAdminAnalyticsData();
    fetchRecentActivities();
  }, []);

  useEffect(() => {
    setInterval(() => {
      fetchRecentActivities();
    }, 300000);
  }, []);

  let chartElement: JSX.Element = <></>;

  switch (activeTab) {
    case "candidates":
      chartElement = (
        <BarChart data={transformGraphData(data?.candidatesGraph)}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#3B82F6" barSize={64}>
            <LabelList dataKey="count" position="top" />
          </Bar>
        </BarChart>
      );
      break;

    case "tests":
      chartElement = (
        <BarChart data={transformGraphData(data?.testsGraph)}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#3B82F6" barSize={64}>
            <LabelList dataKey="count" position="top" />
          </Bar>
        </BarChart>
      );
      break;

    case "questions":
      chartElement = (
        <BarChart data={transformGraphData(data?.questionsGraph)}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#3B82F6" barSize={64}>
            <LabelList dataKey="count" position="top" />
          </Bar>
        </BarChart>
      );
      break;

    case "attempts":
      chartElement = (
        <BarChart data={transformGraphData(data?.attemptsGraph)}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#3B82F6" barSize={64}>
            <LabelList dataKey="count" position="top" />
          </Bar>
        </BarChart>
      );
      break;
  }

  return (
    <div className="w-full h-full flex gap-4 p-4 bg-gray-50">
      <div className="w-3/4 flex flex-col gap-5">
        {/* Stat Cards */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {statCards.map(({ title, statistic, Icon, color }) => (
            <div
              key={title}
              className="flex items-center p-4 bg-white rounded-md shadow-md border border-gray-300"
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
          <div className="w-full h-96 md:h-full col-span-1 lg:col-span-2 bg-white rounded-md border border-gray-300 shadow-md p-4 flex flex-col">
            {/* Tabs (horizontal scroll on small) */}
            <div className="flex overflow-x-auto space-x-4 border-b border-gray-300 pb-2">
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
        </div>
      </div>

      {/* Recent Activity */}
      <div className="w-full md:w-1/4 h-full overflow-y-auto bg-white rounded-md border border-gray-300 shadow-md p-4 flex flex-col">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Recent Activity
        </h3>
        <ul className="space-y-3 overflow-auto">
          {recentActivities?.map((activity, idx) => (
            <li
              key={idx}
              className="flex items-center space-x-3 p-2 rounded-md transition border border-gray-300 shadow-md"
            >
              {/* <div className={`p-2 rounded-full ${color}`}>
                  <Icon className="w-5 h-5" />
                </div> */}
              <div className="flex items-center gap-2">
                {activity.type === "candidate" ? (
                  <div className="p-2 w-fit rounded-full bg-indigo-300/20 text-indigo-600">
                    <User className="w-4 h-4" />
                  </div>
                ) : activity.type === "question" ? (
                  <div className="p-2 w-fit rounded-full bg-blue-300/20 text-blue-600">
                    <Info className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="p-2 w-fit rounded-full bg-yellow-300/20 text-yellow-600">
                    <Edit className="w-4 h-4" />
                  </div>
                )}
                <p className="text-sm text-gray-700">{activity.activity}</p>
                {/* <span className="text-xs text-gray-500">{time}</span> */}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
