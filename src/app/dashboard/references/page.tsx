"use client";

import SearchBar from "@/components/SearchBar";
import { useEffect, useState } from "react";
import DocumentCard from "./components/DocumentCard";
import Loader from "@/components/Loader";
import { fetchReferencesListAction } from "@/app/actions/dashboard/referencesList";

export default function Index() {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [referenceList, setReferenceList] = useState<
    {
      title: string;
      fileType: string;
      fileSize: string;
      uploadDate: string;
      description: string;
      downloadUrl: string;
    }[]
  >([]);

  const fetchReferencesList = async () => {
    const res = fetchReferencesListAction();
    const { data, status } = await res;
    if (status === "success") {
      setReferenceList(data);
      setLoaded(true);
    }
  };

  useEffect(() => {
    fetchReferencesList();
  }, []);

  // Derive the filtered test list based on the current tab and search query
  const filteredReferenceList = referenceList.filter((test) =>
    test.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!loaded) {
    return <Loader />;
  }

  return (
    <div className="w-full h-full flex flex-col space-y-8">
      <div className="w-full flex flex-col-reverse md:flex md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:max-w-sm">
          <SearchBar
            placeholder="Search References"
            onSearch={(value) => {
              setSearchQuery(value);
            }}
          />
        </div>
      </div>
      <div>
        {filteredReferenceList.length > 0 ? (
          <div className="w-full grid grid-cols-1 lg:grid lg:grid-cols-4 gap-4">
            {filteredReferenceList.map((reference) => (
              <DocumentCard
                title={reference.title}
                fileType={reference.fileType}
                fileSize={reference.fileSize}
                uploadDate={reference.uploadDate}
                description={reference.description}
                downloadUrl={reference.downloadUrl}
                key={reference.downloadUrl}
              />
            ))}
          </div>
        ) : (
          <div className="w-full h-72 flex justify-center items-center rounded-md">
            <h1 className="font-bold text-2xl text-gray-500">
              No References Found
            </h1>
          </div>
        )}
      </div>
    </div>
  );
}
