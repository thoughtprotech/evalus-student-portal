"use client";

import CandidateImport from "../CandidateImport";
import PageHeader from "@/components/PageHeader";
import { User } from "lucide-react";
import React from "react";

export default function CandidateImportPage() {
  return (
    <div className="p-4 bg-gray-50 h-full min-h-0 flex flex-col">
      <div className="sticky top-0 z-20 bg-gray-50 pt-2 pb-3 flex-none">
        <PageHeader icon={<User className="w-6 h-6 text-indigo-600" />} title="Candidate Import" onSearch={() => {}} showSearch={false} />
      </div>
      <div className="bg-white shadow rounded-lg p-4 flex-1 min-h-0 overflow-auto">
        <CandidateImport />
      </div>
    </div>
  );
}
