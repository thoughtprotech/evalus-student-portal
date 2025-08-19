"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, PackagePlus, Check } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmationModal from "@/components/ConfirmationModal";
import { createProductAction } from "@/app/actions/admin/products";

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    productName: "",
    language: "English",
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
    isActive: form.isActive ? 1 : 0,
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

  const handleSaveAndNew = async () => {
    if (isSaving) return; if (!validate()) return;
    setIsSaving(true);
    const res = await createProductAction(buildPayload());
    const ok = res.status >= 200 && res.status < 300;
    if (ok) {
      toast.success("Product created! Add another...");
      setForm({ productName: "", language: form.language, isActive: true });
    } else {
      toast.error(res.message || "Failed to create product");
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="w-[85%] mx-auto px-6 py-4">
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
              <Link href="/admin/products" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Back to Products</Link>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveAndNew}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-colors ${isSaving ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  {isSaving ? 'Saving...' : 'Save & New'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm transition-colors ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {isSaving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="w-[85%] mx-auto px-6 py-8">
        <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="productName"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter product name"
                  value={form.productName}
                  onChange={handleChange}
                  maxLength={150}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="language"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="e.g. English"
                  value={form.language}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                id="isActive"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-green-600 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
            </div>
            {/* Bottom buttons intentionally omitted; actions in header like candidates */}
          </form>
        </div>
      </div>
      <ConfirmationModal
        isOpen={showSuccessModal}
        onConfirm={() => { setShowSuccessModal(false); router.push('/admin/products'); }}
        onCancel={() => {}}
        title="Product Created Successfully! ✅"
        message="Your product has been successfully created."
        confirmText="Go to Products"
        cancelText=""
        variant="success"
        className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
      />
    </div>
  );
}
