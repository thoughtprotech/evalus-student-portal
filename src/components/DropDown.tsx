"use client";

import { ReactNode, useRef, useState, useEffect } from "react";

interface DropDownProps {
  face: ReactNode;
  children: ReactNode;
}

export function DropDown({ face, children }: DropDownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative w-fit">
      <div
        className="cursor-pointer"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {face}
      </div>

      <div
        className={`absolute z-50 top-12 -right-3 w-fit transition-all duration-300 origin-top-left ${
          isOpen
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      >
        {children}
      </div>
    </div>
  );
}
