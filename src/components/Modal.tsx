import { X } from "lucide-react";
import { ReactNode } from "react";

interface SubmissionModalProps {
  title: string;
  isOpen: boolean;
  closeModal: () => void;
  children?: ReactNode;
  className?: string;
}

export default function Modal({
  title,
  isOpen,
  closeModal,
  children,
  className,
}: SubmissionModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 rounded-xl bg-black/20 bg-opacity-40 flex items-center justify-center z-50`}
    >
      <div className={`bg-white rounded-lg p-6 w-[90%] max-w-3/4 shadow-xl text-center space-y-4 ${className}`}>
        <div className="w-full border-b border-b-gray-300 pb-4 flex justify-between">
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
          </div>
          <div>
            <X className="cursor-pointer text-gray-500" onClick={closeModal} />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
