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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  ZAxis,
} from "recharts";
import {
  Calendar,
  Clock,
  BarChart2,
  ClipboardList,
  TrendingUp,
  ArrowLeft,
  Award,
  Zap,
  BookOpen,
  PieChart as PieIcon,
  BarChart4,
  Activity,
  Gauge,
  Timer,
  CheckCircle,
  XCircle,
  HelpCircle,
  Target,
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
  userRank: number;
  totalParticipants: number;
  averageTimeByOthers: string;
  averageTimeByUser: string;
  percentile: number;
  sections: {
    name: string;
    correct: number;
    incorrect: number;
    unanswered: number;
    maxMarks: number;
    marksObtained: number;
    timeSpent: string;
  }[];
  scoreBreakdown: {
    questionsAttempted: number;
    correctAnswers: number;
    incorrectAnswers: number;
    unanswered: number;
    score: number;
    timeSpent: string;
    marksPerCategory: {
      name: string;
      marks: number;
    }[];
  };
  analytics: { date: string; score: number }[];
  timeDistribution: {
    name: string;
    time: number;
  }[];
  rankDistribution: {
    score: number;
    count: number;
  }[];
  questionAnalysis: {
    questionNumber: number;
    timeSpent: number;
    correct: boolean;
    marks: number;
  }[];
}

const COLORS = ["#4CAF50", "#F44336", "#FF9800", "#9E9E9E"];
const SECTION_COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#a4de6c"];

// Helper to convert time string to minutes
const timeStringToMinutes = (timeStr: string) => {
  const [hours, minutes, seconds] = timeStr.split(":").map(Number);
  return hours * 60 + minutes + seconds / 60;
};

// Helper to format minutes for display
const formatMinutes = (minutes: number) => {
  const hrs = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  const secs = Math.round((minutes * 60) % 60);

  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
};

