"use client";

import SearchBar from "@/components/SearchBar";
import { useEffect, useState, useMemo } from "react";
import TestCards from "../components/TestCards";
import Loader from "@/components/Loader";
import { listStarredTestsIdsAction } from "@/app/actions/dashboard/starred/toggleStarredTest";
import { fetchCandidateTestList } from "@/app/actions/dashboard/testList";
import { GetCandidateTestResponse } from "@/utils/api/types";
import { useUser } from "@/contexts/UserContext";

export default function Index() {
  const { currentGroupId, groupSelected } = useUser();
  const [loaded, setLoaded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allTests, setAllTests] = useState<GetCandidateTestResponse[]>([]);
  const [starredIds, setStarredIds] = useState<number[]>([]);

  const loadData = async () => {
    setLoaded(false);
    try {
      // Fetch full candidate test list (same as dashboard)
      const testsRes = await fetchCandidateTestList(Number(currentGroupId), {
        useGroupEndpoint: !!groupSelected,
      });
      if (testsRes.status === 200 && Array.isArray(testsRes.data)) {
        setAllTests(testsRes.data);
      } else {
        setAllTests([]);
      }
    } catch {
      setAllTests([]);
    }
    try {
      const ids = await listStarredTestsIdsAction();
      setStarredIds(ids);
    } catch {
      setStarredIds([]);
    }
    setLoaded(true);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGroupId, groupSelected]);

  // Filter client-side: only tests whose id is in starredIds and match search
  const filteredTestList = useMemo(
    () =>
      allTests
        .filter((t) => starredIds.includes(t.testId))
        .filter((t) =>
          t.testName.toLowerCase().includes(searchQuery.toLowerCase())
        ),
    [allTests, starredIds, searchQuery]
  );

  if (!loaded) {
    return <Loader />;
  }

  return (
    <div className="w-full h-full flex flex-col space-y-8">
      <div className="w-full flex flex-col-reverse md:flex md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:max-w-sm">
          <SearchBar
            placeholder="Search Starred"
            onSearch={(value) => {
              setSearchQuery(value);
            }}
          />
        </div>
      </div>
      <div>
        {filteredTestList.length > 0 ? (
          <div className="w-full grid grid-cols-1 lg:grid lg:grid-cols-4 gap-4">
            {filteredTestList.map((test) => (
              <div key={`starred-${test.testId}`}>
                <TestCards
                  id={test.testId.toString()}
                  name={test.testName}
                  startDateTimeString={test.testStartDate}
                  endDateTimeString={test.testEndDate}
                  status={test.testCandidateRegistrationStatus}
                  bookmarked={true}
                  registrationId={test.testRegistrationId}
                  onToggleStar={async (testId, nowStarred) => {
                    setStarredIds((prev) =>
                      nowStarred
                        ? prev.includes(testId)
                          ? prev
                          : [...prev, testId]
                        : prev.filter((id) => id !== testId)
                    );
                  }}
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
