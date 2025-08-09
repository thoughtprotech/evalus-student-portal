"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Calendar } from "lucide-react";
import { fetchTestsAction } from "@/app/actions/admin/tests";
import Loader from "@/components/Loader";
import PageHeader from "@/components/PageHeader";
import PaginationControls from "@/components/PaginationControls";
import Link from "next/link";
import { GetAdminTestList } from "@/utils/api/types";

const COLUMNS = [
  {
    key: "serial",
    label: "S.No",
    icon: <ClipboardList className="w-4 h-4 mr-1" />,
  },
  { key: "testName", label: "Test Name" },
  { key: "testCategoryId", label: "Category ID" },
  {
    key: "testStartDate",
    label: "Start Date",
    icon: <Calendar className="w-4 h-4 mr-1" />,
  },
];

export default function TestsPage() {
  const [data, setData] = useState<GetAdminTestList[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetchTestsAction();
      if (res.status === 200 && Array.isArray(res.data)) {
        setData(res.data);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <Loader />;

  const filteredTests = data.filter((t) =>
    t.testName?.toLowerCase().includes(query.toLowerCase())
  );

  const total = filteredTests.length;
  const slice = filteredTests.slice((page - 1) * pageSize, page * pageSize);

  const renderTable = (rows: GetAdminTestList[]) => (
    <div className="overflow-x-auto bg-white shadow rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div className="flex items-center">
                  {col.icon}
                  {col.label}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.length > 0 ? (
            rows.map((item, idx) => (
              <tr key={item.testId} className="hover:bg-gray-50">
                {/* Serial number */}
                <td className="px-6 py-4 text-sm text-gray-700">
                  {(page - 1) * pageSize + idx + 1}
                </td>

                {/* Test name */}
                <td className="px-6 py-4 text-sm text-indigo-600">
                  <Link href={`/admin/tests/${item.testId}`}>
                    {item.testName || "—"}
                  </Link>
                </td>

                {/* Category */}
                <td className="px-6 py-4 text-sm text-gray-700">
                  {item.testCategoryId ?? "—"}
                </td>

                {/* Start Date */}
                <td className="px-6 py-4 text-sm text-gray-500">
                  {item.testStartDate
                    ? new Date(item.testStartDate).toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={COLUMNS.length}
                className="px-6 py-4 text-center text-gray-500 italic"
              >
                No tests found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <PageHeader
        icon={<ClipboardList className="w-6 h-6 text-blue-600" />}
        title="Tests"
        newLink="/admin/tests/new"
        onSearch={(e) => setQuery(e)}
      />

      <div>
        <PaginationControls
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {renderTable(slice)}
      </div>
    </div>
  );
}
