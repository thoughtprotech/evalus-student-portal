"use client";

import { AlertTriangle, Info, CheckCircle } from "lucide-react";

interface ConfirmationModalProps {
  title: string;
  message: string;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
  children?: React.ReactNode;
  variant?: "default" | "danger" | "success";
  confirmText?: string;
  cancelText?: string;
  confirmDisabled?: boolean;
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
  confirmDisabled = false,
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
              variant === "danger" 
                ? "bg-red-100 text-red-600" 
                : variant === "success"
                ? "bg-green-100 text-green-600"
                : "bg-blue-100 text-blue-600"
            }`}
          >
            {variant === "danger" ? (
              <AlertTriangle className="w-6 h-6" />
            ) : variant === "success" ? (
              <CheckCircle className="w-6 h-6" />
            ) : (
              <Info className="w-6 h-6" />
            )}
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
          {cancelText && (
            <button
              onClick={onCancel}
              className="min-w-28 px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => {
              if (confirmDisabled) return;
              onConfirm();
            }}
            disabled={confirmDisabled}
            className={`min-w-28 px-4 py-2 rounded-md text-white ${
              confirmDisabled
                ? "bg-indigo-400 cursor-not-allowed opacity-70"
                : variant === "danger"
                ? "bg-red-600 hover:bg-red-700 cursor-pointer"
                : variant === "success"
                ? "bg-green-600 hover:bg-green-700 cursor-pointer"
                : "bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
