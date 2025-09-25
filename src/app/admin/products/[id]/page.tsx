"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchProductByIdAction, updateProductAction, ProductDto } from "@/app/actions/admin/products";
import Loader from "@/components/Loader";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import EditPageLoader from "@/components/EditPageLoader";
import toast from "react-hot-toast";
import ConfirmationModal from "@/components/ConfirmationModal";
import { fetchLanguagesAction } from "@/app/actions/dashboard/questions/fetchLanguages";
import type { GetLanguagesResponse } from "@/utils/api/types";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params?.id);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [form, setForm] = useState({
    productName: "",
    language: "",
    isActive: 1,
    createdBy: "",
    createdDate: "",
    modifiedBy: "",
    modifiedDate: "",
  });
  const [languages, setLanguages] = useState<GetLanguagesResponse[]>([]);
  const [langLoading, setLangLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLangLoading(true);
      try {
        const res = await fetchLanguagesAction();
        if (mounted && res.status === 200 && res.data) {
          const active = res.data.filter((l) => Number(l.isActive) === 1);
          setLanguages(active);
        }
      } catch (err) {
        console.error("Failed to fetch languages:", err);
      }
      setLangLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await fetchProductByIdAction(productId);
        if (!p) throw new Error("Not found");
        if (mounted) {
          setForm({
            productName: p.productName || "",
            language: p.language || "",
            isActive: Number(p.isActive) === 1 ? 1 : 0,
            createdBy: p.createdBy || "",
            createdDate: p.createdDate || "",
            modifiedBy: p.modifiedBy || "",
            modifiedDate: p.modifiedDate || "",
          });
        }
      } catch (e: any) {
        toast.error(e.message || "Failed to load product");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [productId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.productName.trim()) { toast.error("Product name required"); return false; }
    if (!form.language.trim()) { toast.error("Language required"); return false; }
    return true;
  };

  const submit = async (e?: FormEvent) => {
    if (e) e.preventDefault(); if (!validate()) return; setSaving(true);
    const payload = {
      productId,
      productName: form.productName.trim(),
      language: form.language.trim(),
      isActive: Number(form.isActive),
      createdBy: form.createdBy || 'admin',
      modifiedBy: 'admin',
    } as any;
    const res = await updateProductAction(productId, payload);
    if (res.status === 200 && !res.error) {
      setShowSuccessModal(true);
    } else {
      toast.error(res.message || "Update failed");
    }
    setSaving(false);
  };

  if (loading) return <EditPageLoader message="Loading product..." />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/products" className="text-gray-500 hover:text-gray-700"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="text-2xl font-semibold text-gray-900">Edit Product</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50">Cancel</button>
            <button onClick={submit} disabled={saving} className="px-4 py-2 text-sm rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">Update</button>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-6 relative">
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name <span className="text-red-500">*</span></label>
              <input name="productName" placeholder="Product name" aria-label="Product name" value={form.productName} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
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
          </form>
        </div>
      </div>
      <ConfirmationModal
        isOpen={showSuccessModal}
        onConfirm={() => {
          setShowSuccessModal(false);
          router.push('/admin/products');
        }}
        onCancel={() => setShowSuccessModal(false)}
        title="Product Updated Successfully! ✅"
        message="Your changes have been saved."
        confirmText="Go to Products"
        cancelText=""
        variant="success"
        className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
      />
    </div>
  );
}
