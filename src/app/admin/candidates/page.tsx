"use client";

import { useEffect, useState } from "react";
import { User, Mail, Briefcase, Calendar } from "lucide-react";
import { fetchCandidatesAction } from "@/app/actions/admin/candidates";
import Loader from "@/components/Loader";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PaginationControls from "@/components/PaginationControls";

interface Candidate {
  id: number;
  name: string;
  email: string;
  appliedRole: string;
  appliedAt: string;
}

const COLUMNS = [
  { key: "id", label: "ID", icon: <User className="w-4 h-4 mr-1" /> },
  { key: "name", label: "Name" },
  { key: "email", label: "Email", icon: <Mail className="w-4 h-4 mr-1" /> },
  {
    key: "appliedRole",
    label: "Role",
    icon: <Briefcase className="w-4 h-4 mr-1" />,
  },
  {
    key: "appliedAt",
    label: "Applied At",
    icon: <Calendar className="w-4 h-4 mr-1" />,
  },
];

export default function CandidatesPage() {
  const [cands, setCands] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetchCandidatesAction();
      if (res.status === "success" && Array.isArray(res.data)) {
        setCands(res.data);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <Loader />;

  const filteredAnnouncements = cands.filter((a) =>
    a.name.toLowerCase().includes(query.toLowerCase())
  );

  const total = filteredAnnouncements.length;
  const slice = filteredAnnouncements.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <PageHeader
        icon={<User className="w-6 h-6 text-purple-600" />}
        title="Candidates"
        newLink="/admin/candidates/new"
        onSearch={(e) => setQuery(e)}
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
                  icon: <User className="w-4 h-4 mr-1" />,
                },
                { key: "name", label: "Name" },
                {
                  key: "email",
                  label: "Email",
                  icon: <Mail className="w-4 h-4 mr-1" />,
                },
                {
                  key: "appliedRole",
                  label: "Role",
                  icon: <Briefcase className="w-4 h-4 mr-1" />,
                },
                {
                  key: "appliedAt",
                  label: "Applied At",
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
            {slice.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-700">{c.id}</td>
                <td className="px-6 py-4 text-sm text-purple-600">
                  <Link href={`/admin/candidates/${c.id}`}>{c.name}</Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{c.email}</td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {c.appliedRole}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(c.appliedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
