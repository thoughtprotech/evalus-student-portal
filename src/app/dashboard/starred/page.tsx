"use client";

import SearchBar from "@/components/SearchBar";
import { useEffect, useState } from "react";
import TestList from "@/mock/testList.json";
import TestCards from "../components/TestCards";

export default function Index() {
  const [searchQuery, setSearchQuery] = useState("");
  const [testList, setTestList] = useState<
    {
      id: string;
      name: string;
      startDateTimeString: string;
      endDateTimeString: string;
      status: "OnGoing" | "UpNext" | "Missed" | "Done";
    }[]
  >([]);

  // Load the test list once on mount
  useEffect(() => {
    setTestList(
      TestList as {
        id: string;
        name: string;
        startDateTimeString: string;
        endDateTimeString: string;
        status: "OnGoing" | "UpNext" | "Missed" | "Done";
      }[]
    );
  }, []);

  // Derive the filtered test list based on the current tab and search query
  const filteredTestList = testList.filter((test) =>
    test.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <div key={test.name}>
                <TestCards
                  id={test.id}
                  name={test.name}
                  startDateTimeString={test.startDateTimeString}
                  endDateTimeString={test.endDateTimeString}
                  status={
                    test.status as "OnGoing" | "UpNext" | "Missed" | "Done"
                  }
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
