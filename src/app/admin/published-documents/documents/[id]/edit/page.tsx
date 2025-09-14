"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Toast from "@/components/Toast";
import ConfirmationModal from "@/components/ConfirmationModal";
import { ArrowLeft, BookOpenText, Save } from "lucide-react";
import { fetchPublishedDocumentFoldersODataAction, type PublishedDocumentFolderRow } from "@/app/actions/admin/publishedDocumentFolders";

type FormState = {
  publishedDocumentFolderId: number | "";
  documentName: string;
  documentUrl: string;
  validFrom: string;
  validTo: string;
};

export default function EditPublishedDocumentPage() {
  const params = useParams();
  const id = Number(params?.id);
  const router = useRouter();
  const [folders, setFolders] = useState<PublishedDocumentFolderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: any } | null>(null);
  const [form, setForm] = useState<FormState>({ publishedDocumentFolderId: "", documentName: "", documentUrl: "", validFrom: "", validTo: "" });

  const inputCls = "w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm bg-white";

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const foldersRes = await fetchPublishedDocumentFoldersODataAction({ top: 2000, skip: 0, orderBy: 'PublishedDocumentFolderName asc' });
        if (!mounted) return;
        setFolders(foldersRes.data?.rows || []);
        // TODO: fetch document by id and prefill
        setForm({ publishedDocumentFolderId: "", documentName: "", documentUrl: "", validFrom: "", validTo: "" });
      } catch (e: any) {
        setToast({ message: e?.message || 'Failed to load', type: 'error' });
      } finally { setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [id]);

  const canSave = form.publishedDocumentFolderId && form.documentName.trim();

  const [showSuccess, setShowSuccess] = useState(false);

  const save = async () => {
    if (!canSave) { setToast({ message: 'Fill required fields', type: 'error' }); return; }
    setSaving(true);
    try {
      // TODO: call updatePublishedDocumentAction(id, payload)
      setToast(null);
      setShowSuccess(true);
    } catch (e: any) {
      setToast({ message: e?.message || 'Failed to update', type: 'error' });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-4 text-sm text-gray-600">Loading…</div>;

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-start justify-between w-[60%] mx-auto mb-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/published-documents/documents" className="inline-flex items-center text-sm text-indigo-600 hover:underline"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Link>
          <PageHeader icon={<BookOpenText className="w-6 h-6 text-indigo-600" />} title="Edit Published Document" showSearch={false} onSearch={() => { }} />
        </div>
        <div className="flex gap-2">
          <Link href="/admin/published-documents/documents" className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Cancel</Link>
          <button onClick={save} disabled={!canSave || saving} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium shadow hover:bg-indigo-700 disabled:opacity-50">{saving ? "Saving…" : "Update"}</button>
        </div>
      </div>

      <div className="w-[60%] mx-auto bg-white shadow-sm border border-gray-200 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Document Folder <span className="text-red-500">*</span></label>
          <select className={inputCls} value={form.publishedDocumentFolderId} onChange={e => setForm(f => ({ ...f, publishedDocumentFolderId: e.target.value ? Number(e.target.value) : "" }))}>
            <option value="">Select folder…</option>
            {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Document Name <span className="text-red-500">*</span></label>
          <input className={inputCls} value={form.documentName} onChange={e => setForm(f => ({ ...f, documentName: e.target.value }))} placeholder="Enter document name" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Document URL</label>
          <input className={inputCls} value={form.documentUrl} onChange={e => setForm(f => ({ ...f, documentUrl: e.target.value }))} placeholder="https://…" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Valid From</label>
            <input type="datetime-local" className={inputCls} value={form.validFrom} onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Valid To</label>
            <input type="datetime-local" className={inputCls} value={form.validTo} onChange={e => setForm(f => ({ ...f, validTo: e.target.value }))} />
          </div>
        </div>
      </div>

      <div className="fixed top-4 right-4 z-50 space-y-2">{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</div>
      <ConfirmationModal
        isOpen={showSuccess}
        onConfirm={() => { setShowSuccess(false); router.push('/admin/published-documents/documents'); }}
        onCancel={() => { setShowSuccess(false); router.push('/admin/published-documents/documents'); }}
        title="Document Updated Successfully!"
        message="Your changes have been saved."
        confirmText="Go to Documents"
        cancelText=""
        variant="success"
        className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
      />
    </div>
  );
}
