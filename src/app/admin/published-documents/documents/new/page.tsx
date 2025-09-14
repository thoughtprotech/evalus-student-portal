"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import Toast from "@/components/Toast";
import ConfirmationModal from "@/components/ConfirmationModal";
import { ArrowLeft, BookOpenText, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchPublishedDocumentFoldersODataAction, type PublishedDocumentFolderRow } from "@/app/actions/admin/publishedDocumentFolders";

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
    const [toast, setToast] = useState<{ message: string; type: any } | null>(null);
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

    const canSave = form.publishedDocumentFolderId && form.documentName.trim() && (form.files?.length || form.documentUrl.trim());

    const inputCls = "w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm bg-white";

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        setForm(f => ({ ...f, files: Array.from(e.target.files!) }));
    };

    const save = async () => {
        if (!canSave) { setToast({ message: 'Fill required fields', type: 'error' }); return; }
        setSaving(true);
        try {
            // 1) Upload files (if any) -> get URLs
            let url = form.documentUrl.trim();
            if (form.files.length) {
                // TODO: call upload API to save in root folder and return URL(s)
                // For now, placeholder: pick first file name under /uploads
                url = `/uploads/${form.files[0].name}`;
            }
            // 2) Call create API with payload
            // TODO: createPublishedDocumentAction
            setToast(null);
            setShowSuccess(true);
        } catch (e: any) {
            setToast({ message: e?.message || 'Failed to save', type: 'error' });
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
                    <button onClick={save} disabled={!canSave || saving} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium shadow hover:bg-indigo-700 disabled:opacity-50">
                        {saving ? "Saving…" : "Create"}
                    </button>
                </div>
            </div>

            <div className="w-[60%] mx-auto bg-white shadow-sm border border-gray-200 rounded-lg p-6 space-y-4">
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Document Folder <span className="text-red-500">*</span></label>
                    <select className={inputCls} value={form.publishedDocumentFolderId} onChange={e => setForm(f => ({ ...f, publishedDocumentFolderId: e.target.value ? Number(e.target.value) : "" }))} disabled={loadingFolders}>
                        <option value="">Select folder…</option>
                        {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Document Name <span className="text-red-500">*</span></label>
                    <input className={inputCls} value={form.documentName} onChange={e => setForm(f => ({ ...f, documentName: e.target.value }))} placeholder="Enter document name" />
                </div>
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Upload Files <span className="text-red-500">*</span></label>
                    <input type="file" multiple onChange={onFileChange} className={inputCls} />
                </div>
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Or Document URL</label>
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
