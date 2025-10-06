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
import { useState } from "react";
import ConfirmationModal from "@/components/ConfirmationModal";
import { format, parseISO } from "date-fns";
import { registerTestAction } from "@/app/actions/dashboard/registerTest";
import { rescheduleTestAction } from "@/app/actions/dashboard/rescheduleTest";
import { setExamMode } from "@/components/AutoLogout";
import toast from "react-hot-toast";
import Link from "next/link";

function formatDurationToHHMM(minutes: number) {
  // console.log({ minutes });
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  // Pad with leading zeros for HH:MM format
  const hh = hours.toString().padStart(2, "0");
  const mm = mins.toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

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
  bookmarked?: boolean; // initial state from parent (optional)
  registrationId: number;
  onRegistered?: () => Promise<void> | void; // callback to refresh dashboard after registration
  onToggleStar?: (testId: number, nowStarred: boolean) => void | Promise<void>; // allow parent sync
  testDurationMinutes: number;
  testDurationForHandicappedMinutes: number;
  test: any;
}

export default function TestCards({
  id,
  name,
  startDateTimeString,
  endDateTimeString,
  status,
  bookmarked = false,
  registrationId,
  onRegistered,
  onToggleStar,
  testDurationMinutes,
  testDurationForHandicappedMinutes,
  test,
}: TestCardsProps) {
  // console.log({ test });

  // Parse ISO date strings for display
  let formattedStartDate;
  let formattedStartTime;
  let formattedEndDate;
  let formattedEndTime;

  if (startDateTimeString && endDateTimeString) {
    const startDate = parseISO(startDateTimeString);
    const endDate = parseISO(endDateTimeString);

    formattedStartDate = format(startDate, "PPP"); // e.g., Jan 1, 2025
    formattedStartTime = format(startDate, "p"); // e.g., 10:00 AM
    formattedEndDate = format(endDate, "PPP");
    formattedEndTime = format(endDate, "p");
  }

  // Format duration as HH:MM
  const formattedDuration = formatDurationToHHMM(testDurationMinutes);
  const formattedHandicapDuration = formatDurationToHHMM(
    testDurationForHandicappedMinutes
  );

  // Map status to action button colors
  const actionButtonMapping: Record<any, string> = {
    Registered: "bg-blue-600 hover:bg-blue-700",
    "In Progress": "bg-blue-600 hover:bg-blue-700",
    "Up Next": "bg-blue-600 hover:bg-blue-700",
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
    linkHref = `/exam/systemCheck/${encodeURIComponent(id)}/${registrationId}`;
  } else if (status === "Up Next") {
    linkText = "Start";
    linkIcon = <Play className="w-5 h-5 ml-2" />;
    linkHref = `/exam/systemCheck/${encodeURIComponent(id)}/${registrationId}`;
  } else if (status === "In Progress") {
    linkText = "Resume";
    linkIcon = <CalendarCheckIcon className="w-5 h-5 ml-2" />;
    linkHref = `/dashboard/register/${encodeURIComponent(id)}`;
  } else if (status === "Missed") {
    linkText = "Reschedule";
    linkIcon = <RotateCcw className="w-5 h-5 ml-2" />;
    // Open reschedule modal; do not navigate
    linkHref = `#reschedule-${encodeURIComponent(id)}`;
  } else if (status === "Completed") {
    linkText = "View Report";
    linkIcon = <ArrowRight className="w-5 h-5 ml-2" />;
    // Ensure testResponseId is valid before creating the link
    if (test.testResponseId) {
      linkHref = `/dashboard/analytics/${encodeURIComponent(
        test.testResponseId
      )}`;
    } else {
      // Fallback to dashboard if no testResponseId
      linkHref = `/dashboard`;
      console.warn("No testResponseId found for completed test:", test);
    }
  }

  const openInPopup = (e: React.MouseEvent) => {
    // Allow all statuses to open system check
    console.log({ registrationId, status, testId: test.testId });
    if (status !== "Up Next") return;

    e.preventDefault();

    // Set exam mode to prevent auto-logout
    setExamMode(true);

    // Always open system check - use registrationId if available, otherwise use 0
    const regId = registrationId && registrationId > 0 ? registrationId : 0;
    const systemCheckUrl = `/exam/systemCheck/${test.testId}/${regId}`;

    console.log("🚀 Opening system check URL:", systemCheckUrl);

    // Try popup first, if blocked or fails, use direct navigation
    try {
      const width = window.screen.availWidth;
      const height = window.screen.availHeight;

      const popup = window.open(
        systemCheckUrl,
        "_blank",
        `width=${width},height=${height},top=0,left=0,scrollbars=no,resizable=no,fullscreen=yes`
      );

      if (!popup || popup.closed || typeof popup.closed === "undefined") {
        console.warn("Popup blocked - using direct navigation");
        // Popup blocked, navigate directly in current tab
        window.location.href = systemCheckUrl;
        return;
      }

      // Monitor popup close to clear exam mode
      const checkClosed = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(checkClosed);
            setExamMode(false);
          }
        } catch (error) {
          // Cross-origin error, popup might be on different domain
          clearInterval(checkClosed);
          setExamMode(false);
        }
      }, 1000);
    } catch (error) {
      console.error("Error opening popup:", error);
      // Fallback to direct navigation
      window.location.href = systemCheckUrl;
    }
  };

  const [showRegisterModal, setShowRegisterModal] = useState(false);

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

  // Modal state and handlers for Missed -> Reschedule
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<string>(defaultLocal());
  const [rescheduleComments, setRescheduleComments] = useState("");
  const [reschedTouched, setReschedTouched] = useState(false);

  const onClickReschedule = (e: React.MouseEvent) => {
    if (status === "Missed") {
      e.preventDefault();
      setShowRescheduleModal(true);
    }
  };

  const isPast = proposedStart
    ? new Date(proposedStart).getTime() < Date.now() - 60000
    : true;
  const isPastReschedule = rescheduleDate
    ? new Date(rescheduleDate).getTime() < Date.now() - 60000
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
          try {
            await onRegistered();
          } catch { }
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

  const confirmReschedule = async () => {
    setReschedTouched(true);
    if (!rescheduleDate || isPastReschedule || registering) return;
    try {
      setRegistering(true);
      const iso = new Date(rescheduleDate).toISOString();
      const regIdNum = Number(registrationId);
      if (!Number.isFinite(regIdNum) || regIdNum <= 0) {
        toast.error(
          "Missing registration ID; cannot reschedule without an existing registration."
        );
        return;
      }
      const res = await fetch(`/api/internal/test-registrations/${regIdNum}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testRegistrationId: regIdNum,
          testId: Number(id),
          testDate: iso,
          testStatus: "Registered",
          comments: rescheduleComments,
          language: "English",
        }),
      });
      if (res.ok) {
        toast.success("Test rescheduled successfully");
        setShowRescheduleModal(false);
        if (onRegistered) {
          try {
            await onRegistered();
          } catch {
            /* ignore */
          }
        }
      } else {
        const msg = await res.text();
        toast.error(msg || "Reschedule failed");
      }
    } catch (e: any) {
      toast.error(e?.message || "Reschedule failed");
    } finally {
      setRegistering(false);
    }
  };

  const [starLoading, setStarLoading] = useState(false);
  const [starred, setStarred] = useState<boolean>(bookmarked);

  const toggleStar = async () => {
    if (starLoading) return;
    setStarLoading(true);
    try {
      const res = await fetch("/api/internal/star-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId: Number(id), makeStarred: !starred }),
      });
      if (res.ok) {
        const now = !starred;
        setStarred(now);
        if (onToggleStar) {
          try {
            await onToggleStar(Number(id), now);
          } catch { }
        }
      } else {
        try {
          (await import("react-hot-toast")).toast.error(
            "Failed to update star"
          );
        } catch { }
      }
    } catch {
      try {
        (await import("react-hot-toast")).toast.error("Failed to update star");
      } catch { }
    } finally {
      setStarLoading(false);
    }
  };

  return (
    <div className="w-full h-full rounded-xl shadow-md p-4 border border-gray-300 bg-white flex flex-col gap-4 justify-between">
      {/* Hidden field to bind TestRegistrationId for this card */}
      <input type="hidden" name="testRegistrationId" value={registrationId} />
      {/* Test Title */}
      <div className="w-full border-b border-b-gray-300 pb-4">
        <h1
          className="text-2xl font-bold text-gray-800 truncate text-ellipsis"
          title={name}
        >
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
        <h1 className="text-sm text-gray-600 font-bold">
          Handicap Duration: {formattedHandicapDuration}
        </h1>
        <div className="flex items-center gap-4">
          {starred ? (
            <BookmarkCheck
              onClick={toggleStar}
              className={`text-indigo-600 cursor-pointer hover:text-indigo-700 duration-300 ${starLoading ? "opacity-50 pointer-events-none" : ""
                }`}
            />
          ) : (
            <Bookmark
              onClick={toggleStar}
              className={`text-gray-500 cursor-pointer hover:text-indigo-700 duration-300 ${starLoading ? "opacity-50 pointer-events-none" : ""
                }`}
            />
          )}
        </div>
      </div>

      {/* Conditional Action Button */}
      <div className="w-full">
        {status === "Up Next" ? (
          <a
            href={linkHref}
            onClick={openInPopup}
            className="w-full flex items-center justify-center gap-1 px-4 py-2 font-bold text-white rounded-xl shadow transition-colors bg-blue-600 hover:bg-blue-700"
          >
            {linkText}
            {linkIcon}
          </a>
        ) : (
          <Link
            href={linkHref}
            className={`${status === "Missed" && "hidden"
              } w-full flex items-center justify-center gap-1 px-4 py-2 font-bold text-white rounded-xl shadow transition-colors ${status && actionButtonMapping[status]
              }`}
          >
            {linkText}
            {linkIcon}
          </Link>
        )}
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
        <form
          className="space-y-5 text-left"
          onSubmit={(e) => e.preventDefault()}
        >
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
              <p className="text-xs text-red-600">
                Start date/time is required.
              </p>
            )}
            {startTouched && proposedStart && isPast && (
              <p className="text-xs text-red-600">
                Start date/time cannot be in the past.
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">
              Comments
            </label>
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

      {/* Reschedule Modal for Missed */}
      <ConfirmationModal
        title={`Reschedule ${name}`}
        message="Pick a new start date/time for your test. Past dates are not allowed."
        isOpen={showRescheduleModal}
        onCancel={() => setShowRescheduleModal(false)}
        onConfirm={confirmReschedule}
        confirmText={registering ? "Rescheduling..." : "Reschedule"}
        cancelText="Cancel"
        confirmDisabled={!rescheduleDate || isPastReschedule || registering}
      >
        <form
          className="space-y-5 text-left"
          onSubmit={(e) => e.preventDefault()}
        >
          {/* Hidden field passed along with reschedule update */}
          <input
            type="hidden"
            name="testRegistrationId"
            value={registrationId}
          />
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <span>New Start Date & Time</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={rescheduleDate}
              min={new Date().toISOString().slice(0, 16)}
              onChange={(e) => setRescheduleDate(e.target.value)}
              onBlur={() => setReschedTouched(true)}
              required
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition ${reschedTouched && (!rescheduleDate || isPastReschedule)
                  ? "border-red-500"
                  : "border-gray-300"
                }`}
            />
            {reschedTouched && !rescheduleDate && (
              <p className="text-xs text-red-600">
                Start date/time is required.
              </p>
            )}
            {reschedTouched && rescheduleDate && isPastReschedule && (
              <p className="text-xs text-red-600">
                Start date/time cannot be in the past.
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">
              Comments
            </label>
            <textarea
              value={rescheduleComments}
              onChange={(e) => setRescheduleComments(e.target.value)}
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
