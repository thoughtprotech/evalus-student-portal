"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import SearchBar from "./SearchBar";

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  newLink?: string;
  onSearch: (e: string) => void;
  showSearch?: boolean;
  onNewClick?: () => void;
  searchValue?: string;
}

export default function PageHeader({
  icon,
  title,
  newLink,
  onSearch,
  showSearch = true,
  onNewClick,
  searchValue,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold flex items-center text-gray-800">
        {icon}
        <span className="ml-2">{title}</span>
      </h1>
      <div className="flex items-center gap-5">
        {showSearch && (
          <SearchBar onSearch={onSearch} value={searchValue} className="px-4 py-2" />
        )}
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
    </div>
  );
}
