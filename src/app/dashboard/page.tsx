"use client";

import SearchBar from "@/components/SearchBar";
import { useEffect, useState } from "react";
import TestCards from "./components/TestCards";
import { Play, Clock, XCircle, CheckCircle, CircleArrowRight } from "lucide-react";
import { fetchCandidateTestList } from "../actions/dashboard/testList";
import Loader from "@/components/Loader";
import { GetCandidateTestResponse } from "@/utils/api/types";
import { useUser } from "@/contexts/UserContext";
import toast from "react-hot-toast";

export default function Index() {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [testList, setTestList] = useState<GetCandidateTestResponse[]>([]);

  const { username, setUsername, currentGroupId, setCurrentGroupId, groupSelected } =
    useUser();

  const tabs = ["Registered", "In Progress", "Up Next", "Completed", "Missed"];

  const fetchTestList = async () => {
    const res = await fetchCandidateTestList(
      Number(currentGroupId),
      { useGroupEndpoint: !!groupSelected }
    );
    const { data, status } = res;
    setLoaded(false);
    if (status === 200) {
      setTestList(data!);
      setLoaded(true);
    } else {
      toast.error("Something Went Wrong Fetching Tests");
      setLoaded(true);
    }
  };

  // Load the test list once on mount
  useEffect(() => {
    fetchTestList();
  }, [currentGroupId, groupSelected]);

  // Derive the filtered test list based on the current tab and search query
  const filteredTestList = testList?.filter(
    (test) =>
      test.testCandidateRegistrationStatus === tabs[currentTab] &&
      test.testName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Prepare tab card data including count and an appropriate icon
  const tabCardData = tabs.map((tab) => {
    let icon;
    switch (tab) {
      case "Registered":
        icon = <Play className="w-6 h-6 text-blue-500" />;
        break;
      case "In Progress":
        icon = <Clock className="w-6 h-6 text-yellow-500" />;
        break;
      case "Up Next":
        icon = <CircleArrowRight className="w-6 h-6 text-purple-500" />;
        break;
      case "Completed":
        icon = <CheckCircle className="w-6 h-6 text-green-500" />;
        break;
      case "Missed":
        icon = <XCircle className="w-6 h-6 text-orange-500" />;
        break;
      default:
        icon = null;
    }
    return {
      label: tab,
      count: testList.filter(
        (test) => test.testCandidateRegistrationStatus === tab
      ).length,
      icon,
    };
  });

  if (!loaded) {
    return <Loader />;
  }

  return (
    <div className="w-full h-full flex flex-col space-y-8">
      {/* Page Header */}
      <div className="w-full mx-auto flex flex-col-reverse md:flex-row justify-between items-center gap-4">
        <div className="md:flex grid grid-cols-1 gap-2 md:gap-0 space-x-4 w-full">
          {tabCardData.map((tabData, index) => (
            <div
              key={tabData.label}
              onClick={() => setCurrentTab(index)}
              className={`w-full cursor-pointer transition transform hover:scale-105`}
            >
              <StatCard
                label={tabData.label}
                value={tabData.count || 0}
                icon={tabData.icon}
                current={currentTab === index}
              />
            </div>
          ))}
        </div>
        <div className="w-full md:max-w-sm">
          <SearchBar
            placeholder="Search Tests"
            onSearch={(value) => {
              setSearchQuery(value);
            }}
          />
        </div>
      </div>

      {/* Test Cards */}
      <div>
        {filteredTestList?.length > 0 ? (
          <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-4">
            {filteredTestList?.map((test, index) => (
              <div key={test.testName}>
                <TestCards
                  id={test.testId.toString()}
                  name={test.testName}
                  startDateTimeString={test.testStartDate}
                  endDateTimeString={test.testEndDate}
                  status={test.testCandidateRegistrationStatus}
                  bookmarked={index % 2 === 0}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-72 flex justify-center items-center rounded-md">
            <h1 className="font-bold text-2xl text-gray-500">No Tests Found</h1>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  current,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  current: boolean;
}) {
  return (
    <div
      className={`border border-gray-300 ${current ? "bg-indigo-50 border-indigo-300" : "bg-white"
        } rounded-xl shadow-md duration-200 ease-in-out px-6 py-1 flex items-center gap-5 min-w-[150px] w-full`}
    >
      <div className="flex-shrink-0 rounded-full">{icon}</div>
      <div className="flex flex-col">
        <span className="text-xl font-bold text-gray-800">{value}</span>
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
    </div>
  );
}
