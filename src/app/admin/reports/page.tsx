"use client";

import { useEffect, useState } from "react";
import { BarChart2, FileText, Calendar } from "lucide-react";
import { fetchReportsAction } from "@/app/actions/admin/reports";
import Loader from "@/components/Loader";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PaginationControls from "@/components/PaginationControls";

interface Report {
  id: number;
  name: string;
  type: string;
  generatedAt: string;
}

const COLUMNS = [
  { key: "id", label: "ID", icon: <FileText className="w-4 h-4 mr-1" /> },
  { key: "name", label: "Name" },
  { key: "type", label: "Type" },
  {
    key: "generatedAt",
    label: "Generated At",
    icon: <Calendar className="w-4 h-4 mr-1" />,
  },
];

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetchReportsAction();
      if (res.status === "success" && Array.isArray(res.data)) {
        setReports(res.data);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <Loader />;

  const total = reports.length;
  const slice = reports.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        icon={<BarChart2 className="w-6 h-6 text-indigo-600" />}
        title="Reports"
        newLink="/admin/reports/new"
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
              {[
                {
                  key: "id",
                  label: "ID",
                  icon: <FileText className="w-4 h-4 mr-1" />,
                },
                { key: "name", label: "Name" },
                { key: "type", label: "Type" },
                {
                  key: "generatedAt",
                  label: "Generated At",
                  icon: <Calendar className="w-4 h-4 mr-1" />,
                },
              ].map((col) => (
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
            {slice.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-700">{r.id}</td>
                <td className="px-6 py-4 text-sm text-indigo-600">
                  <Link href={`/admin/reports/${r.id}`}>{r.name}</Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{r.type}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(r.generatedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
