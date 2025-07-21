"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";

interface AccordionProps {
  title: string;
  open?: boolean;
  children: React.ReactNode;
}

export default function Accordion({
  title,
  open = false,
  children,
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(open);

  return (
    <div className="w-full rounded-xl cursor-pointer overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between cursor-pointer"
      >
        <span className="text-xl font-semibold mb-2 text-gray-800">
          {title}
        </span>
        {isOpen ? (
          <ChevronUp className="text-gray-600" />
        ) : (
          <ChevronDown className="text-gray-600" />
        )}
      </button>

      <div
        className={clsx(
          "px-4 pt-0 pb-4 text-gray-600 text-sm bg-white transition-all duration-300",
          {
            "max-h-[1000px] opacity-100": isOpen,
            "max-h-0 overflow-hidden opacity-0": !isOpen,
          }
        )}
      >
        {children}
      </div>
    </div>
  );
}
