"use client";
import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  Search,
} from "lucide-react";

interface PaginatedTableProps<T> {
  data: T[];
  columns: { key: keyof T; label: string }[];
  rowsPerPageOptions?: number[];
}

type FilterCondition = "contains" | "equals" | "startsWith" | "endsWith";

export default function PaginatedTable<T extends Record<string, any>>({
  data,
  columns,
  rowsPerPageOptions = [10, 15, 20, 50],
}: PaginatedTableProps<T>) {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<
    Record<string, { condition: FilterCondition; value: string }>
  >({});
  const [globalSearch, setGlobalSearch] = useState("");
  const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);

  const filterRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setActiveFilterCol(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const applyFilter = (
    key: string,
    condition: FilterCondition,
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [key]: { condition, value } }));
    setActiveFilterCol(null);
  };

  const resetFilter = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: { condition: "contains", value: "" },
    }));
  };

  const clearFilter = (key: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilters({});
    setGlobalSearch("");
  };

  const filteredData = useMemo(() => {
    let filtered = data.filter((row) => {
      return Object.entries(filters).every(([key, { condition, value }]) => {
        if (!value) return true;
        const cell = String(row[key as keyof T] ?? "").toLowerCase();
        const val = value.toLowerCase();

        switch (condition) {
          case "contains":
            return cell.includes(val);
          case "equals":
            return cell === val;
          case "startsWith":
            return cell.startsWith(val);
          case "endsWith":
            return cell.endsWith(val);
          default:
            return true;
        }
      });
    });

    if (globalSearch.trim()) {
      const term = globalSearch.toLowerCase();
      filtered = filtered.filter((row) =>
        Object.values(row).some((v) =>
          String(v ?? "")
            .toLowerCase()
            .includes(term)
        )
      );
    }

    return filtered;
  }, [data, filters, globalSearch]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm relative font-sans">
      {/* Top Controls */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Rows per page:</span>
            <select
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(1);
              }}
            >
              {rowsPerPageOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <span>
            Page <b>{page}</b> of <b>{totalPages || 1}</b> | Total:{" "}
            <b>{filteredData.length}</b>
          </span>

          <button
            disabled={page === 1}
            className="p-1.5 border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-100"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            disabled={page === totalPages || totalPages === 0}
            className="p-1.5 border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-100"
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Right Controls: Search + Filters */}
        <div className="flex items-center gap-3 text-sm">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-2 top-2.5 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search..."
              className="pl-7 pr-2 py-1.5 border border-gray-300 rounded-md text-sm w-48"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
          </div>

          {/* <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 border border-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-100"
          >
            <SlidersHorizontal size={14} />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button> */}

          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 border border-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-100"
          >
            <RotateCcw size={14} />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-200">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key as string}
                  className="px-3 py-2 text-left relative"
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    <button
                      className="text-gray-400 hover:text-gray-600"
                      onClick={() =>
                        setActiveFilterCol(
                          activeFilterCol === (col.key as string)
                            ? null
                            : (col.key as string)
                        )
                      }
                    >
                      <Filter size={14} />
                    </button>

                    {/* Filter Popup */}
                    {activeFilterCol === col.key && showFilters && (
                      <div
                        ref={filterRef}
                        className="absolute z-10 top-8 left-0 bg-white border border-gray-300 rounded-md shadow-lg p-3 w-48"
                      >
                        <select
                          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm mb-2"
                          value={
                            filters[col.key as string]?.condition || "contains"
                          }
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              [col.key]: {
                                condition: e.target.value as FilterCondition,
                                value: prev[col.key as string]?.value || "",
                              },
                            }))
                          }
                        >
                          <option value="contains">Contains</option>
                          <option value="equals">Equals</option>
                          <option value="startsWith">Starts With</option>
                          <option value="endsWith">Ends With</option>
                        </select>

                        <input
                          type="text"
                          placeholder="Filter..."
                          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm mb-2"
                          value={filters[col.key as string]?.value || ""}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              [col.key]: {
                                ...prev[col.key as string],
                                value: e.target.value,
                              },
                            }))
                          }
                        />

                        <div className="flex justify-between">
                          <button
                            onClick={() =>
                              applyFilter(
                                col.key as string,
                                filters[col.key as string]?.condition ||
                                  "contains",
                                filters[col.key as string]?.value || ""
                              )
                            }
                            className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
                          >
                            Apply
                          </button>
                          <button
                            onClick={() => resetFilter(col.key as string)}
                            className="bg-gray-200 px-2 py-1 rounded text-xs"
                          >
                            Reset
                          </button>
                          <button
                            onClick={() => clearFilter(col.key as string)}
                            className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr
                  key={idx}
                  className={`border-b border-gray-200 hover:bg-blue-50 ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key as string}
                      className="max-w-32 px-3 py-2 truncate"
                    >
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-4 text-gray-500"
                >
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
