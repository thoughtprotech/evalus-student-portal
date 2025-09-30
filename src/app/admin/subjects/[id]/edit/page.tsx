"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { BookOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Toast from "@/components/Toast";
import { fetchSubjectsAdminAction, updateSubjectAction } from "@/app/actions/admin/subjects";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useUser } from "@/contexts/UserContext";
import { fetchLanguagesAction } from "@/app/actions/dashboard/questions/fetchLanguages";
import type { GetLanguagesResponse } from "@/utils/api/types";
import { unmaskAdminId } from "@/utils/urlMasking";

export default function EditSubjectPage() {
    const params = useParams();
    const maskedId = params?.id as string;
    const id = unmaskAdminId(maskedId);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: any } | null>(null);
    const [form, setForm] = useState({ subjectName: "", subjectType: "Subject", parentId: 0, language: "", isActive: 1, createdBy: "", createdDate: "" });
    const [languages, setLanguages] = useState<GetLanguagesResponse[]>([]);
    const [langLoading, setLangLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const { username } = useUser();

    useEffect(() => {
        // Validate masked ID first
        if (id === null) {
            setToast({ message: 'Invalid subject ID', type: 'error' });
            setLoading(false);
            return;
        }

        (async () => {
            const res = await fetchSubjectsAdminAction();
            if (res.status === 200 && res.data) {
                const row = res.data.find(r => r.id === id);
                if (row) {
                    setForm({ subjectName: row.name, subjectType: row.type, parentId: row.parentId, language: row.language, isActive: row.isActive, createdBy: row.createdBy || username || 'System', createdDate: row.createdDate || new Date().toISOString() });
                } else {
                    setToast({ message: 'Subject not found', type: 'error' });
                }
            } else setToast({ message: res.message || 'Failed to load', type: 'error' });
            setLoading(false);
        })();
    }, [id]);

    const submit = async () => {
        if (id === null) {
            setToast({ message: 'Invalid subject ID', type: 'error' });
            return;
        }
        if (!form.subjectName.trim()) { setToast({ message: 'Name required', type: 'error' }); return; }
        if (!form.language.trim()) { setToast({ message: 'Language required', type: 'error' }); return; }
        setSaving(true);
        const nowIso = new Date().toISOString();
        const res = await updateSubjectAction(id, {
            subjectId: id,
            subjectName: form.subjectName,
            subjectType: form.subjectType,
            parentId: form.parentId,
            language: form.language,
            isActive: form.isActive,
            createdBy: form.createdBy || username || 'System',
            createdDate: form.createdDate || nowIso,
            modifiedBy: username || 'System',
            modifiedDate: nowIso,
        } as any);
        setSaving(false);
        if (res.status >= 200 && res.status < 300) { setToast(null); setShowSuccess(true); }
        else setToast({ message: res.message || 'Failed', type: 'error' });
    };

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLangLoading(true);
            const res = await fetchLanguagesAction();
            if (mounted) {
                if (res.status === 200 && Array.isArray(res.data)) {
                    const active = res.data.filter(l => Number(l.isActive) === 1);
                    setLanguages(active);
                    if (!form.language && active.length) {
                        setForm(f => ({ ...f, language: active[0].language }));
                    }
                } else {
                    setToast({ message: res.message || 'Failed to load languages', type: 'error' });
                }
            }
            setLangLoading(false);
        })();
        return () => { mounted = false; };
    }, []);
    return (
        <div className="p-4 h-full flex flex-col">
            <div className="flex items-start justify-between w-[60%] mx-auto mb-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/subjects" className="inline-flex items-center text-sm text-indigo-600 hover:underline"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Link>
                    <PageHeader title="Edit Subject" icon={<BookOpen className="w-6 h-6 text-indigo-600" />} showSearch={false} onSearch={() => { }} />
                </div>
                <div className="flex gap-2">
                    <button onClick={() => router.push('/admin/subjects')} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Cancel</button>
                    <button disabled={saving} onClick={submit} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium shadow hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving…' : 'Update'}</button>
                </div>
            </div>
            <div className="w-[60%] mx-auto bg-white shadow-sm border border-gray-200 rounded-lg p-6 overflow-auto">
                {loading ? <div className="py-20 flex justify-center text-sm text-gray-600">Loading…</div> : (
                    <div className="space-y-5">
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Name<span className="text-red-500 ml-0.5">*</span></label>
                            <input value={form.subjectName} onChange={e => setForm(f => ({ ...f, subjectName: e.target.value }))} className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm" />
                        </div>
                        {/* Hidden: Type & Parent ID */}
                        <input type="hidden" value={form.subjectType} readOnly />
                        <input type="hidden" value={form.parentId} readOnly />
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
                            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Status</label>
                            <select value={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: Number(e.target.value) }))} className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm bg-white"><option value={1}>Active</option><option value={0}>Inactive</option></select>
                        </div>
                    </div>
                )}
            </div>
            <div className="fixed top-4 right-4 space-y-2 z-50">{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</div>
            <ConfirmationModal
                isOpen={showSuccess}
                onConfirm={() => { setShowSuccess(false); router.push('/admin/subjects'); }}
                onCancel={() => { setShowSuccess(false); router.push('/admin/subjects'); }}
                title="Subject Updated Successfully!"
                message="Subject data saved."
                confirmText="Go to Subjects"
                cancelText=""
                variant="success"
                className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
            />
        </div>
    );
}
