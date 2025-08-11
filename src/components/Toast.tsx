"use client";

import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import React, { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose?: () => void;
  durationMs?: number; // auto-dismiss duration
}

export default function Toast({ message, type = "info", onClose, durationMs = 4000 }: ToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // enter animation
    const id = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!durationMs) return;
    const t = setTimeout(() => handleClose(), durationMs);
    return () => clearTimeout(t);
  }, [durationMs]);

  const styleMap: Record<ToastType, { bg: string; text: string; border: string; icon: React.ReactNode } > = {
    success: { bg: "bg-green-50", text: "text-green-900", border: "border-green-500", icon: <CheckCircle2 className="w-5 h-5 text-green-600" /> },
    error: { bg: "bg-red-50", text: "text-red-900", border: "border-red-500", icon: <XCircle className="w-5 h-5 text-red-600" /> },
    info: { bg: "bg-blue-50", text: "text-blue-900", border: "border-blue-500", icon: <Info className="w-5 h-5 text-blue-600" /> },
    warning: { bg: "bg-yellow-50", text: "text-yellow-900", border: "border-yellow-500", icon: <AlertTriangle className="w-5 h-5 text-yellow-600" /> },
  };

  const s = styleMap[type];

  const handleClose = () => {
    setMounted(false);
    // allow exit animation to play
    setTimeout(() => onClose?.(), 180);
  };

  return (
    <div
      className={`pointer-events-auto ${s.bg} ${s.text} shadow-2xl rounded-md border border-gray-200/60 ${s.border} border-l-4 px-4 py-3 flex items-start gap-3 min-w-[320px] max-w-[520px] transition-all duration-200 ease-out transform ` +
        (mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2")}
      role="status"
      aria-live="polite"
    >
      <div className="mt-0.5 shrink-0">{s.icon}</div>
      <div className="text-sm leading-5 flex-1 font-medium">{message}</div>
      {onClose && (
        <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
