"use client";

import { AlertTriangle, Info } from "lucide-react";

interface ConfirmationModalProps {
  title: string;
  message: string;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
  children?: React.ReactNode;
  variant?: "default" | "danger";
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmationModal({
  title,
  message,
  isOpen,
  onConfirm,
  onCancel,
  className,
  children,
  variant = "default",
  confirmText = "Confirm",
  cancelText = "Cancel",
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-7 ${className || ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex-shrink-0 rounded-full p-2 ${
              variant === "danger" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
            }`}
          >
            {variant === "danger" ? <AlertTriangle className="w-6 h-6" /> : <Info className="w-6 h-6" />}
          </div>
          <div className="flex-1">
            <h2 id="confirm-modal-title" className="text-xl font-semibold text-gray-900">
              {title}
            </h2>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
            {children ? <div className="mt-3 text-sm text-gray-700">{children}</div> : null}
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="min-w-28 px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`min-w-28 px-4 py-2 rounded-md text-white cursor-pointer ${
              variant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
