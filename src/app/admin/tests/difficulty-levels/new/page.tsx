"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { HelpCircle, ArrowLeft } from "lucide-react";
import Toast from "@/components/Toast";
import ConfirmationModal from "@/components/ConfirmationModal";
import { createTestDifficultyLevelAction } from "@/app/actions/admin/test-difficulty-levels";
import { fetchLanguagesAction } from "@/app/actions/dashboard/questions/fetchLanguages";
import { useUser } from "@/contexts/UserContext";
import type { GetLanguagesResponse } from "@/utils/api/types";

export default function NewTestDifficultyLevelPage() {
  const router = useRouter();
  const { username } = useUser();
  const [form, setForm] = useState({ testDifficultyLevel1: "", language: "", isActive: 1 });
  const [languages, setLanguages] = useState<GetLanguagesResponse[]>([]);
  const [langLoading, setLangLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: any } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      setLangLoading(true);
      const res = await fetchLanguagesAction();
      if (res.status === 200 && res.data) {
        const active = res.data.filter(l => Number(l.isActive) === 1);
        setLanguages(active);
        if (!form.language && active.length) setForm(f => ({ ...f, language: active[0].language }));
      }
      setLangLoading(false);
    })();
  }, []);

  const submit = async () => {
    if (!form.testDifficultyLevel1.trim()) { setToast({ message: 'Name is required', type: 'error' }); return; }
    if (!form.language.trim()) { setToast({ message: 'Language is required', type: 'error' }); return; }
    setSaving(true);
    const nowIso = new Date().toISOString();
    const res = await createTestDifficultyLevelAction({
      testDifficultyLevel1: form.testDifficultyLevel1.trim(),
      language: form.language,
      isActive: form.isActive,
      createdBy: username || 'System',
      createdDate: nowIso,
      modifiedBy: username || 'System',
      modifiedDate: nowIso,
    });
    setSaving(false);
    if (res.status >= 200 && res.status < 300) { setToast(null); setShowSuccess(true); }
    else setToast({ message: res.message || 'Failed to create', type: 'error' });
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-start justify-between w-[60%] mx-auto mb-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/tests/difficulty-levels" className="inline-flex items-center text-sm text-indigo-600 hover:underline"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Link>
          <PageHeader title="New Test Difficulty Level" icon={<HelpCircle className="w-6 h-6 text-indigo-600" />} showSearch={false} onSearch={() => { }} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push('/admin/tests/difficulty-levels')} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Cancel</button>
          <button disabled={saving} onClick={submit} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium shadow hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving…' : 'Create'}</button>
        </div>
      </div>
      <div className="w-[60%] mx-auto bg-white shadow-sm border border-gray-200 rounded-lg p-6 overflow-auto">
        <div className="space-y-5">
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Test Difficulty Level<span className="text-red-500 ml-0.5">*</span></label>
            <input value={form.testDifficultyLevel1} onChange={e => setForm(f => ({ ...f, testDifficultyLevel1: e.target.value }))} className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm" placeholder="e.g., Easy" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Language<span className="text-red-500 ml-0.5">*</span></label>
            <select
              value={form.language}
              onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
              className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm bg-white"
              disabled={langLoading || languages.length === 0}
            >
              {langLoading && <option>Loading...</option>}
              {!langLoading && languages.length === 0 && <option>No languages</option>}
              {!langLoading && languages.map(l => <option key={l.language} value={l.language}>{l.language}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Status<span className="text-red-500 ml-0.5">*</span></label>
            <select value={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: Number(e.target.value) }))} className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm bg-white"><option value={1}>Active</option><option value={0}>Inactive</option></select>
          </div>
        </div>
      </div>
      <div className="fixed top-4 right-4 space-y-2 z-50">{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</div>
      <ConfirmationModal
        isOpen={showSuccess}
        onConfirm={() => { setShowSuccess(false); router.push('/admin/tests/difficulty-levels'); }}
        onCancel={() => { setShowSuccess(false); router.push('/admin/tests/difficulty-levels'); }}
        title="Test Difficulty Level Created"
        message="Your difficulty level has been created successfully."
        confirmText="Go to List"
        cancelText=""
        variant="success"
        className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
      />
    </div>
  );
}
