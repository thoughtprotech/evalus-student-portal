"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
  useEffect,
} from "react";

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
    <div
      className={`w-fit h-fit rounded-md flex space-x-4 border bg-white border-gray-300 shadow-md p-2 ${className}`}
    >
      {labels.map((label, index) => (
        <button
          key={index}
          className={`px-4 py-2 h-fit transition-colors duration-300 cursor-pointer text-xs ${
            ctx.activeIndex === index
              ? "bg-indigo-100 text-indigo-600 rounded-md"
              : "text-gray-700 hover:text-indigo-600"
          }`}
          onClick={() => ctx.setActiveIndex(index)}
        >
          {label}
        </button>
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
