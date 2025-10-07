"use client";

import SearchBar from "@/components/SearchBar";
import { useEffect, useState } from "react";
import TestCards from "./components/TestCards";
import PaginationControls from "@/components/PaginationControls";
import {
  Play,
  Clock,
  XCircle,
  CheckCircle,
  CircleArrowRight,
} from "lucide-react";
import { fetchCandidateTestList } from "../actions/dashboard/testList";
import { listStarredTestsIdsAction } from "../actions/dashboard/starred/toggleStarredTest";
import Loader from "@/components/Loader";
import { GetCandidateTestResponse } from "@/utils/api/types";
import { useUser } from "@/contexts/UserContext";
import toast from "react-hot-toast";

export default function Index() {
  const {
    username,
    setUsername,
    currentGroupId,
    setCurrentGroupId,
    groupSelected,
    selectedGroupName,
  } = useUser();
  const [loaded, setLoaded] = useState<boolean>(false);
  // Default tab: Up Next for normal dashboard, Registered when viewing a group
  const [currentTab, setCurrentTab] = useState<number>(groupSelected ? 0 : 0);
  const [searchQuery, setSearchQuery] = useState("");
  const [testList, setTestList] = useState<GetCandidateTestResponse[]>([]);
  const [starredIds, setStarredIds] = useState<number[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20); // default 20 cards per page

  const tabs = ["Up Next", "Completed", "Missed"];

  const fetchTestList = async () => {
    const res = await fetchCandidateTestList(Number(currentGroupId), {
      useGroupEndpoint: !!groupSelected,
    });
    const { data, status } = res;
    setLoaded(false);
    if (status === 200) {
      console.log({ data });
      setTestList(data!);
      setLoaded(true);
    } else {
      toast.error("Something Went Wrong Fetching Tests");
      setLoaded(true);
    }
  };

  const fetchStarred = async () => {
    try {
      const ids = await listStarredTestsIdsAction();
      setStarredIds(ids);
    } catch {
      setStarredIds([]);
    }
  };

  // Load the test list once on mount
  useEffect(() => {
    fetchTestList();
    fetchStarred();
  }, [currentGroupId, groupSelected]);

  // When groupSelected toggles, reset the default tab per requirement
  useEffect(() => {
    setCurrentTab(groupSelected ? 0 : 0);
  }, [groupSelected]);

  // Derive the filtered test list based on the current tab and search query
  const filteredTestList: GetCandidateTestResponse[] = testList?.filter(
    (test) =>
      test.testCandidateRegistrationStatus === tabs[currentTab] &&
      test.testName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset / clamp page when tab, search, or filtered length changes
  useEffect(() => {
    setPage(1);
  }, [currentTab, searchQuery]);
  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil((filteredTestList?.length || 0) / pageSize)
    );
    if (page > totalPages) setPage(totalPages);
  }, [filteredTestList, page, pageSize]);

  // Paginate
  const paginatedTests: GetCandidateTestResponse[] =
    filteredTestList?.slice((page - 1) * pageSize, page * pageSize) || [];

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

  useEffect(() => {
    console.log({ paginatedTests });
  }, [paginatedTests]);

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

      {/* Selected Group Caption */}
      {groupSelected && selectedGroupName && (
        <div className="w-full">
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 border-2 border-indigo-200/60 rounded-2xl px-8 py-6 mb-8 shadow-lg backdrop-blur-sm">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-200/30 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-200/20 to-transparent rounded-full translate-y-12 -translate-x-12"></div>

            <div className="relative flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-md">
                <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </div>
              <div className="flex-1">
                <div>
                  <span className="text-sm text-indigo-600/80 font-semibold uppercase tracking-wider">Show Tests for</span>
                </div>
                <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-indigo-800 to-blue-700 mt-1">
                  {selectedGroupName}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Pagination (Top) + Test Cards */}
      <div>
        {filteredTestList?.length > 0 ? (
          <>
            <div className="mb-4 flex justify-end">
              <PaginationControls
                page={page}
                pageSize={pageSize}
                total={filteredTestList.length}
                pageSizeOptions={[20, 25, 30, 35, 40]}
                onPageChange={(p) => setPage(p)}
                onPageSizeChange={(s) => setPageSize(s)}
                showTotalCount
                label="Cards per page:"
              />
            </div>
            <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-4">
              {paginatedTests.map((test) => (
                <div key={`test-${test.testId}`}>
                  <TestCards
                    id={test.testId.toString()}
                    name={test.testName}
                    startDateTimeString={test.testStartDate}
                    endDateTimeString={test.testEndDate}
                    status={test.testCandidateRegistrationStatus}
                    bookmarked={starredIds.includes(test.testId)}
                    onRegistered={async () => {
                      await fetchTestList();
                    }}
                    registrationId={test.testRegistrationId}
                    onToggleStar={async () => {
                      await fetchStarred();
                    }}
                    testDurationMinutes={test.testDurationMinutes}
                    testDurationForHandicappedMinutes={
                      test.testDurationForHandicappedMinutes
                    }
                    test={test}
                  />
                </div>
              ))}
            </div>
          </>
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
  // Increase width specifically for "In Progress" so it stays single line
  const minWidthClass =
    label === "In Progress" ? "min-w-[175px]" : "min-w-[150px]";
  return (
    <div
      className={`border border-gray-300 ${current ? "bg-indigo-50 border-indigo-300" : "bg-white"
        } rounded-xl shadow-md duration-200 ease-in-out px-6 py-1 flex items-center gap-5 ${minWidthClass} w-full`}
    >
      <div className="flex-shrink-0 rounded-full">{icon}</div>
      <div className="flex flex-col">
        <span className="text-xl font-bold text-gray-800">{value}</span>
        <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
          {label}
        </span>
      </div>
    </div>
  );
}
