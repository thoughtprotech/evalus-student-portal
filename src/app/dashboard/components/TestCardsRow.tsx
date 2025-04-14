"use client";

import { Bookmark, BookmarkCheck, Calendar, Clock } from "lucide-react";
import { format, parseISO, differenceInMinutes } from "date-fns";

interface TestCardsProps {
  name: string;
  startDateTimeString: string;
  endDateTimeString: string;
  status: "OnGoing" | "UpNext" | "Missed" | "Done";
  bookmarked?: boolean
}

export default function TestCardsRow({
  name,
  startDateTimeString,
  endDateTimeString,
  status,
  bookmarked = false
}: TestCardsProps) {
  // Parse the ISO date strings and format them
  const startDate = parseISO(startDateTimeString);
  const endDate = parseISO(endDateTimeString);

  const formattedStartDate = format(startDate, "PPP"); // e.g., Jan 1, 2025
  const formattedStartTime = format(startDate, "p"); // e.g., 10:00 AM
  const formattedEndDate = format(endDate, "PPP");
  const formattedEndTime = format(endDate, "p");

  const durationInMinutes = differenceInMinutes(endDate, startDate);
  const hours = Math.floor(durationInMinutes / 60);
  const minutes = durationInMinutes % 60;

  const formattedDuration =
    hours > 0 ? `${hours}h ${minutes > 0 ? `${minutes}m` : ""}` : `${minutes}m`;

  // Map the status to color classes
  const statusMapping: Record<
    TestCardsProps["status"],
    { bg: string; text: string }
  > = {
    OnGoing: { bg: "bg-purple-100", text: "text-purple-800" },
    UpNext: { bg: "bg-blue-100", text: "text-blue-800" },
    Missed: { bg: "bg-red-100", text: "text-red-800" },
    Done: { bg: "bg-green-100", text: "text-green-800" },
  };

  return (
    <div className="w-full rounded-md shadow-md p-6 border border-gray-300 bg-white grid grid-cols-3">
      {/* Test Title */}
      <div className="w-full h-full flex items-center">
        <h1 className="text-xl font-bold text-gray-800">{name}</h1>
      </div>

      {/* Start and End Date/Time */}
      <div className="flex gap-4">
        {/* Start Information */}
        <div className="pr-4 border-r border-r-gray-300 flex gap-4 items-center">
          <div>
            <h2 className="text-sm font-semibold text-gray-500">Start Date</h2>
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-600 mr-1" />
              <span className="text-base text-gray-700">
                {formattedStartDate}
              </span>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-500">Start Time</h2>
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-gray-600 mr-1" />
              <span className="text-base text-gray-700">
                {formattedStartTime}
              </span>
            </div>
          </div>
        </div>

        {/* End Information */}
        <div className="flex gap-4 items-center">
          <div>
            <h2 className="text-sm font-semibold text-gray-500">End Date</h2>
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-600 mr-1" />
              <span className="text-base text-gray-700">
                {formattedEndDate}
              </span>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-500">End Time</h2>
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-gray-600 mr-1" />
              <span className="text-base text-gray-700">
                {formattedEndTime}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex w-full h-full items-center justify-end gap-6">
        <div>
          <h1 className="text-sm text-gray-600 font-bold">
            Duration: {formattedDuration}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={`inline-block px-4 py-1 text-sm font-semibold rounded-full 
            ${statusMapping[status].bg} ${statusMapping[status].text}`}
          >
            {status}
          </span>
          {bookmarked ? (
            <BookmarkCheck className="text-gray-500 cursor-pointer hover:text-indigo-700 duration-300" />
          ) : (
            <Bookmark className="text-gray-500 cursor-pointer hover:text-indigo-700 duration-300" />
          )}
        </div>
      </div>
    </div>
  );
}
