"use client";

interface Props { rowCount?: number }

// Lightweight skeleton matching AG Grid row density to avoid layout shift
export default function QuestionsGridSkeleton({ rowCount = 15 }: Props) {
  const rows = Array.from({ length: rowCount });
  return (
    <div className="relative h-full min-h-0">
      <div className="ag-theme-alpine ag-theme-evalus w-full h-full bg-white border border-gray-300 rounded-md overflow-hidden flex flex-col">
        {/* Header placeholder */}
        <div className="flex-none border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-2 flex items-center gap-4 animate-pulse">
          <div className="h-4 w-40 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
        {/* Rows */}
        <div className="flex-1 overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {rows.map((_, i) => (
              <li key={i} className="h-8 px-3 flex items-center gap-4 animate-pulse">
                <div className="h-3 w-5 bg-gray-200 rounded" />
                <div className="h-3 flex-1 bg-gray-200 rounded" />
                <div className="h-3 w-24 bg-gray-200 rounded hidden md:block" />
                <div className="h-3 w-16 bg-gray-200 rounded hidden md:block" />
                <div className="h-3 w-20 bg-gray-200 rounded hidden lg:block" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
