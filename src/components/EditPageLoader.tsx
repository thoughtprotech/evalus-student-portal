"use client";
import { LoaderPinwheel } from "lucide-react";

interface Props { message?: string }

export default function EditPageLoader({ message = "Loading..." }: Props) {
  return (
    <div className="fixed left-0 right-0 top-16 bottom-0 z-40 flex items-center justify-center bg-white/85 backdrop-blur-sm border-t border-gray-200" role="status" aria-live="polite" aria-label={message}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-indigo-200 via-blue-200 to-indigo-200 opacity-40 blur-xl animate-pulse" />
          <LoaderPinwheel className="relative w-12 h-12 text-indigo-600 animate-spin" />
        </div>
        <p className="text-sm font-medium text-gray-700 tracking-wide">{message}</p>
      </div>
    </div>
  );
}
