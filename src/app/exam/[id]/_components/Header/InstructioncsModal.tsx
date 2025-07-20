import Modal from "@/components/Modal";
import { InstructionData } from "../../../instructions/[id]/page";

export default function InstructionsModal({
  instructionData,
  showInstructionsModal,
  setShowInstructionsModal,
}: {
  instructionData: InstructionData | null;
  showInstructionsModal: any;
  setShowInstructionsModal: any;
}) {
  return (
    <Modal
      title="Instructions"
      isOpen={showInstructionsModal}
      closeModal={() => setShowInstructionsModal(false)}
      className={"max-w-3/4 w-full"}
    >
      <div className="mb-8 space-y-4">
        {instructionData?.instructions.map((inst, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <span className="flex items-center justify-center text-gray-600 font-bold">
                {index + 1}
              </span>
            </div>
            <p className="text-base text-start font-bold">{inst}</p>
          </div>
        ))}
      </div>
      <button
        className="w-full max-w-64 px-4 py-2 rounded-md cursor-pointer shadow-md bg-blue-600 text-white font-bold"
        onClick={() => setShowInstructionsModal(false)}
      >
        Done
      </button>
    </Modal>
  );
}
