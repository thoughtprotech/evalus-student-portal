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
import { fetchCandidateGroupsODataAction, CandidateGroupRow } from "@/app/actions/admin/candidateGroups";

type FormState = {
    publishedDocumentFolderId: number | "";
    documentName: string;
    documentUrl: string;
    documentType: "document" | "youtube" | "mp4" | "file";
    validFrom: string;
    validTo: string;
    files: File[];
    selectedGroupIds: number[];
};

export default function NewPublishedDocumentPage() {
    const router = useRouter();
    const [folders, setFolders] = useState<PublishedDocumentFolderRow[]>([]);
    const [groups, setGroups] = useState<CandidateGroupRow[]>([]);
    const [loadingFolders, setLoadingFolders] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string>("");
    const [showSuccess, setShowSuccess] = useState(false);
    const [form, setForm] = useState<FormState>({ publishedDocumentFolderId: "", documentName: "", documentUrl: "", documentType: "document", validFrom: "", validTo: "", files: [], selectedGroupIds: [] });

    useEffect(() => {
        (async () => {
            setLoadingFolders(true);
            try {
                const res = await fetchPublishedDocumentFoldersODataAction({ top: 2000, skip: 0, orderBy: 'PublishedDocumentFolderName asc' });
                setFolders(res.data?.rows || []);
                // Fetch candidate groups
                const groupRes = await fetchCandidateGroupsODataAction({ top: 100, skip: 0, orderBy: "CandidateGroupName asc" });
                setGroups(groupRes.data?.rows || []);
            } finally { setLoadingFolders(false); }
        })();
    }, []);

    // Build a tree view (flattened with indentation) for the folders dropdown
    // TreeSelect consumes the flat items and renders + / - for expand/collapse

    const canSave = !!(form.publishedDocumentFolderId && form.documentName.trim() && (form.files?.length || form.documentUrl.trim()) && form.validFrom && form.validTo && form.documentType);

    const inputCls = "w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm bg-white";

    const onMp4Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        setForm(f => ({ ...f, files: Array.from(e.target.files!), documentType: "mp4" }));
    };

    const onDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        setForm(f => ({ ...f, files: Array.from(e.target.files!), documentType: "file" }));
    };

    const save = async () => {
        if (!canSave) { setError('Fill all required fields'); return; }
        setSaving(true);
        try {
            setError("");
            let url = form.documentUrl.trim();
            let docType = form.documentType;
            if (form.files.length) {
                const first = form.files[0];
                const up = await uploadToLocal(first);
                url = up.url;
                // keep selected documentType for uploaded files ("mp4" or "file")
                docType = form.documentType;
            } else if (form.documentType === "youtube") {
                docType = "youtube";
            } else {
                docType = "document";
            }
            try {
                const u = new URL(url, window.location.origin);
                url = u.toString();
            } catch { /* ignore */ }
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
            const payload = {
                id: 0,
                publishedDocumentFolderId: Number(form.publishedDocumentFolderId),
                documentName: form.documentName.trim(),
                documentUrl: url,
                documentType: docType,
                validFrom: form.validFrom,
                validTo: form.validTo,
                candidateRegisteredPublishedDocuments: form.selectedGroupIds.map(id => ({ publishedDocumentId: 0, candidateGroupId: id }))
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
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Document Type <span className="text-red-500">*</span></label>
                    <select
                        className={inputCls}
                        value={form.documentType}
                        onChange={e => setForm(f => ({ ...f, documentType: e.target.value as "document" | "youtube" | "mp4" }))}
                        aria-label="Select document type"
                        title="Select document type"
                    >
                        <option value="document">Document URL</option>
                        <option value="youtube">YouTube URL</option>
                        <option value="mp4">.mp4 Upload</option>
                        <option value="file">Upload Document</option>
                    </select>
                </div>
                {form.documentType === "mp4" && (
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Upload .mp4 File</label>
                        <input type="file" accept=".mp4" onChange={onMp4Change} className={inputCls} />
                        <p className="mt-1 text-xs text-gray-500">Upload a .mp4 file.</p>
                    </div>
                )}
                {form.documentType === "file" && (
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Upload Document</label>
                        <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" onChange={onDocFileChange} className={inputCls} />
                        <p className="mt-1 text-xs text-gray-500">Upload PDF or Office documents.</p>
                    </div>
                )}
                {form.documentType === "youtube" && (
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">YouTube URL</label>
                        <input
                            type="url"
                            id="youtubeUrl"
                            name="youtubeUrl"
                            placeholder="Paste YouTube video URL here"
                            pattern="https://www.youtube.com/.*|https://youtu.be/.*"
                            className={inputCls}
                            value={form.documentUrl}
                            onChange={e => setForm(f => ({ ...f, documentUrl: e.target.value }))} />
                    </div>
                )}
                {form.documentType === "document" && (
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Document URL</label>
                        <input
                            type="url"
                            id="documentUrl"
                            name="documentUrl"
                            placeholder="Paste document URL here"
                            className={inputCls}
                            value={form.documentUrl}
                            onChange={e => setForm(f => ({ ...f, documentUrl: e.target.value }))} />
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
                {/* Candidate Groups Multi-Checkbox */}
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">
                        Select one or more groups to register
                    </label>
                    <div className="border rounded p-2">
                        {groups.map(group => (
                            <div key={group.id} className="flex items-center mb-1">
                                <input
                                    type="checkbox"
                                    className="mr-2"
                                    checked={form.selectedGroupIds.includes(group.id)}
                                    onChange={e => {
                                        setForm(f => ({
                                            ...f,
                                            selectedGroupIds: e.target.checked
                                                ? [...f.selectedGroupIds, group.id]
                                                : f.selectedGroupIds.filter(id => id !== group.id)
                                        }));
                                    }}
                                    id={`group_${group.id}`}
                                />
                                <label htmlFor={`group_${group.id}`}>{group.name}</label>
                            </div>
                        ))}
                        <div className="text-xs text-right text-gray-500 mt-1">Selected: {form.selectedGroupIds.length}</div>
                    </div>
                </div>
            </div>

            {/* No pre-submit confirmation; errors inline and success handled by modal */}
            <ConfirmationModal
                isOpen={showSuccess}
                onConfirm={() => { setShowSuccess(false); router.push('/admin/published-documents/documents'); }}
                onCancel={() => { setShowSuccess(false); router.push('/admin/published-documents/documents'); }}
                title="Document Created Successfully!"
                message="Your document has been created."
                cancelText=""
                variant="success"
                className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
            />
        </div>
    );
}
