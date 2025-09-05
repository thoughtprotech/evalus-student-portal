import Modal from "@/components/Modal";

export default function InstructionsModal({
  title,
  isOpen,
  onClose,
  content,
}: {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  content: string;
}) {
  return (
    <Modal title={title} isOpen={isOpen} closeModal={onClose} className="max-w-2xl">
      <div className="text-sm text-gray-800 whitespace-pre-wrap text-left">
        {content}
      </div>
    </Modal>
  );
}
