"use client";

import {
  Bookmark,
  BookmarkCheck,
  Calendar,
  Clock,
  CalendarCheck as CalendarCheckIcon,
  RotateCcw,
  ArrowRight,
  Play,
} from "lucide-react";
import { format, parseISO, differenceInMinutes } from "date-fns";
import Link from "next/link";

interface TestCardsProps {
  id: string;
  name: string;
  startDateTimeString: string;
  endDateTimeString: string;
  status: "SignedUp" | "UpNext" | "Missed" | "Done";
  bookmarked?: boolean;
}

export default function TestCards({
  id,
  name,
  startDateTimeString,
  endDateTimeString,
  status,
  bookmarked = false,
}: TestCardsProps) {
  // Parse ISO date strings
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

  // Map status to color classes for status badge
  const statusMapping: Record<
    TestCardsProps["status"],
    { bg: string; text: string }
  > = {
    SignedUp: { bg: "bg-purple-100", text: "text-purple-800" },
    UpNext: { bg: "bg-blue-100", text: "text-blue-800" },
    Missed: { bg: "bg-red-100", text: "text-red-800" },
    Done: { bg: "bg-green-100", text: "text-green-800" },
  };

  // Map status to action button colors
  const actionButtonMapping: Record<TestCardsProps["status"], string> = {
    SignedUp: "bg-green-600 hover:bg-green-700",
    UpNext: "bg-blue-600 hover:bg-blue-700",
    Missed: "bg-red-600 hover:bg-red-700",
    Done: "bg-indigo-600 hover:bg-indigo-700",
  };

  // Determine Link button content based on status
  let linkText = "";
  let linkIcon = null;
  let linkHref = "/";

  if (status === "SignedUp") {
    linkText = "Start";
    linkIcon = <Play className="w-5 h-5 ml-2" />;
    linkHref = `/exam/systemCheck/${encodeURIComponent(id)}`;
  } else if (status === "UpNext") {
    linkText = "SignUp";
    linkIcon = <CalendarCheckIcon className="w-5 h-5 ml-2" />;
    linkHref = `/dashboard/register/${encodeURIComponent(id)}`;
  } else if (status === "Missed") {
    linkText = "Reschedule";
    linkIcon = <RotateCcw className="w-5 h-5 ml-2" />;
    linkHref = `/dashboard/reschedule/${encodeURIComponent(id)}`;
  } else if (status === "Done") {
    linkText = "View Report";
    linkIcon = <ArrowRight className="w-5 h-5 ml-2" />;
    linkHref = `/dashboard/analytics/${encodeURIComponent(id)}`;
  }

  const openInPopup = (e: React.MouseEvent) => {
    e.preventDefault();

    const features = [
      "toolbar=no",
      "menubar=no",
      "location=no",
      "status=no",
      "resizable=yes",
      "scrollbars=yes",
      `width=${window.screen.width}`,
      `height=${window.screen.height}`,
      `top=0`,
      `left=0`,
    ].join(",");

    const popup = window.open(linkHref, "_blank", features);

    if (!popup) {
      console.error("Popup blocked");
      return;
    }

    // when ready, request fullscreen and inject blockers
    popup.addEventListener("load", () => {
      // Fullscreen
      popup.document.documentElement
        .requestFullscreen()
        .catch(() => console.warn("Fullscreen denied"));

      // Block right-click
      // popup.document.addEventListener("contextmenu", (ev) =>
      //   ev.preventDefault()
      // );

      // Block common DevTools shortcuts
      // popup.document.addEventListener("keydown", (ev) => {
      //   if (
      //     ev.key === "F12" ||
      //     (ev.ctrlKey && ev.shiftKey && ["I", "J", "C"].includes(ev.key)) ||
      //     (ev.ctrlKey && ev.key === "u")
      //   ) {
      //     ev.preventDefault();
      //   }
      // });

      // Re-request fullscreen if user exits
      popup.document.addEventListener("fullscreenchange", () => {
        if (!popup.document.fullscreenElement) {
          popup.document.documentElement.requestFullscreen().catch(() => {});
        }
      });
    });
  };

  return (
    <div className="w-full h-full rounded-md shadow-md p-4 border border-gray-300 bg-white flex flex-col gap-4 justify-between">
      {/* Test Title */}
      <div className="w-full border-b border-b-gray-300 pb-4">
        <h1 className="text-2xl font-bold text-gray-800 truncate text-ellipsis">
          {name}
        </h1>
      </div>

      {/* Start and End Date/Time */}
      <div className="w-full grid grid-cols-2 gap-5 md:gap-10 rounded-md p-2">
        {/* Start Information */}
        <div className="w-full h-full flex flex-col gap-5 justify-between">
          <div>
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-600 mr-1" />
              <h2 className="text-sm font-semibold text-gray-500 mb-1">
                Start Date
              </h2>
            </div>
            <span className="text-base text-gray-700">
              {formattedStartDate}
            </span>
          </div>
          <div>
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-gray-600 mr-1" />
              <h2 className="text-sm font-semibold text-gray-500 mb-1">
                Start Time
              </h2>
            </div>
            <span className="text-base text-gray-700">
              {formattedStartTime}
            </span>
          </div>
        </div>

        {/* End Information */}
        <div className="w-full h-full flex flex-col gap-5 justify-between">
          <div>
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-600 mr-1" />
              <h2 className="text-sm font-semibold text-gray-500 mb-1">
                End Date
              </h2>
            </div>
            <span className="text-base text-gray-700">{formattedEndDate}</span>
          </div>
          <div>
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-gray-600 mr-1" />
              <h2 className="text-sm font-semibold text-gray-500 mb-1">
                End Time
              </h2>
            </div>
            <span className="text-base text-gray-700">{formattedEndTime}</span>
          </div>
        </div>
      </div>

      {/* Status and Duration */}
      <div className="flex justify-between items-center border-t border-t-gray-300 pt-4">
        <h1 className="text-sm text-gray-600 font-bold">
          Duration: {formattedDuration}
        </h1>
        <div className="flex items-center gap-4">
          {bookmarked ? (
            <BookmarkCheck className="text-gray-500 cursor-pointer hover:text-indigo-700 duration-300" />
          ) : (
            <Bookmark className="text-gray-500 cursor-pointer hover:text-indigo-700 duration-300" />
          )}
        </div>
      </div>

      {/* Conditional Action Button */}
      <div className="w-full">
        <a
          href={linkHref}
          onClick={openInPopup}
          className={`w-full flex items-center justify-center px-4 py-2 font-bold text-white rounded shadow transition-colors ${actionButtonMapping[status]}`}
        >
          {linkIcon}
          {linkText}
        </a>
      </div>
    </div>
  );
}
