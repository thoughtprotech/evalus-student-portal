// app/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { User } from "lucide-react";

export const metadata: Metadata = {
  title: "Exam Portal",
  description: "Your exam portal",
};

export default function ExamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100">
      {/* Fixed navbar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-md border-b border-b-gray-300 flex items-center z-30">
        <div className="mx-auto px-3 sm:px-6 lg:px-8 flex justify-between items-center w-full">
          <div className="flex items-end gap-1">
            <h1 className="text-3xl font-bold text-indigo-700 transition duration-300">
              E
              <span className="text-3xl font-bold text-gray-800 transition duration-300">
                valus
              </span>
            </h1>
          </div>
          {/* User info on the right */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 md:w-9 md:h-9 bg-indigo-200 text-indigo-800 rounded-full flex items-center justify-center font-bold text-sm shadow-inner">
                U
              </div>
              <h1 className="text-xs md:text-base font-bold text-gray-600">
                John Doe
              </h1>
            </div>
          </div>
        </div>
      </header>
      {/* Main content area with top padding equal to navbar height */}
      <main className="flex-1 pt-16 overflow-y-auto">{children}</main>
    </div>
  );
}