export default function TestDetailsPage() {
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

  if (!testDetails) return <Loader />;

  const {
    name,
    score,
    totalMarks,
    date,
    duration,
    userRank,
    totalParticipants,
    percentile,
    sections,
    scoreBreakdown,
    analytics,
    timeDistribution,
    rankDistribution,
    questionAnalysis,
  } = testDetails;

  const percentageScore = ((score / totalMarks) * 100).toFixed(2);
  const accuracy =
    scoreBreakdown.correctAnswers > 0
      ? (
          (scoreBreakdown.correctAnswers / scoreBreakdown.questionsAttempted) *
          100
        ).toFixed(2)
      : "0";

  // Time calculations
  const totalTimeSpentMinutes = timeStringToMinutes(scoreBreakdown.timeSpent);
  const avgTimePerQuestion =
    totalTimeSpentMinutes /
    (scoreBreakdown.correctAnswers + scoreBreakdown.incorrectAnswers);
  const efficiencyRatio =
    score /
    totalMarks /
    (totalTimeSpentMinutes / timeStringToMinutes(duration));

  // Data for charts
  const answerDistribution = [
    { name: "Correct", value: scoreBreakdown.correctAnswers, color: COLORS[0] },
    {
      name: "Incorrect",
      value: scoreBreakdown.incorrectAnswers,
      color: COLORS[1],
    },
    { name: "Unanswered", value: scoreBreakdown.unanswered, color: COLORS[2] },
  ];

  const marksDistribution = [
    { name: "Earned", value: score, color: "#4CAF50" },
    { name: "Missed", value: totalMarks - score, color: "#F44336" },
  ];

  const timeAnalysis = [
    {
      name: "Time Spent",
      time: totalTimeSpentMinutes,
    },
    {
      name: "Avg. Time/Question",
      time: avgTimePerQuestion,
    },
  ];

  const sectionData = sections.map((section, index) => ({
    subject: section.name,
    A: section.marksObtained,
    fullMark: section.maxMarks,
    color: SECTION_COLORS[index % SECTION_COLORS.length],
  }));

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
                {name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <div className="flex items-center gap-1 bg-indigo-50 px-3 py-1 rounded-full">
                  <Calendar className="text-indigo-600 w-4 h-4" />
                  <span className="text-sm text-indigo-700 font-medium">
                    {formatToDDMMYYYY_HHMM(date)}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-indigo-50 px-3 py-1 rounded-full">
                  <Clock className="text-indigo-600 w-4 h-4" />
                  <span className="text-sm text-indigo-700 font-medium">
                    {duration}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-indigo-50 px-3 py-1 rounded-full">
                  <Award className="text-indigo-600 w-4 h-4" />
                  <span className="text-sm text-indigo-700 font-medium">
                    Rank: {userRank}/{totalParticipants}
                    <span className="ml-1">(Top {percentile}%)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start">
            <div className="text-6xl font-bold text-gray-800">
              {score}
              <span className="text-2xl">/{totalMarks}</span>
            </div>
            <div className="text-sm font-bold text-gray-500">Overall Score</div>
          </div>

          {/* <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-1 h-fit shadow-lg">
            <div className="bg-white rounded-lg py-1 px-4 flex items-center">
              <div className="flex flex-col">
                <div className="text-sm font-bold text-gray-500">
                  Overall Score
                </div>
                <div className="flex items-end gap-2">
                  <div className="text-2xl font-bold text-gray-800">
                    {score}
                    <span className="text-lg">/{totalMarks}</span>
                  </div>
                </div>
              </div>
            </div>
          </div> */}
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          <MetricCard
            icon={<ClipboardList className="w-5 h-5" />}
            title="Questions Attempted"
            value={scoreBreakdown.questionsAttempted}
            description={`out of ${
              scoreBreakdown.correctAnswers +
              scoreBreakdown.incorrectAnswers +
              scoreBreakdown.unanswered
            }`}
            color="bg-blue-100 text-blue-600"
          />

          <MetricCard
            icon={<CheckCircle className="w-5 h-5" />}
            title="Correct Answers"
            value={scoreBreakdown.correctAnswers}
            description={`+${score} marks`}
            color="bg-green-100 text-green-600"
          />

          <MetricCard
            icon={<XCircle className="w-5 h-5" />}
            title="Incorrect Answers"
            value={scoreBreakdown.incorrectAnswers}
            description="Negative marking"
            color="bg-red-100 text-red-600"
          />

          <MetricCard
            icon={<HelpCircle className="w-5 h-5" />}
            title="Unanswered"
            value={scoreBreakdown.unanswered}
            description="Potential marks"
            color="bg-amber-100 text-amber-600"
          />

          <MetricCard
            icon={<Zap className="w-5 h-5" />}
            title="Accuracy"
            value={`${accuracy}%`}
            description="Based on attempts"
            color="bg-purple-100 text-purple-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Answer Distribution Pie */}
          <ChartCard
            title="Answer Distribution"
            icon={<PieIcon className="w-5 h-5" />}
            description="Breakdown of correct, incorrect, and unanswered questions"
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={answerDistribution}
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
                  {answerDistribution.map((entry, index) => (
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
              <BarChart data={marksDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" name="Marks">
                  {marksDistribution.map((entry, index) => (
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
            value={formatMinutes(totalTimeSpentMinutes)}
            description={`${(
              (totalTimeSpentMinutes / timeStringToMinutes(duration)) *
              100
            ).toFixed(1)}% of total duration`}
            color="bg-cyan-100 text-cyan-600"
          />

          <MetricCard
            icon={<Gauge className="w-5 h-5" />}
            title="Avg. Time/Question"
            value={formatMinutes(avgTimePerQuestion)}
            description="Across answered questions"
            color="bg-orange-100 text-orange-600"
          />

          <MetricCard
            icon={<Target className="w-5 h-5" />}
            title="Efficiency Ratio"
            value={efficiencyRatio.toFixed(2)}
            description="Score vs Time spent"
            color="bg-pink-100 text-pink-600"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section-wise Performance */}
          <ChartCard
            title="Section-wise Performance"
            icon={<BookOpen className="w-5 h-5" />}
            description="Marks obtained per section"
          >
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="80%"
                data={sectionData}
              >
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, "dataMax + 5"]} />
                <Radar
                  name="Marks"
                  dataKey="A"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Time Distribution */}
          <ChartCard
            title="Time Distribution"
            icon={<Activity className="w-5 h-5" />}
            description="Time spent on different question types"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis
                  tickFormatter={(value) => formatMinutes(value)}
                  label={{
                    value: "Time (min)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip
                  formatter={(value) => [formatMinutes(Number(value)), "Time"]}
                />
                <Bar dataKey="time" name="Time" fill="#4CAF50" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Progress Over Time */}
          <ChartCard
            title="Progress Over Time"
            icon={<TrendingUp className="w-5 h-5" />}
            description="Historical performance trend"
            fullWidth
          >
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={analytics}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" />
                <YAxis domain={[0, totalMarks]} />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip
                  formatter={(value) => [`${value}/${totalMarks}`, "Score"]}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#8884d8"
                  fillOpacity={1}
                  fill="url(#colorScore)"
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#ff7300"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Rank Distribution */}
          <ChartCard
            title="Rank Distribution"
            icon={<BarChart2 className="w-5 h-5" />}
            description="Score distribution among participants"
            fullWidth
          >
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={rankDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="score" />
                <YAxis
                  label={{
                    value: "Participants",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip />
                <Bar dataKey="count" name="Participants" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Question Analysis */}
          <ChartCard
            title="Question Analysis"
            icon={<ClipboardList className="w-5 h-5" />}
            description="Time spent vs correctness per question"
            fullWidth
          >
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="questionNumber"
                  name="Question No."
                  label={{
                    value: "Question Number",
                    position: "insideBottom",
                    offset: -5,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="timeSpent"
                  name="Time (sec)"
                  label={{
                    value: "Time Spent (seconds)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                {/* <ZAxis
                  type="number"
                  dataKey="marks"
                  name="Marks"
                  range={[50, 500]}
                /> */}
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(value, name) => {
                    if (name === "correct")
                      return value ? "Correct" : "Incorrect";
                    return [value, name === "timeSpent" ? "seconds" : name];
                  }}
                />
                {/* <Legend /> */}
                <Scatter
                  name="Correct"
                  data={questionAnalysis.filter((q) => q.correct)}
                  fill="#4CAF50"
                  shape="circle"
                />
                <Scatter
                  name="Incorrect"
                  data={questionAnalysis.filter((q) => !q.correct)}
                  fill="#F44336"
                  shape="circle"
                />
              </ScatterChart>
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
    className={`bg-white rounded-xl shadow-md border border-gray-200 p-5 h-fit ${
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
