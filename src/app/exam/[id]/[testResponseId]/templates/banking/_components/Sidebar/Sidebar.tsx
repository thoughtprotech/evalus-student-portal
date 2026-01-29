import clsx from "clsx";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import Legend from "./Legend";
import QuestionIndex from "./QuestionIndex";
import {
  QuestionsMetaDataInterface,
  SectionsMetaDataInterface,
} from "@/utils/api/types";
import { Dispatch, SetStateAction } from "react";
import WelcomeChip from "../Header/_components/WelcomeChip";

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  questionsMeta,
  // handleSubmit,
  handleJumpTo,
  currentIndex,
  currentSection,
  userName
}: {
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  questionsMeta: QuestionsMetaDataInterface[];
  // handleSubmit: () => void;
  handleJumpTo: (index: number, questionId: number) => void;
  currentIndex: number;
  currentSection: SectionsMetaDataInterface;
  userName: string;
}) {
  return (
    <aside
      className={clsx(
        // common styles
        "bg-white border-l border-l-black flex flex-col gap-2 relative",
        // positioning
        "absolute lg:static w-full h-full transform transition-transform duration-300 z-50",
        // mobile open/closed
        sidebarOpen
          ? "translate-x-0 md:w-80 transition-all"
          : "translate-x-full md:w-0 transition-all",
      )}
    >
      {/* Toggle Button */}
      <div
        className={`w-5 h-12 rounded-md border-2 border-gray-500 absolute top-1/2 -translate-y-1/2 hidden lg:block ${
          sidebarOpen ? "-left-5" : "-left-8"
        } bg-zinc-700 cursor-pointer`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? (
          <ChevronRight className="w-full h-full text-gray-200" />
        ) : (
          <ChevronLeft className="w-full h-full text-gray-200" />
        )}
      </div>
      {sidebarOpen && (
        <div className="w-full h-full flex flex-col justify-between">
          <div className="flex flex-col gap-4 h-full">
            {/* <div className="flex items-center space-x-4">
              <div className="md:hidden">
                <div onClick={() => setSidebarOpen(!sidebarOpen)}>
                  {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </div>
              </div>
            </div> */}
            <WelcomeChip userName={userName} />
            {/* Legend */}
            <Legend questionsMeta={questionsMeta} />
            <QuestionIndex
              questionsMeta={questionsMeta}
              handleJumpTo={handleJumpTo}
              currentIndex={currentIndex}
            />
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
