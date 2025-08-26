"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchProductByIdAction, updateProductAction, ProductDto } from "@/app/actions/admin/products";
import Loader from "@/components/Loader";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import EditPageLoader from "@/components/EditPageLoader";
import toast from "react-hot-toast";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params?.id);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    productName: "",
    language: "English",
    isActive: true,
    createdBy: "",
    createdDate: "",
    modifiedBy: "",
    modifiedDate: "",
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await fetchProductByIdAction(productId);
        if (!p) throw new Error("Not found");
        if (mounted) {
          setForm({
            productName: p.productName || "",
            language: p.language || "English",
            isActive: p.isActive === 1 || p.isActive === true,
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
      isActive: form.isActive ? 1 : 0,
      createdBy: form.createdBy || 'admin',
      modifiedBy: 'admin',
    } as any;
    const res = await updateProductAction(productId, payload);
    if (res.status === 200 && !res.error) {
      toast.success("Product updated"); router.push("/admin/products");
    } else {
      toast.error(res.message || "Update failed");
    }
    setSaving(false);
  };

  if (loading) return <EditPageLoader message="Loading product..." />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="w-[85%] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/products" className="text-gray-500 hover:text-gray-700"><ArrowLeft className="w-5 h-5"/></Link>
            <h1 className="text-2xl font-semibold text-gray-900">Edit Product</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50">Cancel</button>
            <button onClick={submit} disabled={saving} className={`px-4 py-2 text-sm rounded-lg text-white font-medium ${saving?"bg-gray-400":"bg-green-600 hover:bg-green-700"}`}>{saving?"Saving...":"Save Changes"}</button>
          </div>
        </div>
      </div>
      <div className="w-[85%] mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-6 relative">
          {saving && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-lg">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="absolute -inset-3 bg-gradient-to-r from-indigo-200 via-blue-200 to-indigo-200 opacity-30 blur-xl animate-pulse rounded-full" />
                  <Package className="relative w-8 h-8 text-green-600 animate-pulse" />
                </div>
                <p className="text-xs font-medium text-gray-600">Saving...</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Product Name *</label>
              <input name="productName" placeholder="Product name" aria-label="Product name" value={form.productName} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Language *</label>
              <input name="language" placeholder="Language" aria-label="Language" value={form.language} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 pt-4">
                <input id="isActive" type="checkbox" checked={form.isActive} onChange={(e)=>setForm(prev=>({...prev,isActive:e.target.checked}))} className="h-4 w-4 text-green-600 border-gray-300 rounded" />
                <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
              </div>
            </div>
            <div className="space-y-1 text-xs text-gray-500 pt-2">
              {form.createdDate && <p>Created: {new Date(form.createdDate).toLocaleString()} {form.createdBy && `by ${form.createdBy}`}</p>}
              {form.modifiedDate && <p>Last Modified: {new Date(form.modifiedDate).toLocaleString()} {form.modifiedBy && `by ${form.modifiedBy}`}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
