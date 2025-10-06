"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
// Removed PageHeader; title now inline
import RichTextEditor from "@/components/RichTextEditor";
import { fetchLanguagesAction } from "@/app/actions/dashboard/questions/fetchLanguages";
import { getTestInstructionByIdAction, updateTestInstructionAction } from "@/app/actions/admin/testInstructions";

import { ArrowLeft, Save, BookOpenText } from "lucide-react";
import ConfirmationModal from "@/components/ConfirmationModal";
import Toast from "@/components/Toast";
import TestInstructionEditSkeleton from "../TestInstructionEditSkeleton";
import { useUser } from "@/contexts/UserContext";

export default function EditTestInstructionPage() {
  const params = useParams<{ id: string }>();
  const maskedId = params?.id as string;
  const id = parseInt(maskedId, 10);
  const recordId = id;
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [instruction, setInstruction] = useState("");
  const [language, setLanguage] = useState("");
  const [languages, setLanguages] = useState<any[]>([]);
  const [status, setStatus] = useState(1);
  const [createdBy, setCreatedBy] = useState<string | undefined>();
  const [createdDate, setCreatedDate] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: any } | null>(null);
  const router = useRouter();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { username } = useUser();

  useEffect(() => {
    if (!recordId) {
      setToast({ message: "Invalid instruction ID", type: 'error' });
      setLoading(false);
      router.push("/admin/test-instructions");
      return;
    }
    (async () => { const langRes = await fetchLanguagesAction(); if (langRes.status === 200 && langRes.data) setLanguages(langRes.data); const rec = await getTestInstructionByIdAction(recordId); if (rec.status === 200 && rec.data) { setName(rec.data.name); setInstruction(rec.data.instruction); setLanguage(rec.data.language); setStatus(rec.data.isActive); setCreatedBy(rec.data.createdBy); setCreatedDate(rec.data.createdDate); } else { setToast({ message: rec.message || 'Failed to load', type: 'error' }); } setLoading(false); })();
  }, [recordId]);

  const canSave = name.trim().length > 0 && language.trim().length > 0 && instruction.trim().length > 0;
  const save = async () => {
    if (!recordId) {
      setToast({ message: "Invalid instruction ID", type: 'error' });
      return;
    }
    if (!canSave) { setToast({ message: 'Fill all required fields', type: 'warning' }); return; } setSaving(true); const res = await updateTestInstructionAction(recordId, { testInstructionName: name.trim(), testInstruction1: instruction, language, isActive: status, modifiedBy: username || 'Admin', createdBy, createdDate }); setSaving(false); if (res.status === 200) { setToast(null); setShowSuccessModal(true); } else setToast({ message: res.message || 'Update failed', type: 'error' });
  };

  return <div className="p-4 bg-gray-50 h-full flex flex-col">
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto bg-white shadow rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/test-instructions" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"><ArrowLeft className="w-4 h-4" /> Back</Link>
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-indigo-50 border border-indigo-100"><BookOpenText className="w-5 h-5 text-indigo-600" /></span>
            <h2 className="text-lg font-semibold text-gray-800">Edit Test Instruction</h2>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/test-instructions" className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">Cancel</Link>
            <button onClick={save} disabled={!canSave || saving || loading} className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700 disabled:opacity-50"><Save className="w-4 h-4" />{saving ? 'Saving...' : 'Update'}</button>
          </div>
        </div>
        {loading ? <div className="text-sm text-gray-600">Loading...</div> : <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name<span className="text-red-500"> *</span></label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Instruction Name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instruction<span className="text-red-500"> *</span></label>
            <RichTextEditor
              initialContent={instruction}
              onChange={setInstruction}
              placeholder="Enter instruction details"
              minHeight={400}
              className="resize-y"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language<span className="text-red-500"> *</span></label>
              <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select Language</option>
                {languages.map(l => <option key={l.languageId || l.language} value={l.language || l.language1 || l.languageName || l.Language}>{l.language || l.language1 || l.languageName || l.Language}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(Number(e.target.value))} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          </div>
        </div>}
        {/* Footer buttons removed (moved to header) */}
      </div>
    </div>
    <div className="fixed top-4 right-4 z-50 space-y-2">{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</div>
    <ConfirmationModal
      isOpen={showSuccessModal}
      variant="success"
      title="Test Instruction Updated Successfully!"
      message="Your changes have been saved."
      confirmText="Go to List"
      cancelText=""
      onConfirm={() => { setShowSuccessModal(false); router.push('/admin/test-instructions'); }}
      onCancel={() => setShowSuccessModal(false)}
    />
    {loading && <TestInstructionEditSkeleton />}
  </div>;
}
