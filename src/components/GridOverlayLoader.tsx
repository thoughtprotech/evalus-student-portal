"use client";
import { LoaderPinwheel } from "lucide-react";

interface Props {
  message?: string;
  backdropClassName?: string;
}

// Centered overlay loader used atop data grids for consistent UX
export default function GridOverlayLoader({ message = "Loading...", backdropClassName = "bg-white/85" }: Props) {
  return (
    <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center ${backdropClassName} backdrop-blur-sm transition-opacity duration-150`} role="status" aria-live="polite" aria-label={message}>
      <div className="relative mb-3">
        <div className="absolute -inset-3 bg-gradient-to-r from-indigo-200 via-blue-200 to-indigo-200 opacity-30 blur-xl animate-pulse rounded-full" />
        <LoaderPinwheel className="relative w-10 h-10 text-indigo-600 animate-spin" />
      </div>
      <p className="text-sm font-medium text-gray-600 tracking-wide">{message}</p>
    </div>
  );
}
