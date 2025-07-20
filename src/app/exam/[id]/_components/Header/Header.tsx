import { Info, ShieldQuestion } from "lucide-react";

export default function Header({
  setShowQuestionsModal,
  setShowInstructionsModal,
}: {
  setShowQuestionsModal: any;
  setShowInstructionsModal: any;
}) {
  return (
    <div className="bg-gray-100 px-2 py-1 shadow-md border border-gray-300 space-y-4 flex justify-end">
      <div className="w-fit flex items-center gap-3 text-sm">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setShowQuestionsModal(true)}
        >
          <ShieldQuestion className="text-gray-600 w-4 h-4 cursor-pointer" />
          <div className="text-gray-600">
            <h1 className="text-xs">Question Paper</h1>
          </div>
        </div>
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setShowInstructionsModal(true)}
        >
          <Info className="text-gray-600 w-4 h-4 cursor-pointer" />
          <div className="text-gray-600">
            <h1 className="text-xs">Instructions</h1>
          </div>
        </div>
      </div>
    </div>
  );
}
