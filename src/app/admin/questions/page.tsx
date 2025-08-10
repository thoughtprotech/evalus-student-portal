"use client";

import { useEffect, useState } from "react";
import { Edit, Tag, Calendar, HelpCircle, BarChart2, Trash2, User } from "lucide-react";
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
  subject: string;
  topic: string;
  level: string;
  createdAt: string;
  updatedAt: string;
  additionalExplanation?: string;
  videoSolutionWeburl?: string;
  videoSolutionMobileurl?: string;
  questionOptionsJson?: string;
  questionCorrectAnswerJson?: string;
  language?: string;
  isActive?: number;
  createdBy?: string;
}
export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
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

  const filteredQuestions = questions.filter((q) =>
    q.title.toLowerCase().includes(query.toLowerCase()) ||
    q.subject.toLowerCase().includes(query.toLowerCase()) ||
    q.topic.toLowerCase().includes(query.toLowerCase()) ||
    (q.language && q.language.toLowerCase().includes(query.toLowerCase()))
  );

  const onSubmit = () => {
    setIsModalOpen(false);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedQuestions(slice.map((q: Question) => q.id));
    } else {
      setSelectedQuestions([]);
    }
  };

  const handleSelectQuestion = (questionId: number, checked: boolean) => {
    if (checked) {
      setSelectedQuestions(prev => [...prev, questionId]);
    } else {
      setSelectedQuestions(prev => prev.filter(id => id !== questionId));
    }
  };

  const handleBulkDelete = () => {
    // TODO: Implement bulk delete
    console.log("Deleting questions:", selectedQuestions);
    setSelectedQuestions([]);
  };

  if (loading) return <Loader />;

  const total = filteredQuestions.length;
  const slice = filteredQuestions.slice(
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
          {/* 0: Questions List */}
          <div>
            {selectedQuestions.length > 0 && (
              <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-md flex items-center justify-between">
                <span className="text-indigo-700">
                  {selectedQuestions.length} question(s) selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md transition-colors duration-300"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </button>
              </div>
            )}
            
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input 
                        type="checkbox" 
                        className="rounded"
                        checked={selectedQuestions.length === slice.length && slice.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      S.No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Question Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Topic
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Language
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Update Date
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {slice.map((q: Question, index: number) => (
                    <tr key={q.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <input 
                          type="checkbox" 
                          className="rounded"
                          checked={selectedQuestions.includes(q.id)}
                          onChange={(e) => handleSelectQuestion(q.id, e.target.checked)}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {(page - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-indigo-600">
                        <Link href={`/admin/questions/${q.id}`} title={q.title}>
                          <div className="max-w-xs truncate">
                            {q.title}
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {q.subject}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {q.topic}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          q.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                          q.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {q.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {q.language || 'EN'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(q.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 1: Import Question */}
          <div className="bg-white p-6 rounded-md shadow border border-gray-300">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Import Questions</h3>
              <p className="text-gray-500 mb-4">Upload a CSV or Excel file to import multiple questions at once.</p>
              <div className="flex justify-center">
                <label className="inline-flex items-center px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-md cursor-pointer transition-colors duration-300">
                  <input type="file" className="hidden" accept=".csv,.xlsx,.xls" />
                  Choose File
                </label>
              </div>
            </div>
          </div>

          {/* 2: Subject */}
          <div className="bg-white p-6 rounded-md shadow border border-gray-300">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Subject Management</h3>
              <p className="text-gray-500">Manage subjects and topics for questions organization.</p>
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
