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
  PenSquare,
} from "lucide-react";
import { useState, useTransition } from "react";
import ConfirmationModal from "@/components/ConfirmationModal";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { registerTestAction } from "@/app/actions/dashboard/registerTest";
import toast from "react-hot-toast";

interface TestCardsProps {
  id: string;
  name: string;
  startDateTimeString?: string;
  endDateTimeString?: string;
  status?:
  | "Registered"
  | "Completed"
  | "Cancelled"
  | "In Progress"
  | "Missed"
  | "Up Next"
  | undefined;
  bookmarked?: boolean;
  onRegistered?: () => Promise<void> | void; // callback to refresh dashboard after registration
}

export default function TestCards({
  id,
  name,
  startDateTimeString,
  endDateTimeString,
  status,
  bookmarked = false,
  onRegistered,
}: TestCardsProps) {
  // Parse ISO date strings
  let formattedStartDate;
  let formattedStartTime;
  let formattedEndDate;
  let formattedEndTime;
  let formattedDuration;

  if (startDateTimeString && endDateTimeString) {
    const startDate = parseISO(startDateTimeString);
    const endDate = parseISO(endDateTimeString);

    formattedStartDate = format(startDate, "PPP"); // e.g., Jan 1, 2025
    formattedStartTime = format(startDate, "p"); // e.g., 10:00 AM
    formattedEndDate = format(endDate, "PPP");
    formattedEndTime = format(endDate, "p");

    const durationInMinutes = differenceInMinutes(endDate, startDate);
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = durationInMinutes % 60;
    formattedDuration =
      hours > 0
        ? `${hours}h ${minutes > 0 ? `${minutes}m` : ""}`
        : `${minutes}m`;
  }

  // Map status to action button colors
  const actionButtonMapping: Record<any, string> = {
    // Registered button should be blue like its tab icon
    Registered: "bg-blue-600 hover:bg-blue-700",
    "In Progress": "bg-blue-600 hover:bg-blue-700",
    // Up Next should use purple per requirement (matching tab icon)
    "Up Next": "bg-purple-600 hover:bg-purple-700",
    Missed: "bg-orange-600 hover:bg-orange-700",
    Cancelled: "bg-red-600 hover:bg-red-700",
    Completed: "bg-green-600 hover:bg-green-700",
  };

  // Determine Link button content based on status
  let linkText = "";
  let linkIcon = null;
  let linkHref = "/";

  if (status === "Registered") {
    linkText = "Start";
    linkIcon = <Play className="w-5 h-5 ml-2" />;
    linkHref = `/exam/systemCheck/${encodeURIComponent(id)}`;
  } else if (status === "Up Next") {
    linkText = "Register"; // per requirement
    linkIcon = <PenSquare className="w-5 h-5 ml-2" />;
    linkHref = `#register-${encodeURIComponent(id)}`; // no navigation; modal opens
  } else if (status === "In Progress") {
    linkText = "Resume";
    linkIcon = <CalendarCheckIcon className="w-5 h-5 ml-2" />;
    linkHref = `/dashboard/register/${encodeURIComponent(id)}`;
  } else if (status === "Missed") {
    linkText = "Reschedule";
    linkIcon = <RotateCcw className="w-5 h-5 ml-2" />;
    linkHref = `/dashboard/reschedule/${encodeURIComponent(id)}`;
  } else if (status === "Completed") {
    linkText = "View Report";
    linkIcon = <ArrowRight className="w-5 h-5 ml-2" />;
    linkHref = `/dashboard/analytics/${encodeURIComponent(id)}`;
  } else if (status === "Cancelled") {
    linkText = "Enquire";
    linkIcon = <ArrowRight className="w-5 h-5 ml-2" />;
    linkHref = `/dashboard/analytics/${encodeURIComponent(id)}`;
  }

  const openInPopup = (e: React.MouseEvent) => {
    if (status !== "Registered") return;

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
          popup.document.documentElement.requestFullscreen().catch(() => { });
        }
      });
    });
  };

  // Modal state for Up Next registration
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  // Pre-fill with server provided start (if future) else current datetime local (rounded to minutes)
  const defaultLocal = () => {
    const d = new Date();
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  };
  const initialStart = (() => {
    if (startDateTimeString) {
      try {
        const s = new Date(startDateTimeString);
        if (isFinite(s.getTime()) && s.getTime() > Date.now() - 60000) {
          return s.toISOString().slice(0, 16);
        }
      } catch { }
    }
    return defaultLocal();
  })();
  const [proposedStart, setProposedStart] = useState<string>(initialStart);
  const [comments, setComments] = useState("");
  const [startTouched, setStartTouched] = useState(false);

  const onClickRegister = (e: React.MouseEvent) => {
    if (status === "Up Next") {
      e.preventDefault();
      setShowRegisterModal(true);
    }
  };

  const isPast = proposedStart
    ? new Date(proposedStart).getTime() < Date.now() - 60000
    : true;
  const [registering, setRegistering] = useState(false);
  const confirmRegistration = async () => {
    setStartTouched(true);
    if (!proposedStart || isPast || registering) return;
    try {
      setRegistering(true);
      const iso = new Date(proposedStart).toISOString();
      const res = await registerTestAction({
        testId: Number(id),
        testDate: iso,
        comments,
        language: "English",
      });
      if (res.ok) {
        toast.success("Test registered successfully");
        setShowRegisterModal(false);
        if (onRegistered) {
          try { await onRegistered(); } catch { /* ignore */ }
        }
      } else {
        toast.error(res.errorMessage || res.message || "Registration failed");
      }
    } catch (e: any) {
      toast.error(e?.message || "Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="w-full h-full rounded-xl shadow-md p-4 border border-gray-300 bg-white flex flex-col gap-4 justify-between">
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
          onClick={status === "Up Next" ? onClickRegister : openInPopup}
          className={`w-full flex items-center justify-center gap-1 px-4 py-2 font-bold text-white rounded-xl shadow transition-colors ${status && actionButtonMapping[status]
            }`}
        >
          {linkText}
          {linkIcon}
        </a>
      </div>

      {/* Registration Modal for Up Next */}
      <ConfirmationModal
        title={`Register for ${name}`}
        message="Confirm the proposed start date/time or adjust if allowed, then add optional comments."
        isOpen={showRegisterModal}
        onCancel={() => setShowRegisterModal(false)}
        onConfirm={confirmRegistration}
        confirmText={registering ? "Registering..." : "Register"}
        cancelText="Cancel"
        confirmDisabled={!proposedStart || isPast || registering}
      >
        <form className="space-y-5 text-left" onSubmit={(e) => e.preventDefault()}>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <span>Test Start Date & Time</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={proposedStart}
              min={new Date().toISOString().slice(0, 16)}
              onChange={(e) => setProposedStart(e.target.value)}
              onBlur={() => setStartTouched(true)}
              required
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition ${startTouched && (!proposedStart || isPast)
                ? "border-red-500"
                : "border-gray-300"
                }`}
            />
            {startTouched && !proposedStart && (
              <p className="text-xs text-red-600">Start date/time is required.</p>
            )}
            {startTouched && proposedStart && isPast && (
              <p className="text-xs text-red-600">Start date/time cannot be in the past.</p>
            )}
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">Comments</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              placeholder="Any specific notes or requirements..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
            />
          </div>
        </form>
      </ConfirmationModal>
    </div>
  );
}
