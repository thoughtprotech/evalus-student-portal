"use client";

import SearchBar from "@/components/SearchBar";
import { useEffect, useState } from "react";
import AnnouncementList from "@/mock/announcementList.json";

function daysAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

export default function AnnouncementsPage() {
  const [query, setQuery] = useState("");
  const [announcementList, setAnnouncementList] = useState<
    {
      id: number;
      title: string;
      date: string;
      description: string;
    }[]
  >([]);

  useEffect(() => {
    setAnnouncementList(AnnouncementList);
  }, []);

  const filteredAnnouncements = announcementList.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="h-full w-full">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Search bar */}
        <div className="flex justify-center sticky top-0 z-50">
          <SearchBar
            placeholder="Search Spotlight"
            onSearch={(value) => {
              setQuery(value);
              console.log("Value:", value);
            }}
          />
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-1 gap-6">
          {filteredAnnouncements.length > 0 ? (
            filteredAnnouncements
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              )
              .map((announcement) => (
                <div
                  key={announcement.id}
                  className="bg-white shadow-md transition-shadow border border-gray-300 rounded-lg p-6 space-y-2 relative"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-indigo-600">
                      {announcement.title}
                    </h2>
                    <div className="flex gap-2 items-center">
                      <span className="text-sm text-gray-500">
                        {daysAgo(announcement.date)}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">
                    {announcement.description}
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
