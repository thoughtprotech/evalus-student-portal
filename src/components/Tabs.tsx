"use client";

import { Info } from "lucide-react";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
  useEffect,
} from "react";
import OnHover from "./OnHover";
import QuestionCountPreview from "@/app/exam/[id]/_components/QuestionCountPreview";

interface TabsContextType {
  activeIndex: number;
  setActiveIndex: Dispatch<SetStateAction<number>>;
}

const TabsContext = createContext<TabsContextType | null>(null);

interface TabsRootProps {
  defaultIndex?: number;
  children: ReactNode;
  onTabChange?: (index: number) => void;
}

export function TabsRoot({
  defaultIndex = 0,
  children,
  onTabChange,
}: TabsRootProps) {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);

  useEffect(() => {
    if (onTabChange) onTabChange(activeIndex);
  }, [activeIndex, onTabChange]);

  return (
    <TabsContext.Provider value={{ activeIndex, setActiveIndex }}>
      {children}
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  labels: string[];
  className?: string;
}

export function TabsList({ labels, className = "" }: TabsListProps) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("TabsList must be used within TabsRoot");

  return (
    <div className={`w-fit h-fit flex space-x-4 p-2 ${className}`}>
      {labels.map((label, index) => (
        <div
          key={index}
          className={`px-4 py-2 h-fit transition-colors duration-300 cursor-pointer text-xs flex items-center gap-2 ${
            ctx.activeIndex === index
              ? "bg-indigo-100 text-indigo-600 rounded-md"
              : "text-gray-700 hover:text-indigo-600"
          }`}
        >
          <button onClick={() => ctx.setActiveIndex(index)}>{label}</button>
          <OnHover
            trigger={
              <Info
                className={`w-4 h-4 ${
                  ctx.activeIndex === index
                    ? "text-indigo-600 rounded-md"
                    : "text-gray-700"
                }`}
              />
            }
            dropdownClassName="max-w-xs"
          >
            <QuestionCountPreview
              answeredCount={0}
              unansweredCount={0}
              notVisitedCount={12}
              reviewCount={0}
              ansToReviewCount={0}
            />
          </OnHover>
        </div>
      ))}
    </div>
  );
}

interface TabsContentProps {
  children: ReactNode[];
  className?: string;
}

export function TabsContent({ children, className = "" }: TabsContentProps) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("TabsContent must be used within TabsRoot");

  return (
    <div className={`rounded-md ${className}`}>{children[ctx.activeIndex]}</div>
  );
}
