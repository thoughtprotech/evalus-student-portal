"use client";

import React, { useEffect, useState } from "react";
import {
  UserCheck,
  ClipboardList,
  Award,
  BarChart2,
  Calendar,
  TrendingUp,
  BookOpen,
  Clock3,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { getUserAction } from "../actions/getUser";
import { fetchDashboardAnalyticsAction } from "../actions/dashboard/landing";
import Loader from "@/components/Loader";

export default function UserLandingPage() {
  const [user, setUser] = useState<string>("");
  const [data, setData] = useState<any>({});
  const [loaded, setLoaded] = useState<boolean>(false);

  const fetchAnalytics = async () => {
    const { data, status } = await fetchDashboardAnalyticsAction();
    if (status === 200) {
      setData(data);
      setLoaded(true);
    }
  };

  const fetchUserName = async () => {
    const res = await getUserAction();
    if (res) setUser(res);
  };

  useEffect(() => {
    fetchUserName();
    fetchAnalytics();
  }, []);

  if (!loaded) {
    return <Loader />;
  }

  return (
    <main className="h-full">
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome Back, {user} 👋
        </h1>
        <p className="text-gray-600 mt-2 text-lg">
          Review your progress and continue sharpening your exam skills.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 transition-all">
          <div className="flex items-center">
            <ClipboardList className="text-blue-500" size={28} />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Exams Taken</p>
              <p className="text-2xl font-semibold text-gray-800">
                {data.totalExams}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 transition-all">
          <div className="flex items-center">
            <Award className="text-yellow-500" size={28} />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Average Score</p>
              <p className="text-2xl font-semibold text-gray-800">
                {data.averageScore}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 transition-all">
          <div className="flex items-center">
            <UserCheck className="text-green-500" size={28} />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Best Subject</p>
              <p className="text-2xl font-semibold text-gray-800">
                {data.bestSubject}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 transition-all">
          <div className="flex items-center">
            <Calendar className="text-indigo-500" size={28} />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Exams This Week</p>
              <p className="text-2xl font-semibold text-gray-800">
                {data.examsThisWeek}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 transition-all">
          <div className="flex items-center">
            <Clock3 className="text-pink-500" size={28} />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Avg. Time per Exam</p>
              <p className="text-2xl font-semibold text-gray-800">
                {data.avgTimePerExam}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 transition-all">
          <div className="flex items-center">
            <CheckCircle2 className="text-lime-600" size={28} />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Success Rate</p>
              <p className="text-2xl font-semibold text-gray-800">
                {data.successRate}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 transition-all">
          <div className="flex items-center mb-4">
            <TrendingUp className="text-purple-600" size={24} />
            <h2 className="text-lg font-semibold text-gray-800 ml-2">
              Score Progress (Last 4 Weeks)
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.scoreTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 transition-all">
          <div className="flex items-center mb-4">
            <BookOpen className="text-emerald-600" size={24} />
            <h2 className="text-lg font-semibold text-gray-800 ml-2">
              Subject-wise Performance
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.subjectPerformance || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="score" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </main>
  );
}
