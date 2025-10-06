"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { HelpCircle, ArrowLeft } from "lucide-react";
import Toast from "@/components/Toast";
import EditPageLoader from "@/components/EditPageLoader";
import ConfirmationModal from "@/components/ConfirmationModal";
import { getTestDifficultyLevelByIdAction, updateTestDifficultyLevelAction } from "@/app/actions/admin/test-difficulty-levels";

import { useUser } from "@/contexts/UserContext";

export default function EditTestDifficultyLevelPage() {
  const params = useParams();
  const maskedId = params?.id as string;
  const id = parseInt(maskedId, 10);
  const router = useRouter();
  const { username } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: any } | null>(null);
  const [form, setForm] = useState({ testDifficultyLevel1: "", language: "", isActive: 1, createdBy: "", createdDate: "" });
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!id) {
      setToast({ message: "Invalid difficulty level ID", type: 'error' });
      setLoading(false);
      router.push("/admin/tests/difficulty-levels");
      return;
    }
    (async () => {
      const res = await getTestDifficultyLevelByIdAction(id);
      if (res.status === 200 && res.data) {
        setForm({
          testDifficultyLevel1: res.data.name,
          language: res.data.language || "",
          isActive: res.data.isActive,
          createdBy: res.data.createdBy || username || 'System',
          createdDate: res.data.createdDate || new Date().toISOString(),
        });
      } else {
        setToast({ message: res.message || 'Failed to load', type: 'error' });
      }
      setLoading(false);
    })();
  }, [id]);

  const submit = async () => {
    if (!id) {
      setToast({ message: "Invalid difficulty level ID", type: 'error' });
      return;
    }
    if (!form.testDifficultyLevel1.trim()) { setToast({ message: 'Name required', type: 'error' }); return; }
    setSaving(true);
    const nowIso = new Date().toISOString();
    const res = await updateTestDifficultyLevelAction(id, {
      testDifficultyLevel1: form.testDifficultyLevel1,
      language: form.language,
      isActive: form.isActive,
      createdBy: form.createdBy || username || 'System',
      createdDate: form.createdDate || nowIso,
      modifiedBy: username || 'System',
      modifiedDate: nowIso,
    });
    setSaving(false);
    if (res.status >= 200 && res.status < 300) { setToast(null); setShowSuccess(true); }
    else setToast({ message: res.message || 'Failed', type: 'error' });
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-start justify-between w-[60%] mx-auto mb-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/tests/difficulty-levels" className="inline-flex items-center text-sm text-indigo-600 hover:underline"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Link>
          <PageHeader title="Edit Test Difficulty Level" icon={<HelpCircle className="w-6 h-6 text-indigo-600" />} showSearch={false} onSearch={() => { }} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push('/admin/tests/difficulty-levels')} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Cancel</button>
          <button disabled={saving} onClick={submit} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium shadow hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving…' : 'Update'}</button>
        </div>
      </div>
      <div className="w-[60%] mx-auto bg-white shadow-sm border border-gray-200 rounded-lg p-6 overflow-auto">
        {loading ? <EditPageLoader message="Loading difficulty level..." /> : (
          <div className="space-y-5">
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Test Difficulty Level<span className="text-red-500 ml-0.5">*</span></label>
              <input value={form.testDifficultyLevel1} onChange={e => setForm(f => ({ ...f, testDifficultyLevel1: e.target.value }))} className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Language<span className="text-red-500 ml-0.5">*</span></label>
              <input value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Status</label>
              <select value={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: Number(e.target.value) }))} className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm bg-white"><option value={1}>Active</option><option value={0}>Inactive</option></select>
            </div>
          </div>
        )}
      </div>
      <div className="fixed top-4 right-4 space-y-2 z-50">{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</div>
      <ConfirmationModal
        isOpen={showSuccess}
        onConfirm={() => { setShowSuccess(false); router.push('/admin/tests/difficulty-levels'); }}
        onCancel={() => { setShowSuccess(false); router.push('/admin/tests/difficulty-levels'); }}
        title="Test Difficulty Level Updated Successfully!"
        message="Your changes have been saved."
        confirmText="Go to List"
        cancelText=""
        variant="success"
        className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
      />
    </div>
  );
}
