"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import ConfirmationModal from "@/components/ConfirmationModal";
import { ArrowLeft, BookOpenText, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchPublishedDocumentFoldersODataAction, type PublishedDocumentFolderRow } from "@/app/actions/admin/publishedDocumentFolders";
import { createPublishedDocumentAction } from "@/app/actions/admin/publishedDocuments";
import { uploadToLocal } from "@/utils/uploadToLocal";
import DateTimePicker from "@/components/form/DateTimePicker";
import TreeSelect from "@/components/form/TreeSelect";

type FormState = {
    publishedDocumentFolderId: number | "";
    documentName: string;
    documentUrl: string;
    validFrom: string;
    validTo: string;
    files: File[];
};

export default function NewPublishedDocumentPage() {
    const router = useRouter();
    const [folders, setFolders] = useState<PublishedDocumentFolderRow[]>([]);
    const [loadingFolders, setLoadingFolders] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string>("");
    const [showSuccess, setShowSuccess] = useState(false);
    const [form, setForm] = useState<FormState>({ publishedDocumentFolderId: "", documentName: "", documentUrl: "", validFrom: "", validTo: "", files: [] });

    useEffect(() => {
        (async () => {
            setLoadingFolders(true);
            try {
                const res = await fetchPublishedDocumentFoldersODataAction({ top: 2000, skip: 0, orderBy: 'PublishedDocumentFolderName asc' });
                setFolders(res.data?.rows || []);
            } finally { setLoadingFolders(false); }
        })();
    }, []);

    // Build a tree view (flattened with indentation) for the folders dropdown
    // TreeSelect consumes the flat items and renders + / - for expand/collapse

    const canSave = !!(form.publishedDocumentFolderId && form.documentName.trim() && (form.files?.length || form.documentUrl.trim()) && form.validFrom && form.validTo);

    const inputCls = "w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm bg-white";

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        setForm(f => ({ ...f, files: Array.from(e.target.files!) }));
    };

    const save = async () => {
        if (!canSave) { setError('Fill all required fields'); return; }
        setSaving(true);
        try {
            setError("");
            // 1) Upload files (if any) -> get URLs
            let url = form.documentUrl.trim();
            if (form.files.length) {
                const first = form.files[0];
                const up = await uploadToLocal(first);
                url = up.url;
            }
            // Enforce absolute URL: if relative like /uploads/..., prefix with site origin
            try {
                const u = new URL(url, window.location.origin);
                url = u.toString();
            } catch { /* ignore */ }
            // Validate required dates and ensure order
            if (!form.validFrom || !form.validTo) {
                throw new Error('Valid From and Valid To are required');
            }
            const vf = new Date(form.validFrom);
            const vt = new Date(form.validTo);
            if (isNaN(vf.getTime()) || isNaN(vt.getTime())) {
                throw new Error('Please enter valid date/time values');
            }
            if (vt < vf) {
                throw new Error('Valid To must be after Valid From');
            }
            // 2) Call create API with payload
            const payload = {
                id: 0,
                publishedDocumentFolderId: Number(form.publishedDocumentFolderId),
                documentName: form.documentName.trim(),
                documentUrl: url,
                validFrom: form.validFrom,
                validTo: form.validTo,
            };
            const res = await createPublishedDocumentAction(payload as any);
            if (res.status < 200 || res.status >= 300) throw new Error(res.message || 'Create failed');
            setShowSuccess(true);
        } catch (e: any) {
            setError(e?.message || 'Failed to save');
        } finally { setSaving(false); }
    };

    return (
        <div className="p-4 h-full flex flex-col">
            <div className="flex items-start justify-between w-[60%] mx-auto mb-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/published-documents/documents" className="inline-flex items-center text-sm text-indigo-600 hover:underline"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Link>
                    <PageHeader icon={<BookOpenText className="w-6 h-6 text-indigo-600" />} title="New Published Document" showSearch={false} onSearch={() => { }} />
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/published-documents/documents" className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Cancel</Link>
                    <button onClick={() => { if (!canSave) { setError('Fill all required fields'); return; } save(); }} disabled={!canSave || saving} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium shadow hover:bg-indigo-700 disabled:opacity-50">
                        {saving ? "Saving…" : "Create"}
                    </button>
                </div>
            </div>

            <div className="w-[60%] mx-auto bg-white shadow-sm border border-gray-200 rounded-lg p-6 space-y-4">
                {error && (
                    <div className="p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
                        {error}
                    </div>
                )}
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Document Folder <span className="text-red-500">*</span></label>
                    <TreeSelect
                        label=""
                        items={folders}
                        value={form.publishedDocumentFolderId}
                        onChange={(val) => setForm(f => ({ ...f, publishedDocumentFolderId: val }))}
                        placeholder="Select folder…"
                        disabled={loadingFolders}
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Document Name <span className="text-red-500">*</span></label>
                    <input className={inputCls} value={form.documentName} onChange={e => setForm(f => ({ ...f, documentName: e.target.value }))} placeholder="Enter document name" />
                </div>
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Upload Files</label>
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

            {/* No pre-submit confirmation; errors inline and success handled by modal */}
            <ConfirmationModal
                isOpen={showSuccess}
                onConfirm={() => { setShowSuccess(false); router.push('/admin/published-documents/documents'); }}
                onCancel={() => { setShowSuccess(false); router.push('/admin/published-documents/documents'); }}
                title="Document Created Successfully!"
                message="Your document has been created."
                confirmText="Go to Documents"
                cancelText=""
                variant="success"
                className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
            />
        </div>
    );
}
