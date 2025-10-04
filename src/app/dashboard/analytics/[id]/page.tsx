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
} from "recharts";
import {
  Calendar,
  Clock,
  ClipboardList,
  ArrowLeft,
  Award,
  PieChart as PieIcon,
  BarChart4,
  Gauge,
  Timer,
  CheckCircle,
  XCircle,
  HelpCircle,
  Target,
  ArrowBigUp,
  TypeOutline,
} from "lucide-react";
import Link from "next/link";
import formatToDDMMYYYY_HHMM, {
  formatMinutesToHourMinute,
} from "@/utils/formatIsoTime";
import Loader from "@/components/Loader";
import { fetchAnalyticsAction } from "@/app/actions/dashboard/analytics/analytics";
import { fetchAnalyticsDetailsHeaderAction } from "@/app/actions/dashboard/analytics/analyticsDetailHeader";
import {
  CandidateAnalyticsReportHeaderResponse,
  CandidateAnalyticsReportSectionResponse,
} from "@/utils/api/types";
import { fetchAnalyticsDetailsSectionAction } from "@/app/actions/dashboard/analytics/analyticsDetailSection";

const COLORS = ["#4CAF50", "#F44336", "#FF9800", "#9E9E9E"];

export default function TestDetailsPage() {
  const [loaded, setLoaded] = useState<boolean>(false);
  const { id } = useParams();
  const [testMeta, setTestMeta] =
    useState<CandidateAnalyticsReportHeaderResponse>();
  const [sectionData, setSectionData] =
    useState<CandidateAnalyticsReportSectionResponse[]>();

  const fetchData = async () => {
    const detailsRes = await fetchAnalyticsDetailsHeaderAction(Number(id));
    if (detailsRes.status === 200) {
      const detailsData: CandidateAnalyticsReportHeaderResponse =
        detailsRes.data!;
      setTestMeta(detailsData!);
      setLoaded(true);
    }
  };

  const fetchSectionData = async () => {
    const detailsRes = await fetchAnalyticsDetailsSectionAction(Number(id));
    if (detailsRes.status === 200) {
      const detailsData: CandidateAnalyticsReportSectionResponse[] =
        detailsRes.data!;
      setSectionData(detailsData!);
      setLoaded(true);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
      fetchSectionData();
    }
  }, [id]);

  // Prepare data for section-wise charts and KPIs
  const sectionMarksData =
    sectionData?.map((section) => ({
      name: section.testSectionName,
      marks: section.sectionMyMarks,
      totalMarks: section.totalSectionMarks,
    })) || [];

  const sectionAnswerDistData =
    sectionData?.map((section) => ({
      name: section.testSectionName,
      Correct: section.correctAnswersCount,
      Incorrect: section.inCorrectAnswersCount,
      Unanswered: section.sectionUnansweredCount,
    })) || [];

  // Flatten for Pie charts per section (will display one Pie per section)
  // Instead of multiple Pie charts, create a stacked bar chart for answers per section
  // For KPIs: section score percentage, correct %, time spent

  if (!loaded) {
    return <Loader />;
  }

  return (
    <div className="h-full w-full">
      <div className="w-full mx-auto px-4 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="flex items-start gap-4">
            <Link href="/dashboard/analytics" className="mt-1">
              <ArrowLeft className="w-8 h-8 hover:text-indigo-800 transition-colors" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                {testMeta?.testName}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <div className="flex items-center gap-1 bg-indigo-50 px-3 py-1 rounded-full">
                  <TypeOutline className="text-indigo-600 w-4 h-4" />
                  <span className="text-sm text-indigo-700 font-medium">
                    Type: {testMeta?.testType}
                  </span>
                </div>{" "}
                <div className="flex items-center gap-1 bg-indigo-50 px-3 py-1 rounded-full">
                  <Calendar className="text-indigo-600 w-4 h-4" />
                  <span className="text-sm text-indigo-700 font-medium">
                    Date: {formatToDDMMYYYY_HHMM(testMeta?.testStartDate!)}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-indigo-50 px-3 py-1 rounded-full">
                  <Clock className="text-indigo-600 w-4 h-4" />
                  <span className="text-sm text-indigo-700 font-medium">
                    Test Duration:{" "}
                    {formatMinutesToHourMinute(testMeta?.testDurationMinutes!)}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-indigo-50 px-3 py-1 rounded-full">
                  <Award className="text-indigo-600 w-4 h-4" />
                  <span className="text-sm text-indigo-700 font-medium">
                    Rank: {testMeta?.testRank}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-indigo-50 px-3 py-1 rounded-full">
                  <ArrowBigUp className="text-indigo-600 w-4 h-4" />
                  <span className="text-sm text-indigo-700 font-medium">
                    Test Top Score: {testMeta?.testTopMarks}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start">
            <div className="text-6xl font-bold text-gray-800">
              {testMeta?.myMarks}
              <span className="text-2xl">/{testMeta?.totalMarks}</span>
            </div>
            <div className="text-sm font-bold text-gray-500">My Score</div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          <MetricCard
            icon={<ClipboardList className="w-5 h-5" />}
            title="Total Questions"
            value={testMeta?.totalQuestions!}
            description="Test Questions"
            color="bg-blue-100 text-blue-600"
          />

          <MetricCard
            icon={<CheckCircle className="w-5 h-5" />}
            title="Correct Answers"
            value={testMeta?.testCorrectAnswerCount!}
            description="Right Responses"
            color="bg-green-100 text-green-600"
          />

          <MetricCard
            icon={<XCircle className="w-5 h-5" />}
            title="Incorrect Answers"
            value={testMeta?.testInCorrectAnswerCount!}
            description="Wrong Responses"
            color="bg-red-100 text-red-600"
          />

          <MetricCard
            icon={<HelpCircle className="w-5 h-5" />}
            title="Unanswered"
            value={testMeta?.unAnswered!}
            description="No Responses"
            color="bg-amber-100 text-amber-600"
          />
        </div>

        {/* Answer Distribution Pie */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Answer Distribution"
            icon={<PieIcon className="w-5 h-5" />}
            description="Breakdown of correct, incorrect, and unanswered questions"
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    {
                      name: "Correct",
                      value: testMeta?.testCorrectAnswerCount,
                      color: COLORS[0],
                    },
                    {
                      name: "Incorrect",
                      value: testMeta?.testInCorrectAnswerCount,
                      color: COLORS[1],
                    },
                    {
                      name: "Unanswered",
                      value: testMeta?.unAnswered,
                      color: COLORS[2],
                    },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {[
                    {
                      name: "Correct",
                      value: testMeta?.testCorrectAnswerCount,
                      color: COLORS[0],
                    },
                    {
                      name: "Incorrect",
                      value: testMeta?.testInCorrectAnswerCount,
                      color: COLORS[1],
                    },
                    {
                      name: "Unanswered",
                      value: testMeta?.unAnswered,
                      color: COLORS[2],
                    },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} questions`, "Count"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Marks Distribution */}
          <ChartCard
            title="Marks Distribution"
            icon={<BarChart4 className="w-5 h-5" />}
            description="Earned vs missed marks comparison"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  {
                    name: "Correct Marks",
                    value: testMeta?.myMarks,
                    color: "#4CAF50",
                  },
                  {
                    name: "Missed Marks",
                    value:
                      (testMeta?.totalMarks || 0) - (testMeta?.myMarks || 0),
                    color: "#F44336",
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" name="Marks">
                  {[
                    {
                      name: "Correct Marks",
                      value: testMeta?.myMarks,
                      color: "#4CAF50",
                    },
                    {
                      name: "Missed Marks",
                      value:
                        (testMeta?.totalMarks || 0) - (testMeta?.myMarks || 0),
                      color: "#F44336",
                    },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Time Analysis Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <MetricCard
            icon={<Timer className="w-5 h-5" />}
            title="Time Spent"
            value={formatMinutesToHourMinute(testMeta!.completionTimeInMinutes)}
            description={`${(
              (testMeta!.completionTimeInMinutes /
                testMeta!.testDurationMinutes) *
              100
            ).toFixed(1)}% of total duration`}
            color="bg-cyan-100 text-cyan-600"
          />

          <MetricCard
            icon={<Gauge className="w-5 h-5" />}
            title="Avg. Time/Question"
            value={formatMinutesToHourMinute(testMeta!.averageTimePerQuestion)}
            description="Across answered questions"
            color="bg-orange-100 text-orange-600"
          />

          <MetricCard
            icon={<Target className="w-5 h-5" />}
            title="Efficiency Ratio"
            value={(
              testMeta!.testCorrectAnswerCount /
              testMeta!.completionTimeInMinutes
            ).toFixed(1)}
            description="Score vs Time spent"
            color="bg-pink-100 text-pink-600"
          />
        </div>

        <div
          className="grid grid-cols-2 gap-4"
          style={{ gridAutoRows: "1fr", minHeight: 320 }}
        >
          {/* Overall Time Spent per Section Pie Chart */}
          <ChartCard
            title="Time Spent per Section"
            icon={<Timer className="w-5 h-5" />}
            description="Proportion of total time spent in each section"
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={
                    sectionData?.map((section, index) => ({
                      name: section.testSectionName,
                      value: section.sectionTimeDuration,
                      color: COLORS[index % COLORS.length],
                    })) || []
                  }
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {sectionData?.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} mins`, "Time"]} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Percentage Marks Scored per Section */}
          <ChartCard
            title="Marks Scored per Section"
            icon={<BarChart4 className="w-5 h-5" />}
            description="Marks scored as % of total marks per section"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={
                  sectionData?.map((section) => ({
                    name: section.testSectionName,
                    marks: section.sectionMyMarks,
                  })) || []
                }
                layout="vertical"
                margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Bar dataKey="marks" fill="#4CAF50" name="Marks Scored" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Answer Distribution per Section */}
          <ChartCard
            title="Answer Distribution per Section"
            icon={<PieIcon className="w-5 h-5" />}
            description="Correct, incorrect, and unanswered counts per section"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={
                  sectionData?.map((section) => ({
                    name: section.testSectionName,
                    Correct: section.correctAnswersCount,
                    Incorrect: section.inCorrectAnswersCount,
                    Unanswered: section.sectionUnansweredCount,
                  })) || []
                }
                layout="vertical"
                margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Legend />
                <Bar stackId="a" dataKey="Correct" fill="#4CAF50" />
                <Bar stackId="a" dataKey="Incorrect" fill="#F44336" />
                <Bar stackId="a" dataKey="Unanswered" fill="#FF9800" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Time Spent (mins) per Section */}
          <ChartCard
            title="Time Spent (mins) per Section"
            icon={<Timer className="w-5 h-5" />}
            description="Time spent on each section"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={
                  sectionData?.map((section) => ({
                    name: section.testSectionName,
                    time: section.sectionTimeDuration,
                  })) || []
                }
                layout="vertical"
                margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip formatter={(value: number) => `${value} mins`} />
                <Bar dataKey="time" fill="#2196F3" name="Time Spent (mins)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

// Component for metric cards
const MetricCard = ({
  icon,
  title,
  value,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  description: string;
  color: string;
}) => (
  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 transition-all">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
    </div>
    <p className="text-xs text-gray-500 font-bold mt-3">{description}</p>
  </div>
);

// Component for chart cards
const ChartCard = ({
  title,
  icon,
  description,
  children,
  fullWidth = false,
}: {
  title: string;
  icon: React.ReactNode;
  description: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}) => (
  <div
    className={`bg-white rounded-xl shadow-md border border-gray-200 p-5 h-full ${
      fullWidth ? "col-span-1 lg:col-span-2" : ""
    }`}
  >
    <div className="flex items-center gap-2 mb-5">
      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
    <div className="h-fit">{children}</div>
  </div>
);
