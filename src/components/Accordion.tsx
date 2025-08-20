"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";

interface AccordionProps {
  title: string;
  /** Initial open state (uncontrolled). */
  open?: boolean;
  /** Controlled open state. When provided, component becomes controlled. */
  isOpen?: boolean;
  /** Callback fired when user toggles the accordion. */
  onToggle?: (nextOpen: boolean) => void;
  children: React.ReactNode;
}

export default function Accordion({
  title,
  open = false,
  isOpen: isOpenProp,
  onToggle,
  children,
}: AccordionProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(open);
  const isControlled = typeof isOpenProp === "boolean";
  const isOpen = isControlled ? (isOpenProp as boolean) : uncontrolledOpen;

  const handleToggle = () => {
    if (isControlled) {
      onToggle?.(!isOpen);
    } else {
      setUncontrolledOpen((v) => !v);
    }
  };

  return (
    <div className="w-full rounded-md border border-gray-200 bg-white">
      <button
        onClick={handleToggle}
        className={clsx(
          "w-full flex items-center justify-between px-4 py-2",
          isOpen
            ? "bg-indigo-50 text-indigo-700 border-b border-indigo-100"
            : "bg-gray-50 text-gray-800 border-b border-gray-200 hover:bg-gray-100"
        )}
      >
  <span className="text-base font-semibold">{title}</span>
        {isOpen ? (
          <ChevronUp className="text-current" />
        ) : (
          <ChevronDown className="text-current" />
        )}
      </button>

      <div
        className={clsx(
          "px-4 text-gray-700 text-sm transition-all duration-300",
          {
            "pt-3 pb-4 max-h-[2000px] opacity-100": isOpen,
            "pt-0 pb-0 max-h-0 overflow-hidden opacity-0": !isOpen,
          }
        )}
      >
        {children}
      </div>
    </div>
  );
}
