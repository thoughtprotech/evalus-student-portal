"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  newLink?: string;
  onNewClick?: () => void;
}

export default function PageHeader({
  icon,
  title,
  newLink,
  onNewClick,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-2xl font-semibold flex items-center text-gray-800">
        {icon}
        <span className="ml-2">{title}</span>
      </h1>
      {newLink || onNewClick ? (
        newLink ? (
          <Link href={newLink}>
            <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition cursor-pointer">
              <PlusCircle className="w-5 h-5 mr-2" />
              New
            </button>
          </Link>
        ) : (
          <button
            onClick={onNewClick}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            New
          </button>
        )
      ) : null}
    </div>
  );
}
