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

const mockData = {
  totalExams: 24,
  averageScore: 78,
  bestSubject: "Quantitative Aptitude",
  examsThisWeek: 3,
};

const scoreTrend = [
  { name: "Week 1", score: 65 },
  { name: "Week 2", score: 70 },
  { name: "Week 3", score: 75 },
  { name: "Week 4", score: 80 },
];

const subjectPerformance = [
  { subject: "Quant", score: 85 },
  { subject: "Logic", score: 72 },
  { subject: "English", score: 79 },
  { subject: "GK", score: 64 },
];

export default function UserLandingPage() {
  const [user, setUser] = useState<string>();

  const fetchUserName = async () => {
    const res = await getUserAction();
    if (res) setUser(res);
  };

  useEffect(() => {
    fetchUserName();
  }, []);

  return (
    <main className="h-fit">
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900">Welcome, {user} 👋</h1>
        <p className="text-gray-600 mt-2 text-lg">
          Review your progress and continue sharpening your exam skills.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-md border border-gray-300">
          <div className="flex items-center">
            <ClipboardList className="text-blue-500" size={28} />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Exams Taken</p>
              <p className="text-2xl font-semibold text-gray-800">
                {mockData.totalExams}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-md border border-gray-300">
          <div className="flex items-center">
            <Award className="text-yellow-500" size={28} />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Average Score</p>
              <p className="text-2xl font-semibold text-gray-800">
                {mockData.averageScore}%
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-md border border-gray-300">
          <div className="flex items-center">
            <UserCheck className="text-green-500" size={28} />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Best Subject</p>
              <p className="text-2xl font-semibold text-gray-800">
                {mockData.bestSubject}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-md border border-gray-300">
          <div className="flex items-center">
            <Calendar className="text-indigo-500" size={28} />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Exams This Week</p>
              <p className="text-2xl font-semibold text-gray-800">
                {mockData.examsThisWeek}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-5 rounded-xl shadow-md border border-gray-300">
          <div className="flex items-center mb-4">
            <TrendingUp className="text-purple-600" size={24} />
            <h2 className="text-lg font-semibold text-gray-800 ml-2">
              Score Progress (Last 4 Weeks)
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={scoreTrend}>
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

        <div className="bg-white p-5 rounded-xl shadow-md border border-gray-300">
          <div className="flex items-center mb-4">
            <BookOpen className="text-emerald-600" size={24} />
            <h2 className="text-lg font-semibold text-gray-800 ml-2">
              Subject-wise Performance
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={subjectPerformance}>
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
