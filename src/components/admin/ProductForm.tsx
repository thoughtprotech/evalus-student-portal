"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductDto, createProductAction, updateProductAction } from "@/app/actions/admin/products";
import Toast from "@/components/Toast";

interface Props {
  mode: "create" | "edit";
  initial?: ProductDto | null;
}

export default function ProductForm({ mode, initial }: Props) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [productName, setProductName] = useState(initial?.productName || "");
  const [language, setLanguage] = useState(initial?.language || "English");
  const [isActive, setIsActive] = useState<number | boolean>(initial?.isActive ?? 1);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);

  useEffect(() => {
    if (initial) {
      setProductName(initial.productName);
      setLanguage(initial.language);
      setIsActive(initial.isActive);
    }
  }, [initial]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productName.trim()) {
      setToast({ message: "Product name is required", type: "warning" });
      return;
    }
    setSubmitting(true);
    const basePayload = {
      productName: productName.trim(),
      language: language.trim() || "English",
      isActive: Number(isActive) ? 1 : 0,
      createdBy: initial?.createdBy || "admin",
      modifiedBy: "admin",
    };

    const res = isEdit && initial
      ? await updateProductAction(initial.productId, basePayload)
      : await createProductAction(basePayload);

    setSubmitting(false);
    if (res.status === 200) {
      router.push("/admin/products");
      router.refresh?.();
    } else {
      setToast({ message: res.message || "Save failed", type: "error" });
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-5 bg-white p-6 rounded-md shadow border border-gray-200 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name<span className="text-red-500">*</span></label>
          <input
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
            maxLength={150}
            placeholder="Enter product name"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="e.g. English"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              aria-label="Product active status"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={Number(isActive)}
              onChange={(e) => setIsActive(Number(e.target.value))}
            >
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-5 py-2.5 bg-green-600 text-white rounded-md text-sm font-medium shadow hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? (isEdit ? "Updating..." : "Creating...") : isEdit ? "Update" : "Create"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center px-5 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-md text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} durationMs={3000} />
        )}
      </div>
    </div>
  );
}
