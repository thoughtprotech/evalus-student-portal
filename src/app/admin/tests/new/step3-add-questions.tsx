
"use client";

import ImportantInstructions from "@/components/ImportantInstructions";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTestDraft } from "@/contexts/TestDraftContext";
import { Key, MousePointerClick, FileSpreadsheet, FilePlus2 } from "lucide-react";

export default function Step3AddQuestions() {
  const router = useRouter();
  const search = useSearchParams();
  const [selectedCount, setSelectedCount] = useState<number>(0);
  const [importType, setImportType] = useState<string>("");

  // Read any returned selection from sessionStorage and clear it once consumed
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("admin:newTest:selectedQuestions");
      if (raw) {
        const data = JSON.parse(raw) as { questionIds?: number[] };
        const count = Array.isArray(data?.questionIds) ? data!.questionIds!.length : 0;
        setSelectedCount(count);
        // keep it for potential next steps; don't remove immediately
      }
    } catch {
      // ignore parse errors
    }
    // also react to step query param if present
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search?.toString()]);

  const { draft } = useTestDraft();
  const handleSelectQuestions = () => {
    // TODO: Route to question bank selection when available
    router.push("/admin/tests/new/questions/select");
  };

  const handleAddQuestions = () => {
    // TODO: Route to manual add questions when available
    router.push("/admin/tests/new/questions/add");
  };

  const handleImportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setImportType(val);
    if (!val) return;
    // Placeholder navigation; wire actual import flow later
    router.push(`/admin/tests/new/questions/import?type=${encodeURIComponent(val)}`);
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Selection banner */}
        {selectedCount > 0 && (
          <div className="lg:col-span-4">
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
              {selectedCount} question{selectedCount === 1 ? "" : "s"} selected from Question Bank. You can proceed to next step or refine selection.
            </div>
          </div>
        )}
        {/* Four cards in a single row */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card: Passkey (placeholder/inactive) */}
            <div className="rounded-md border bg-gray-50 flex flex-col h-full shadow-sm p-2">
              <div className="p-3 text-center flex-1 flex flex-col items-center">
                <Key className="mx-auto mb-2 h-8 w-8 text-gray-400" strokeWidth={1.5} />
                <p className="text-xs text-gray-600">
                  This is to associate new questions in the created test. You can
                  create questions of type: multiple choice, multiple options,
                  true/false, fill in the blanks, match following and match matrix.
                </p>
              </div>
              <div className="px-4 pb-4 mt-auto">
                <button disabled className="w-full rounded-md bg-green-400/60 text-white py-1 text-sm cursor-not-allowed">Add With Passkey</button>
              </div>
            </div>
            {/* Card: Select Questions (active) */}
            <div className="rounded-md border bg-gray-50 flex flex-col h-full shadow-sm p-2">
              <div className="p-3 text-center flex-1 flex flex-col items-center">
                <MousePointerClick className="mx-auto mb-2 h-8 w-8 text-gray-400" strokeWidth={1.5} />
                <p className="text-xs text-gray-600">
                  Directly add questions from the question bank. The selected set
                  of questions will be associated to the test.
                </p>
              </div>
              <div className="px-4 pb-4 mt-auto">
                <button onClick={handleSelectQuestions} className="w-full rounded-md bg-green-600 hover:bg-green-700 text-white py-1 text-sm">Select Question</button>
              </div>
            </div>
            {/* Card: Import (placeholder/inactive) */}
            <div className="rounded-md border bg-gray-50 flex flex-col h-full shadow-sm p-2">
              <div className="p-3 text-center flex-1 flex flex-col items-center">
                <FileSpreadsheet className="mx-auto mb-2 h-8 w-8 text-gray-400" strokeWidth={1.5} />
                <p className="text-xs text-gray-600">Add questions via import. Choose a source type.</p>
              </div>
              <div className="px-4 pb-4 mt-auto">
                <select
                  value={importType}
                  onChange={handleImportChange}
                  className="w-full rounded-md border border-gray-300 bg-white py-1 text-sm px-2"
                >
                  <option value="">Select Import Type</option>
                  <option value="xls">Import from xls</option>
                  <option value="xml">Import from xml (QTI)</option>
                </select>
              </div>
            </div>
            {/* Card: Add Questions (active) */}
            <div className="rounded-md border bg-gray-50 flex flex-col h-full shadow-sm p-2">
              <div className="p-3 text-center flex-1 flex flex-col items-center">
                <FilePlus2 className="mx-auto mb-2 h-8 w-8 text-gray-400" strokeWidth={1.5} />
                <p className="text-xs text-gray-600">
                  This is to associate new questions in the created test. You can
                  create questions of type: multiple choice, multiple options,
                  true/false, fill in the blanks, match following and match matrix.
                </p>
              </div>
              <div className="px-4 pb-4 mt-auto">
                <button onClick={handleAddQuestions} className="w-full rounded-md bg-green-600 hover:bg-green-700 text-white py-1 text-sm">Add Questions</button>
              </div>
            </div>
          </div>
        </div>
        {/* Right: Important Instructions */}
        <div className="lg:col-span-1">
          <ImportantInstructions
            title="Important Instructions"
            detail="This is to add questions in a created test. You can add questions using three methods: 1) Select predefined questions using question bank, 2) Import an excel sheet, incorporating multiple questions in one go, 3) Add new questions as per the user requirement."
          />
        </div>
      </div>
    </div>
  );
}
