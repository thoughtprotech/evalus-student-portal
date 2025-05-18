"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Calendar } from "lucide-react";
import { fetchTestsAction } from "@/app/actions/admin/tests";
import Loader from "@/components/Loader";
import PageHeader from "@/components/PageHeader";
import PaginationControls from "@/components/PaginationControls";
import Link from "next/link";

interface Test {
  id: number;
  name: string;
  subject: string;
  date: string;
}

const COLUMNS = [
  { key: "id", label: "ID", icon: <ClipboardList className="w-4 h-4 mr-1" /> },
  { key: "name", label: "Name" },
  { key: "subject", label: "Subject" },
  { key: "date", label: "Date", icon: <Calendar className="w-4 h-4 mr-1" /> },
];

export default function TestsPage() {
  const [data, setData] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetchTestsAction();
      if (res.status === "success" && Array.isArray(res.data)) {
        setData(res.data);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <Loader />;

  const total = data.length;
  const slice = data.slice((page-1)*pageSize, page*pageSize);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        icon={<ClipboardList className="w-6 h-6 text-blue-600" />}
        title="Tests"
        newLink="/admin/tests/new"
      />

      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {COLUMNS.map(col => (
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
            {slice.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-700">{item.id}</td>
                <td className="px-6 py-4 text-sm text-blue-600">
                  <Link href={`/admin/tests/${item.id}`}>{item.name}</Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{item.subject}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(item.date).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
