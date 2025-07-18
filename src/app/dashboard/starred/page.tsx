"use client";

import SearchBar from "@/components/SearchBar";
import { useEffect, useState } from "react";
import TestCards from "../components/TestCards";
import Loader from "@/components/Loader";
import { fetchCandidateStarredTestList } from "@/app/actions/dashboard/starred/fetchStarredTestList";
import { GetCandidateStarredTestResponse } from "@/utils/api/types";

export default function Index() {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [testList, setTestList] = useState<GetCandidateStarredTestResponse[]>(
    []
  );

  const fetchStarredList = async () => {
    const res = await fetchCandidateStarredTestList();
    const { data, status } = res;
    if (status === 200) {
      setTestList(data!);
      setLoaded(true);
    }
  };

  // Load the test list once on mount
  useEffect(() => {
    fetchStarredList();
  }, []);

  // Derive the filtered test list based on the current tab and search query
  const filteredTestList = testList.filter((test) =>
    test.testName.toLowerCase().includes(searchQuery.toLowerCase())
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
              console.log("Value:", value);
            }}
          />
        </div>
      </div>
      <div>
        {filteredTestList.length > 0 ? (
          <div className="w-full grid grid-cols-1 lg:grid lg:grid-cols-4 gap-4">
            {filteredTestList.map((test) => (
              <div key={test.testName}>
                <TestCards
                  id={test.testId.toString()}
                  name={test.testName}
                  // startDateTimeString={test.startDateTimeString}
                  // endDateTimeString={test.endDateTimeString}
                  // status={
                  //   test.status as "SignedUp" | "UpNext" | "Missed" | "Done"
                  // }
                  bookmarked={true}
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
