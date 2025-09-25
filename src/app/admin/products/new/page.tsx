"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, PackagePlus, Check } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmationModal from "@/components/ConfirmationModal";
import { createProductAction } from "@/app/actions/admin/products";
import { fetchLanguagesAction } from "@/app/actions/dashboard/questions/fetchLanguages";
import type { GetLanguagesResponse } from "@/utils/api/types";

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    productName: "",
    language: "",
    isActive: 1,
  });
  const [languages, setLanguages] = useState<GetLanguagesResponse[]>([]);
  const [langLoading, setLangLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLangLoading(true);
      try {
        const res = await fetchLanguagesAction();
        if (mounted && res.status === 200 && res.data) {
          const active = res.data.filter((l) => Number(l.isActive) === 1);
          setLanguages(active);
          if (!form.language && active.length) {
            setForm(f => ({ ...f, language: active[0].language }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch languages:", err);
      }
      setLangLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.productName.trim()) { toast.error("Product name is required"); return false; }
    if (!form.language.trim()) { toast.error("Language is required"); return false; }
    return true;
  };

  const buildPayload = () => ({
    productName: form.productName.trim(),
    language: form.language.trim(),
    isActive: Number(form.isActive),
    createdBy: "admin",
    modifiedBy: "admin"
  });

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (isSaving) return; if (!validate()) return;
    setIsSaving(true);
    const res = await createProductAction(buildPayload());
    const ok = res.status >= 200 && res.status < 300;
    if (ok) {
      setShowSuccessModal(true);
    } else {
      toast.error(res.message || "Failed to create product");
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin/products" className="text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <PackagePlus className="w-4 h-4 text-green-600" />
                </div>
                <h1 className="text-2xl font-semibold text-gray-900">Add New Product</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => router.push('/admin/products')}
                className="px-4 py-2 rounded-lg text-gray-700 text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm transition-colors bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="productName"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter product name"
                  value={form.productName}
                  onChange={handleChange}
                  maxLength={150}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language <span className="text-red-500">*</span></label>
                <select
                  name="language"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  value={form.language}
                  onChange={handleChange}
                  disabled={langLoading}
                >
                  <option value="" disabled>Select language</option>
                  {languages.map(l => (
                    <option key={l.language} value={l.language}>{l.language}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status <span className="text-red-500">*</span></label>
                <select
                  name="isActive"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  value={form.isActive}
                  onChange={handleChange}
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>
            </div>
          </form>
        </div>
      </div>
      <ConfirmationModal
        isOpen={showSuccessModal}
        onConfirm={() => { setShowSuccessModal(false); router.push('/admin/products'); }}
        onCancel={() => {
          setShowSuccessModal(false);
          setForm({ productName: "", language: form.language, isActive: 1 });
        }}
        title="Product Created Successfully! ✅"
        message="Your product has been successfully created. What would you like to do next?"
        confirmText="Go to Products"
        cancelText="Create Another"
        variant="success"
        className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
      />
    </div>
  );
}
