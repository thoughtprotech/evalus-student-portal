"use client";

import React from "react";
import { Wrench, Hammer, ChevronLeft } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function UnderConstructionPage() {
  const router = useRouter();

  return (
    <div className="absolute inset-1 flex items-center justify-center p-6">
      <div className="relative text-center bg-white rounded-2xl shadow-xl p-10 max-w-md w-full">
        {/* Decorative Icons */}
        <Wrench
          className="absolute -top-6 -left-6 text-yellow-500 animate-pulse"
          size={48}
        />
        <Hammer
          className="absolute -bottom-6 -right-6 text-yellow-500 animate-pulse"
          size={48}
        />

        {/* Illustration */}
        <div className="w-full flex items-center justify-center mb-6">
          <Image
            src="/under_construction.svg"
            alt="Under Construction"
            width={200}
            height={200}
            priority
          />
        </div>

        {/* Headings */}
        <h1 className="text-3xl font-extrabold text-gray-800 mb-4">
          🚧 Page Under Construction 🚧
        </h1>
        <p className="text-gray-500 mb-6">
          We're working hard to bring you something awesome. Stay tuned!
        </p>

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg shadow-md transition"
        >
          <ChevronLeft className="mr-2 cursor-pointer" size={20} />
          Go Back
        </button>
      </div>
    </div>
  );
}
