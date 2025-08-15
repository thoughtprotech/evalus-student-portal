"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
  showTotalCount?: boolean;
}

export default function PaginationControls({
  page,
  pageSize,
  total,
  pageSizeOptions = [15, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  showTotalCount,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center text-sm text-gray-700">
        <span className="font-semibold mr-2">Rows per page:</span>
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
            onPageChange(1);
          }}
          className="ml-0 rounded-md border border-gray-300 px-2 py-1 cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          {pageSizeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center space-x-2 text-gray-700">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="p-2 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm">
          <span className="font-semibold">Page</span>
          <span className="mx-1 inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full bg-blue-50 text-blue-700 font-semibold">
            {page}
          </span>
          <span className="font-semibold">of</span>
          <span className="ml-1 inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full bg-gray-100 text-gray-800 font-semibold">
            {totalPages}
          </span>
        </span>
  {Boolean(showTotalCount) && (
          <span className="text-sm text-gray-600 ml-2 whitespace-nowrap">
            Total: <span className="font-semibold">{total}</span>
          </span>
        )}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="p-2 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
