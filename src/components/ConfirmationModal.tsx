"use client";

interface ConfirmationModalProps {
  title: string;
  message: string;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
  children?: React.ReactNode;
}

export default function ConfirmationModal({
  title,
  message,
  isOpen,
  onConfirm,
  onCancel,
  className,
  children,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-40 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg p-6 w-[90%] shadow-xl text-center space-y-4 ${className}`}>
        <h2 className="text-3xl font-semibold text-gray-800">{title}</h2>
        <p className="text-gray-600 text-sm">{message}</p>
        {children}
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={onCancel}
            className="w-full max-w-64 font-bold px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="w-full max-w-64 font-bold px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
