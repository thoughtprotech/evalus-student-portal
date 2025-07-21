import clsx from "clsx";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Menu,
  ShieldQuestion,
  X,
} from "lucide-react";
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
  setShowQuestionsModal,
  setShowInstructionsModal,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  questionsMeta: QuestionsMetaResponse[];
  handleSubmit: () => void;
  handleJumpTo: (index: number, questionId: number) => void;
  currentIndex: number;
  setShowQuestionsModal: any;
  setShowInstructionsModal: any;
}) {
  return (
    <aside
      className={clsx(
        // common styles
        "bg-white border border-gray-300 shadow-md flex flex-col gap-2 p-4 relative rounded-md",
        // positioning
        "absolute lg:static w-full h-full transform transition-transform duration-300 z-50",
        // mobile open/closed
        sidebarOpen
          ? "translate-x-0 md:w-80 transition-all"
          : "-translate-x-full md:-translate-x-full md:w-0 transition-all"
      )}
    >
      <div
        className={`w-7 h-15 rounded-md border-2 border-gray-500 absolute top-1/2 -translate-y-1/2 hidden lg:block ${
          sidebarOpen ? "-right-5" : "-right-8"
        } bg-white cursor-pointer`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {!sidebarOpen ? (
          <ChevronRight className="w-full h-full text-gray-600" />
        ) : (
          <ChevronLeft className="w-full h-full text-gray-600" />
        )}
      </div>
      {sidebarOpen && (
        <div className="w-full h-full flex flex-col justify-between">
          <div className="flex flex-col gap-4 pl-2">
            {/* Legend */}
            {/* Question Index */}
            <QuestionIndex
              questionsMeta={questionsMeta}
              handleJumpTo={handleJumpTo}
              currentIndex={currentIndex}
            />
            <div>
              <h1 className="font-bold text-xl">Part A Analysis</h1>
              <Legend questionsMeta={questionsMeta} />
            </div>
          </div>
          {/* {sidebarOpen && (
            <div className="w-full flex justify-center">
              <button
                onClick={handleSubmit}
                className="w-fit text-nowrap px-6 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md font-medium cursor-pointer mb-16 md:mb-0"
              >
                Submit Test
              </button>
            </div>
          )} */}
        </div>
      )}
    </aside>
  );
}
