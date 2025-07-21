"use client";

import { useEffect, useState } from "react";
import { Edit, Tag, Calendar, HelpCircle, BarChart2 } from "lucide-react";
import { fetchQuestonsAction } from "@/app/actions/admin/questions";
import Loader from "@/components/Loader";
import Link from "next/link";
import Modal from "@/components/Modal";
import PageHeader from "@/components/PageHeader";
import PaginationControls from "@/components/PaginationControls";
import { TabsContent, TabsList, TabsRoot } from "@/components/Tabs";
import { useRouter } from "next/navigation";

interface Question {
  id: number;
  title: string;
  category: string;
  difficulty: string;
  createdAt: string;
}
export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  // fetch
  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetchQuestonsAction();
      if (res.status === 200 && Array.isArray(res.data)) {
        setQuestions(res.data);
      }
      setLoading(false);
    })();
  }, []);

  const filteredAnnouncements = questions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase())
  );

  const onSubmit = () => {
    setIsModalOpen(false);
  };

  if (loading) return <Loader />;

  const total = filteredAnnouncements.length;
  const slice = filteredAnnouncements.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <PageHeader
        icon={<HelpCircle className="w-6 h-6 text-indigo-600" />}
        title="Questions"
        onNewClick={() => router.push("/admin/questions/new")}
        onSearch={(e) => setQuery(e)}
      />

      <TabsRoot defaultIndex={0}>
        <div className="flex justify-between items-center mb-4">
          <TabsList labels={["Questions", "Import Question", "Subject"]} />
        </div>

        <TabsContent>
          {/* 0: Test Report */}
          <div>
            <PaginationControls
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20, 50]}
            />

            <div className="overflow-x-auto bg-white shadow rounded-md border border-gray-300">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {[
                      {
                        key: "id",
                        label: "ID",
                        icon: <Edit className="w-4 h-4 mr-1" />,
                      },
                      { key: "title", label: "Title" },
                      {
                        key: "category",
                        label: "Category",
                        icon: <Tag className="w-4 h-4 mr-1" />,
                      },
                      { key: "difficulty", label: "Difficulty" },
                      {
                        key: "createdAt",
                        label: "Created At",
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
                  {slice.map((q) => (
                    <tr key={q.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {q.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-indigo-600">
                        <Link href={`/admin/questions/${q.id}`}>{q.title}</Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {q.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {q.difficulty}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <PaginationControls
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20, 50]}
            />

            <div className="overflow-x-auto bg-white shadow rounded-md border border-gray-300">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {[
                      {
                        key: "id",
                        label: "ID",
                        icon: <Edit className="w-4 h-4 mr-1" />,
                      },
                      { key: "title", label: "Title" },
                      {
                        key: "category",
                        label: "Category",
                        icon: <Tag className="w-4 h-4 mr-1" />,
                      },
                      { key: "difficulty", label: "Difficulty" },
                      {
                        key: "createdAt",
                        label: "Created At",
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
                  {slice.map((q) => (
                    <tr key={q.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {q.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-indigo-600">
                        <Link href={`/admin/questions/${q.id}`}>{q.title}</Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {q.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {q.difficulty}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <PaginationControls
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20, 50]}
            />

            <div className="overflow-x-auto bg-white shadow rounded-md border border-gray-300">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {[
                      {
                        key: "id",
                        label: "ID",
                        icon: <Edit className="w-4 h-4 mr-1" />,
                      },
                      { key: "title", label: "Title" },
                      {
                        key: "category",
                        label: "Category",
                        icon: <Tag className="w-4 h-4 mr-1" />,
                      },
                      { key: "difficulty", label: "Difficulty" },
                      {
                        key: "createdAt",
                        label: "Created At",
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
                  {slice.map((q) => (
                    <tr key={q.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {q.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-indigo-600">
                        <Link href={`/admin/questions/${q.id}`}>{q.title}</Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {q.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {q.difficulty}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <PaginationControls
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20, 50]}
            />

            <div className="overflow-x-auto bg-white shadow rounded-md border border-gray-300">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {[
                      {
                        key: "id",
                        label: "ID",
                        icon: <Edit className="w-4 h-4 mr-1" />,
                      },
                      { key: "title", label: "Title" },
                      {
                        key: "category",
                        label: "Category",
                        icon: <Tag className="w-4 h-4 mr-1" />,
                      },
                      { key: "difficulty", label: "Difficulty" },
                      {
                        key: "createdAt",
                        label: "Created At",
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
                  {slice.map((q) => (
                    <tr key={q.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {q.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-indigo-600">
                        <Link href={`/admin/questions/${q.id}`}>{q.title}</Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {q.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {q.difficulty}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </TabsRoot>

      <Modal
        title="Create Question"
        isOpen={isModalOpen}
        closeModal={() => setIsModalOpen(false)}
      >
        <div className="w-full min-h-64 flex">
          <div className="w-1/4 border-r border-r-gray-300 pr-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-start">
                <div>
                  <h1 className="text-gray-600 font-bold">Select Subject</h1>
                </div>
                <select
                  className="w-full px-4 py-2 rounded-md border border-gray-300 cursor-pointer"
                  name="subject"
                >
                  <option value="sub1">Subject 1</option>
                  <option value="sub2">Subject 2</option>
                  <option value="sub3">Subject 3</option>
                </select>
              </div>
              <div className="flex flex-col items-start">
                <div>
                  <h1 className="text-gray-600 font-bold">Select Topic</h1>
                </div>
                <select
                  className="w-full px-4 py-2 rounded-md border border-gray-300 cursor-pointer"
                  name="subject"
                >
                  <option value="sub1">Topic 1</option>
                  <option value="sub2">Topic 2</option>
                  <option value="sub3">Topic 3</option>
                </select>
              </div>
              <div className="flex flex-col items-start">
                <div>
                  <h1 className="text-gray-600 font-bold">
                    Select Question Type
                  </h1>
                </div>
                <select
                  className="w-full px-4 py-2 rounded-md border border-gray-300 cursor-pointer"
                  name="subject"
                >
                  <option value="sub1">Type 1</option>
                  <option value="sub2">Type 2</option>
                  <option value="sub3">Type 3</option>
                </select>
              </div>
              <div className="flex flex-col items-start">
                <div>
                  <h1 className="text-gray-600 font-bold">Select Language</h1>
                </div>
                <select
                  className="w-full px-4 py-2 rounded-md border border-gray-300 cursor-pointer"
                  name="subject"
                >
                  <option value="sub1">English</option>
                  <option value="sub2">Telegu</option>
                  <option value="sub3">Hindi</option>
                </select>
              </div>
              <div className="flex flex-col items-start">
                <div>
                  <h1 className="text-gray-600 font-bold">Current No.</h1>
                </div>
                <div>
                  <h1>1</h1>
                </div>
              </div>
              <div className="flex flex-col items-start">
                <div>
                  <h1 className="text-gray-600 font-bold">Total Questions</h1>
                </div>
                <div>
                  <h1>10</h1>
                </div>
              </div>
            </div>
          </div>
          <div className="w-3/4 px-4 flex flex-col gap-4">
            <div className="w-full flex flex-col gap-2">
              <div className="w-full h-full flex flex-col items-start gap-2">
                <h1 className="text-gray-600 font-bold">Type Question</h1>
                <textarea className="w-full h-64 rounded-md border border-gray-300 px-4 py-2" />
              </div>
              <div className="w-full h-full flex flex-col items-start gap-2">
                <h1 className="text-gray-600 font-bold">Correct Answer</h1>
                <input className="w-full rounded-md border border-gray-300 px-4 py-2" />
              </div>
            </div>
            <div className="w-full flex justify-end gap-4">
              <div>
                {/* Hidden real file input */}
                <input
                  type="file"
                  id="document-upload"
                  className="hidden"
                  onChange={(e) => {
                    /* handle e.target.files */
                  }}
                />

                {/* Styled label as button */}
                <label
                  htmlFor="document-upload"
                  className="inline-flex items-center px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-md cursor-pointer transition-colors duration-300"
                >
                  Document Upload
                </label>
              </div>
              <div>
                <button
                  className="px-6 py-2 rounded-md bg-indigo-500 hover:bg-indigo-600 duration-300 text-white font-bold cursor-pointer"
                  onClick={onSubmit}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
