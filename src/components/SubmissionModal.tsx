import { ReactNode } from "react";

interface SubmissionModalProps {
  title: string;
  isOpen: boolean;
  children?: ReactNode;
}

export default function Modal({
  title,
  isOpen,
  children,
}: SubmissionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 rounded-xl bg-black/20 bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[90%] max-w-md shadow-xl text-center space-y-4">
        <h1 className="text-lg font-bold">{title}</h1>
        {children}
      </div>
    </div>
  );
}
