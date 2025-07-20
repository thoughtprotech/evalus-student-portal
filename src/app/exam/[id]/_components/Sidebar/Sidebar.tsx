import clsx from "clsx";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import Legend from "./Legend";
import QuestionIndex from "./QuestionIndex";
import { QuestionsMetaResponse } from "@/utils/api/types";
import { Dispatch, SetStateAction } from "react";

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  questionsMeta,
  handleSubmit,
  handleJumpTo,
  currentIndex,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  questionsMeta: QuestionsMetaResponse[];
  handleSubmit: () => void;
  handleJumpTo: (index: number, questionId: number) => void;
  currentIndex: number;
}) {
  return (
    <aside
      className={clsx(
        // common styles
        "bg-white border-gray-300 shadow-md flex flex-col gap-2 p-4 relative",
        // positioning
        "absolute lg:static w-full h-full transform transition-transform duration-300 z-50",
        // mobile open/closed
        sidebarOpen
          ? "translate-x-0 md:w-80 transition-all"
          : "-translate-x-full md:translate-x-full md:w-0 transition-all"
      )}
    >
      <div
        className={`w-7 h-15 rounded-md border-2 border-gray-500 absolute top-1/2 -translate-y-1/2 hidden lg:block ${
          sidebarOpen ? "-left-5" : "-left-8"
        } bg-white cursor-pointer`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? (
          <ChevronRight className="w-full h-full text-gray-600" />
        ) : (
          <ChevronLeft className="w-full h-full text-gray-600" />
        )}
      </div>
      <div className="w-full h-full flex flex-col justify-between">
        <div className="flex flex-col gap-4 pl-2">
          <div className="flex items-center space-x-4">
            <div className="md:hidden">
              <div onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 md:w-12 md:h-12 bg-indigo-200 text-indigo-800 rounded-full flex items-center justify-center font-bold text-xl shadow-inner">
                U
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-800">
                  Welcome John Doe
                </h1>
              </div>
            </div>
          </div>
          {/* Legend */}
          <Legend questionsMeta={questionsMeta} />
          {/* Question Index */}
          <QuestionIndex
            questionsMeta={questionsMeta}
            handleJumpTo={handleJumpTo}
            currentIndex={currentIndex}
          />
        </div>
        {sidebarOpen && (
          <div className="w-full flex justify-center">
            <button
              onClick={handleSubmit}
              className="w-fit text-nowrap px-6 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md font-medium cursor-pointer mb-16 md:mb-0"
            >
              Submit Test
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
