"use client";

import { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import { fetchQuestionsAction } from "@/app/actions/admin/questions";
import Loader from "@/components/Loader";
import Link from "next/link";
import Modal from "@/components/Modal";
import PageHeader from "@/components/PageHeader";
import PaginationControls from "@/components/PaginationControls";
import { useRouter } from "next/navigation";
import { GetAdminQuestionListResponse } from "@/utils/api/types";

const QuestionTable = ({
  data,
  page,
  pageSize,
}: {
  data: GetAdminQuestionListResponse[];
  page: number;
  pageSize: number;
}) => (
  <tbody className="divide-y divide-gray-200">
    {data.length > 0 ? (
      data.map((q, idx) => (
        <tr key={q.questionId} className="hover:bg-gray-50">
          {/* Serial number = current page offset + local index */}
          <td className="px-6 py-4 text-sm text-gray-700">
            {(page - 1) * pageSize + idx + 1}
          </td>
          <td className="px-6 py-4 text-sm text-indigo-600">
            <Link href={`/admin/questions/${q.questionId}`}>
              {q.questionOptions?.[0]?.questionText || "No Question Text"}
            </Link>
          </td>
          <td className="px-6 py-4 text-sm text-gray-700">
            {q.subject?.subjectName || "—"}
          </td>
          <td className="px-6 py-4 text-sm text-gray-700">
            {q.questionDifficultyLevelId}
          </td>
          <td className="px-6 py-4 text-sm text-gray-500">
            {q.createdDate ? new Date(q.createdDate).toLocaleDateString() : "—"}
          </td>
        </tr>
      ))
    ) : (
      <tr>
        <td colSpan={5} className="px-6 py-4 text-center text-gray-500 italic">
          No questions found
        </td>
      </tr>
    )}
  </tbody>
);

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<GetAdminQuestionListResponse[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  // Fetch questions
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetchQuestionsAction();
        if (mounted && res.status === 200 && Array.isArray(res.data)) {
          setQuestions(res.data);
        }
      } catch (err) {
        console.error("Error fetching questions:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredQuestions = questions.filter((q) =>
    q?.questionOptions?.[0]?.questionText
      ?.toLowerCase()
      .includes(query.toLowerCase())
  );

  const total = filteredQuestions.length;
  const slice = filteredQuestions.slice((page - 1) * pageSize, page * pageSize);

  const onSubmit = () => {
    setIsModalOpen(false);
  };

  if (loading) return <Loader />;

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <PageHeader
        icon={<HelpCircle className="w-6 h-6 text-indigo-600" />}
        title="Questions"
        onNewClick={() => router.push("/admin/questions/new")}
        onSearch={(val) => setQuery(val)}
      />

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
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
              </tr>
            </thead>
            <QuestionTable data={slice} page={page} pageSize={pageSize} />
          </table>
        </div>
      </div>

      <Modal
        title="Create Question"
        isOpen={isModalOpen}
        closeModal={() => setIsModalOpen(false)}
      >
        <div className="w-full min-h-64 flex">
          {/* Left panel */}
          <div className="w-1/4 border-r border-gray-300 pr-4">
            <div className="flex flex-col gap-4">
              {[
                {
                  label: "Select Subject",
                  options: ["Subject 1", "Subject 2", "Subject 3"],
                },
                {
                  label: "Select Topic",
                  options: ["Topic 1", "Topic 2", "Topic 3"],
                },
                {
                  label: "Select Question Type",
                  options: ["Type 1", "Type 2", "Type 3"],
                },
                {
                  label: "Select Language",
                  options: ["English", "Telegu", "Hindi"],
                },
              ].map((field, idx) => (
                <div key={idx} className="flex flex-col items-start">
                  <h1 className="text-gray-600 font-bold">{field.label}</h1>
                  <select className="w-full px-4 py-2 rounded-md border border-gray-300 cursor-pointer">
                    {field.options.map((opt, i) => (
                      <option key={i} value={opt.toLowerCase()}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              <div className="flex flex-col items-start">
                <h1 className="text-gray-600 font-bold">Current No.</h1>
                <h1>1</h1>
              </div>
              <div className="flex flex-col items-start">
                <h1 className="text-gray-600 font-bold">Total Questions</h1>
                <h1>10</h1>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="w-3/4 px-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-gray-600 font-bold">Type Question</label>
              <textarea className="w-full h-64 rounded-md border border-gray-300 px-4 py-2" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-gray-600 font-bold">Correct Answer</label>
              <input className="w-full rounded-md border border-gray-300 px-4 py-2" />
            </div>

            <div className="flex justify-end gap-4">
              <div>
                <input
                  type="file"
                  id="document-upload"
                  className="hidden"
                  onChange={(e) => {
                    // handle file upload
                    console.log(e.target.files);
                  }}
                />
                <label
                  htmlFor="document-upload"
                  className="inline-flex items-center px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-md cursor-pointer transition-colors duration-300"
                >
                  Document Upload
                </label>
              </div>
              <button
                className="px-6 py-2 rounded-md bg-indigo-500 hover:bg-indigo-600 duration-300 text-white font-bold cursor-pointer"
                onClick={onSubmit}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
