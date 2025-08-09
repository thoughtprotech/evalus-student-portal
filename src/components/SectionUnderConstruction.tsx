"use client";

import React from "react";
import { Wrench, Hammer } from "lucide-react";
import Image from "next/image";

interface SectionUnderConstructionProps {
  title?: string;
  message?: string;
}

export default function SectionUnderConstruction({
  title = "🚧 Section Under Construction 🚧",
  message = "We're working on this section. Check back soon!",
}: SectionUnderConstructionProps) {
  return (
    <div className="relative bg-white rounded-xl shadow-md p-8 border border-gray-100">
      {/* Decorative Icons */}
      <Wrench
        className="absolute -top-4 -left-4 text-yellow-500 animate-pulse"
        size={36}
      />
      <Hammer
        className="absolute -bottom-4 -right-4 text-yellow-500 animate-pulse"
        size={36}
      />

      {/* Illustration */}
      <div className="flex items-center justify-center mb-4">
        <Image
          src="/under_construction.svg"
          alt="Under Construction"
          width={150}
          height={150}
          priority
        />
      </div>

      {/* Headings */}
      <h2 className="text-xl font-bold text-gray-800 text-center mb-2">
        {title}
      </h2>
      <p className="text-gray-500 text-center">{message}</p>
    </div>
  );
}
