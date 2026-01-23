"use client";

import { fetchSpotlightListAction } from "@/app/actions/dashboard/spotlight/fetchSpotlightList";
import Loader from "@/components/Loader";
import SearchBar from "@/components/SearchBar";
import { GetSpotlightResponse } from "@/utils/api/types";
import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";

function formatDaysAgo(fromDateStr: string, addedDay?: number): string {
  // Prefer server-provided addedDay (number of days since addedDate) if present
  if (typeof addedDay === "number" && !Number.isNaN(addedDay)) {
    if (addedDay === 0) return "Today";
    if (addedDay === 1) return "Yesterday";
    return `${addedDay} days ago`;
  }
  // Fallback: derive from date (kept for backward compatibility)
  const date = new Date(fromDateStr);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

export default function AnnouncementsPage() {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [query, setQuery] = useState("");
  const [announcementList, setAnnouncementList] = useState<
    GetSpotlightResponse[]
  >([]);
  const { candidateId } = useUser();

  const fetchSpotlightList = async () => {
    if (!candidateId) {
      console.error("No candidate ID available");
      setLoaded(true);
      return;
    }
    
    const res = await fetchSpotlightListAction(candidateId);
    const { data, status } = res;
    if (status === 200 && data) {
      setAnnouncementList(data);
      setLoaded(true);
    }
  };

  useEffect(() => {
    if (candidateId) {
      fetchSpotlightList();
    }
  }, [candidateId]);

  const filteredAnnouncements = announcementList.filter((a) =>
    a.spotlightName.toLowerCase().includes(query.toLowerCase())
  );

  if (!loaded) {
    return <Loader />;
  }
  return (
    <div className="h-full w-full">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Search bar */}
        <div className="flex justify-center sticky top-0 z-50">
          <SearchBar
            placeholder="Search Spotlight"
            onSearch={(value) => {
              setQuery(value);
            }}
          />
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-1 gap-6">
          {filteredAnnouncements.length > 0 ? (
            filteredAnnouncements
              .sort(
                (a, b) =>
                  new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime()
              )
              .map((announcement) => (
                <div
                  key={announcement.id}
                  className="bg-white shadow-md transition-shadow border border-gray-300 rounded-lg p-6 space-y-2 relative"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-indigo-600">
                      {announcement.spotlightName}
                    </h2>
                    <div className="flex gap-2 items-center">
                      <span className="text-sm text-gray-500">
                        {formatDaysAgo(announcement.addedDate, announcement.addedDay)}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">
                    {announcement.spotlightNameDescription}
                  </p>
                </div>
              ))
          ) : (
            <p className="text-center text-gray-500 col-span-2">
              No announcements found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
