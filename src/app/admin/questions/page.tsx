"use client";

import { useEffect, useState } from "react";
import { Edit, Tag, Calendar, HelpCircle } from "lucide-react";
import { fetchQuestonsAction } from "@/app/actions/admin/questions";
import Loader from "@/components/Loader";
import Link from "next/link";
import Modal from "@/components/Modal";
import PageHeader from "@/components/PageHeader";
import PaginationControls from "@/components/PaginationControls";
import { useForm } from "react-hook-form";

interface Question {
  id: number;
  title: string;
  category: string;
  difficulty: string;
  createdAt: string;
}
interface FormValues {
  title: string;
  category: string;
  difficulty: string;
}

const CATEGORIES = ["Math", "Science", "History", "Literature"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm<FormValues>();

  // fetch
  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetchQuestonsAction();
      if (res.status === "success" && Array.isArray(res.data)) {
        setQuestions(res.data);
      }
      setLoading(false);
    })();
  }, []);

  const onSubmit = (data: FormValues) => {
    const newQ: Question = {
      id: questions.length + 1,
      ...data,
      createdAt: new Date().toISOString(),
    };
    setQuestions([newQ, ...questions]);
    reset();
    setIsModalOpen(false);
  };

  if (loading) return <Loader />;

  const total = questions.length;
  const slice = questions.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        icon={<HelpCircle className="w-6 h-6 text-indigo-600" />}
        title="Questions"
        onNewClick={() => setIsModalOpen(true)}
      />

      <Modal title="Create Question" isOpen={isModalOpen}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              {...register("title", { required: true })}
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              {...register("category", { required: true })}
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Difficulty
            </label>
            <select
              {...register("difficulty", { required: true })}
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-between space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="w-full px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer"
            >
              Create
            </button>
          </div>
        </form>
      </Modal>

      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[5, 10, 20, 50]}
      />

      <div className="overflow-x-auto bg-white shadow rounded-md">
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
                <td className="px-6 py-4 text-sm text-gray-700">{q.id}</td>
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
  );
}
