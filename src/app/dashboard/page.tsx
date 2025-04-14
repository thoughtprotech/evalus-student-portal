"use client";

import SearchBar from "@/components/SearchBar";
import { useEffect, useState } from "react";
import TestList from "@/mock/testList.json";
import TestCards from "./components/TestCards";
import { PlayCircle, Clock, XCircle, CheckCircle } from "lucide-react";

export default function Index() {
  const [currentTab, setCurrentTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [testList, setTestList] = useState<
    {
      name: string;
      startDateTimeString: string;
      endDateTimeString: string;
      status: "OnGoing" | "UpNext" | "Missed" | "Done";
    }[]
  >([]);

  const tabs = ["OnGoing", "UpNext", "Missed", "Done"];

  // Load the test list once on mount
  useEffect(() => {
    setTestList(
      TestList as {
        name: string;
        startDateTimeString: string;
        endDateTimeString: string;
        status: "OnGoing" | "UpNext" | "Missed" | "Done";
      }[]
    );
  }, []);

  // Derive the filtered test list based on the current tab and search query
  const filteredTestList = testList.filter(
    (test) =>
      test.status === tabs[currentTab] &&
      test.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Prepare tab card data including count and an appropriate icon
  const tabCardData = tabs.map((tab) => {
    let icon;
    switch (tab) {
      case "OnGoing":
        icon = <PlayCircle className="w-6 h-6 text-blue-500" />;
        break;
      case "UpNext":
        icon = <Clock className="w-6 h-6 text-yellow-500" />;
        break;
      case "Missed":
        icon = <XCircle className="w-6 h-6 text-red-500" />;
        break;
      case "Done":
        icon = <CheckCircle className="w-6 h-6 text-green-500" />;
        break;
      default:
        icon = null;
    }
    return {
      label: tab,
      count: testList.filter((test) => test.status === tab).length,
      icon,
    };
  });

  return (
    <div className="w-full h-full flex flex-col space-y-8">
      {/* Page Header */}
      <div className="w-full mx-auto flex flex-col-reverse md:flex-row justify-between items-center gap-4">
        <div className="md:flex grid grid-cols-2 gap-2 md:gap-0 space-x-4 w-full lg:w-fit">
          {tabCardData.map((tabData, index) => (
            <div
              key={tabData.label}
              onClick={() => setCurrentTab(index)}
              className={`w-full cursor-pointer transition transform hover:scale-105 ${
                currentTab === index ? "" : ""
              }`}
            >
              <StatCard
                label={tabData.label}
                value={tabData.count}
                icon={tabData.icon}
              />
            </div>
          ))}
        </div>
        <div className="w-full md:max-w-sm">
          <SearchBar
            placeholder="Search Tests"
            onSearch={(value) => {
              setSearchQuery(value);
              console.log("Searching in tab:", currentTab, "Value:", value);
            }}
          />
        </div>
      </div>

      {/* Test Cards */}
      <div>
        {filteredTestList.length > 0 ? (
          <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-4">
            {filteredTestList.map((test, index) => (
              <div key={test.name}>
                <TestCards
                  name={test.name}
                  startDateTimeString={test.startDateTimeString}
                  endDateTimeString={test.endDateTimeString}
                  status={test.status}
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
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-md duration-200 ease-in-out px-6 py-2 flex items-center gap-5 min-w-[150px] w-full">
      <div className="flex-shrink-0 p-3 bg-indigo-50 rounded-full">{icon}</div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-gray-800">{value}</span>
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
    </div>
  );
}
