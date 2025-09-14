"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ConfirmationModal from "@/components/ConfirmationModal";
import { ArrowLeft, BookOpenText, Save } from "lucide-react";
import { fetchPublishedDocumentFoldersODataAction, type PublishedDocumentFolderRow } from "@/app/actions/admin/publishedDocumentFolders";
import { getPublishedDocumentByIdAction, updatePublishedDocumentAction } from "@/app/actions/admin/publishedDocuments";
import { uploadToLocal } from "@/utils/uploadToLocal";
import { deleteLocalUpload, isLocalUploadUrl } from "@/utils/deleteLocalUpload";
import DateTimePicker from "@/components/form/DateTimePicker";

type FormState = {
  publishedDocumentFolderId: number | "";
  documentName: string;
  documentUrl: string;
  validFrom: string;
  validTo: string;
  files: File[];
};

export default function EditPublishedDocumentPage() {
  const params = useParams();
  const id = Number(params?.id);
  const router = useRouter();
  const [folders, setFolders] = useState<PublishedDocumentFolderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [form, setForm] = useState<FormState>({ publishedDocumentFolderId: "", documentName: "", documentUrl: "", validFrom: "", validTo: "", files: [] });
  const [originalUrl, setOriginalUrl] = useState<string>("");

  const inputCls = "w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm bg-white";

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const foldersRes = await fetchPublishedDocumentFoldersODataAction({ top: 2000, skip: 0, orderBy: 'PublishedDocumentFolderName asc' });
        if (!mounted) return;
        setFolders(foldersRes.data?.rows || []);
        // fetch document by id and prefill
        const docRes = await getPublishedDocumentByIdAction(id);
        if (docRes.status === 200 && docRes.data) {
          const d = docRes.data;
          setForm({
            publishedDocumentFolderId: Number(d.publishedDocumentFolderId) || "",
            documentName: d.documentName || "",
            documentUrl: d.documentUrl || "",
            validFrom: d.validFrom ? new Date(d.validFrom).toISOString() : "",
            validTo: d.validTo ? new Date(d.validTo).toISOString() : "",
            files: [],
          });
          setOriginalUrl(d.documentUrl || "");
        } else {
          setForm({ publishedDocumentFolderId: "", documentName: "", documentUrl: "", validFrom: "", validTo: "", files: [] });
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally { setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [id]);

  // Allow either a file OR a URL, plus required dates
  const canSave = !!(form.publishedDocumentFolderId && form.documentName.trim() && (form.files.length > 0 || form.documentUrl.trim()) && form.validFrom && form.validTo);

  const [showSuccess, setShowSuccess] = useState(false);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setForm(f => ({ ...f, files: Array.from(e.target.files!) }));
  };

  const save = async () => {
    if (!canSave) { setError('Provide a file or a URL, and fill Valid From and Valid To'); return; }
    setSaving(true);
    try {
      setError("");
      // If a file is selected, upload and use its URL; otherwise, use the provided URL
      let url = form.documentUrl.trim();
      if (form.files.length > 0) {
        const first = form.files[0];
        const up = await uploadToLocal(first);
        url = up.url;
      }
      // Enforce absolute URL if user typed a relative path
      try { url = new URL(url, window.location.origin).toString(); } catch { }
      // Validate required dates and order
      if (!form.validFrom || !form.validTo) { throw new Error('Valid From and Valid To are required'); }
      const vf = new Date(form.validFrom); const vt = new Date(form.validTo);
      if (isNaN(vf.getTime()) || isNaN(vt.getTime())) { throw new Error('Please enter valid date/time values'); }
      if (vt < vf) { throw new Error('Valid To must be after Valid From'); }

      const payload = {
        publishedDocumentFolderId: Number(form.publishedDocumentFolderId),
        documentName: form.documentName.trim(),
        documentUrl: url,
        validFrom: new Date(form.validFrom).toISOString(),
        validTo: new Date(form.validTo).toISOString(),
      };
      const res = await updatePublishedDocumentAction(id, payload);
      const status = Number((res as any)?.status);
      if (Number.isFinite(status) && status >= 200 && status < 300) {
        setShowSuccess(true);
        // If we uploaded a new file and the original was a local upload, delete the old file to replace it
        if (form.files.length > 0 && originalUrl && isLocalUploadUrl(originalUrl)) {
          try { await deleteLocalUpload(originalUrl); } catch { }
        }
      } else {
        setError(res.message || 'Failed to update');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to update');
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
          <button onClick={() => { if (!canSave) { setError('Provide a file or a URL, and fill Valid From and Valid To'); return; } save(); }} disabled={!canSave || saving} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium shadow hover:bg-indigo-700 disabled:opacity-50">{saving ? "Saving…" : "Update"}</button>
        </div>
      </div>

      <div className="w-[60%] mx-auto bg-white shadow-sm border border-gray-200 rounded-lg p-6 space-y-4">
        {error && (
          <div className="p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{error}</div>
        )}
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
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Upload File</label>
          <input type="file" multiple onChange={onFileChange} className={inputCls} />
          <p className="mt-1 text-xs text-gray-500">Provide a file or a URL below.</p>
        </div>
        {form.files.length === 0 && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Or Document URL</label>
            <input className={inputCls} value={form.documentUrl} onChange={e => setForm(f => ({ ...f, documentUrl: e.target.value }))} placeholder="https://…" />
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DateTimePicker
            label="Valid From"
            value={form.validFrom}
            onChange={(iso) => setForm(f => ({ ...f, validFrom: iso }))}
            required
            maxDateTime={form.validTo || undefined}
          />
          <DateTimePicker
            label="Valid To"
            value={form.validTo}
            onChange={(iso) => setForm(f => ({ ...f, validTo: iso }))}
            required
            minDateTime={form.validFrom || undefined}
          />
        </div>
      </div>
      {/* No pre-submit confirmation; success handled by modal; errors inline above form */}
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
