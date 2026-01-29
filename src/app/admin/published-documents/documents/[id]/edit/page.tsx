"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ConfirmationModal from "@/components/ConfirmationModal";
import { ArrowLeft, BookOpenText, Save } from "lucide-react";
import { fetchPublishedDocumentFoldersODataAction, type PublishedDocumentFolderRow } from "@/app/actions/admin/publishedDocumentFolders";
import { getPublishedDocumentByIdAction, updatePublishedDocumentAction } from "@/app/actions/admin/publishedDocuments";
import { fetchCandidateGroupsODataAction, CandidateGroupRow } from "@/app/actions/admin/candidateGroups";
import EditPageLoader from "@/components/EditPageLoader";

import { uploadToLocal } from "@/utils/uploadToLocal";
import { deleteLocalUpload, isLocalUploadUrl } from "@/utils/deleteLocalUpload";
import DateTimePicker from "@/components/form/DateTimePicker";
import TreeSelect from "@/components/form/TreeSelect";

type FormState = {
  publishedDocumentFolderId: number | "";
  documentName: string;
  documentUrl: string;
  documentType?: "document" | "youtube" | "mp4" | "file";
  validFrom: string;
  validTo: string;
  files: File[];
  selectedGroupIds: number[];
};

export default function EditPublishedDocumentPage() {
  const params = useParams();
  const maskedId = params?.id as string;
  const id = parseInt(maskedId, 10);
  const router = useRouter();
  const [folders, setFolders] = useState<PublishedDocumentFolderRow[]>([]);
  const [groups, setGroups] = useState<CandidateGroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [form, setForm] = useState<FormState | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string>("");

  const inputCls = "w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm bg-white";

  useEffect(() => {
    if (!id) {
      setError("Invalid document ID");
      setLoading(false);
      router.push("/admin/published-documents/documents");
      return;
    }
    let mounted = true;
    async function fetchAll() {
      setLoading(true);
      try {
        const [foldersRes, groupRes, docRes] = await Promise.all([
          fetchPublishedDocumentFoldersODataAction({ top: 2000, skip: 0, orderBy: 'PublishedDocumentFolderName asc' }),
          fetchCandidateGroupsODataAction({ top: 100, skip: 0, orderBy: "CandidateGroupName asc" }),
          getPublishedDocumentByIdAction(id)
        ]);
        if (!mounted) return;
        setFolders(foldersRes.data?.rows || []);
        setGroups(groupRes.data?.rows || []);
        let selectedGroupIds: number[] = [];
        if (docRes.status === 200 && docRes.data) {
          const d = docRes.data;
          if (Array.isArray(d.candidateRegisteredPublishedDocuments)) {
            selectedGroupIds = d.candidateRegisteredPublishedDocuments.map((x: any) => Number(x.candidateGroupId));
          }
          setForm({
            publishedDocumentFolderId: Number(d.publishedDocumentFolderId) || "",
            documentName: d.documentName || "",
            documentUrl: d.documentUrl || "",
            documentType: (d.documentType as any) || "document",
            validFrom: d.validFrom || "",
            validTo: d.validTo || "",
            files: [],
            selectedGroupIds,
          });
          setOriginalUrl(d.documentUrl || "");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
    return () => { mounted = false; };
  }, [id, router]);

  const canSave = !!(form && form.publishedDocumentFolderId && form.documentName.trim() && (form.files.length > 0 || form.documentUrl.trim()) && form.validFrom && form.validTo);

  const [showSuccess, setShowSuccess] = useState(false);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !form) return;
    setForm(f => f ? { ...f, files: Array.from(e.target.files!) } : f);
  };

  const save = async () => {
    if (!id || !form) {
      setError("Invalid document ID");
      return;
    }
    if (!canSave) { setError('Provide a file or a URL, and fill Valid From and Valid To'); return; }
    setSaving(true);
    try {
      setError("");
      let url = form.documentUrl.trim();
      if (form.files.length > 0) {
        const first = form.files[0];
        const up = await uploadToLocal(first);
        url = up.url;
      }
      try { url = new URL(url, window.location.origin).toString(); } catch { }
      if (!form.validFrom || !form.validTo) { throw new Error('Valid From and Valid To are required'); }
      const vf = new Date(form.validFrom); const vt = new Date(form.validTo);
      if (isNaN(vf.getTime()) || isNaN(vt.getTime())) { throw new Error('Please enter valid date/time values'); }
      if (vt < vf) { throw new Error('Valid To must be after Valid From'); }

      const payload = {
        id,
        publishedDocumentFolderId: Number(form.publishedDocumentFolderId),
        documentName: form.documentName.trim(),
        documentUrl: url,
        documentType: form.documentType,
        validFrom: form.validFrom,
        validTo: form.validTo,
        candidateRegisteredPublishedDocuments: form.selectedGroupIds.map(groupId => ({ publishedDocumentId: id, candidateGroupId: groupId }))
      };
      const res = await updatePublishedDocumentAction(id, payload as any);
      const status = Number((res as any)?.status);
      if (Number.isFinite(status) && status >= 200 && status < 300) {
        setShowSuccess(true);
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

  if (loading || !form) return <EditPageLoader message="Loading document..." />;

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
          <TreeSelect
            label=""
            items={folders}
            value={form?.publishedDocumentFolderId || ""}
            onChange={(val) => setForm(f => f ? { ...f, publishedDocumentFolderId: val } : f)}
            placeholder="Select folder…"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Document Name <span className="text-red-500">*</span></label>
          <input className={inputCls} value={form?.documentName || ""} onChange={e => setForm(f => f ? { ...f, documentName: e.target.value } : f)} placeholder="Enter document name" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Document Type <span className="text-red-500">*</span></label>
          <select className={inputCls} value={form?.documentType || "document"} onChange={e => setForm(f => f ? { ...f, documentType: e.target.value as any } : f)} aria-label="Select document type" title="Select document type">
            <option value="document">Document URL</option>
            <option value="youtube">YouTube URL</option>
            <option value="mp4">.mp4 Upload</option>
            <option value="file">Upload Document</option>
          </select>
        </div>
        {form?.documentType === 'mp4' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Upload .mp4 File</label>
            <input type="file" accept=".mp4" onChange={onFileChange} className={inputCls} />
            <p className="mt-1 text-xs text-gray-500">Upload a .mp4 file.</p>
          </div>
        )}
        {form?.documentType === 'file' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Upload Document</label>
            <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" onChange={onFileChange} className={inputCls} />
            <p className="mt-1 text-xs text-gray-500">Upload PDF or Office documents.</p>
          </div>
        )}
        {(!form?.files.length || form?.documentType === 'document') && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Or Document URL</label>
            <input className={inputCls} value={form?.documentUrl || ""} onChange={e => setForm(f => f ? { ...f, documentUrl: e.target.value } : f)} placeholder="https://…" />
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DateTimePicker
            label="Valid From"
            value={form?.validFrom || ""}
            onChange={(iso) => setForm(f => f ? { ...f, validFrom: iso } : f)}
            required
            maxDateTime={form?.validTo || undefined}
          />
          <DateTimePicker
            label="Valid To"
            value={form?.validTo || ""}
            onChange={(iso) => setForm(f => f ? { ...f, validTo: iso } : f)}
            required
            minDateTime={form?.validFrom || undefined}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">
           Candidate Groups
          </label>
          <div className="border rounded p-2">
            {groups.map(group => (
              <div key={group.id} className="flex items-center mb-1">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={form?.selectedGroupIds.includes(Number(group.id)) || false}
                  onChange={e => {
                    setForm(f => f ? ({
                      ...f,
                      selectedGroupIds: e.target.checked
                        ? [...f.selectedGroupIds, Number(group.id)]
                        : f.selectedGroupIds.filter(id => id !== Number(group.id))
                    }) : f);
                  }}
                  id={`group_${group.id}`}
                />
                <label htmlFor={`group_${group.id}`}>{group.name}</label>
              </div>
            ))}
            <div className="text-xs text-right text-gray-500 mt-1">Selected: {form?.selectedGroupIds.length || 0}</div>
          </div>
        </div>
      </div>
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
