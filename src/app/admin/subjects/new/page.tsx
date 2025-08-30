"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { BookOpen, ArrowLeft } from "lucide-react";
import { createSubjectAction } from "@/app/actions/admin/subjects";
import Toast from "@/components/Toast";
import Link from "next/link";
import { fetchLanguagesAction } from "@/app/actions/dashboard/questions/fetchLanguages";
import type { GetLanguagesResponse } from "@/utils/api/types";

export default function NewSubjectPage() {
    const router = useRouter();
    const [form, setForm] = useState({ subjectName: "", subjectType: "Subject", parentId: 0, language: "", isActive: 1 });
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: any } | null>(null);
    const [languages, setLanguages] = useState<GetLanguagesResponse[]>([]);
    const [langLoading, setLangLoading] = useState(false);

    const submit = async () => {
        if (!form.subjectName.trim()) { setToast({ message: 'Name required', type: 'error' }); return; }
        if (!form.language.trim()) { setToast({ message: 'Language required', type: 'error' }); return; }
        setSaving(true);
        const res = await createSubjectAction(form as any);
        setSaving(false);
        if (res.status === 200) { setToast({ message: 'Subject created', type: 'success' }); setTimeout(() => router.push('/admin/subjects'), 600); }
        else setToast({ message: res.message || 'Failed', type: 'error' });
    };

    // Load active languages from API
    useEffect(() => {
        let mounted = true;
        (async () => {
            setLangLoading(true);
            const res = await fetchLanguagesAction();
            if (mounted) {
                if (res.status === 200 && Array.isArray(res.data)) {
                    const active = res.data.filter(l => Number(l.isActive) === 1);
                    setLanguages(active);
                    // If no language selected yet, default to first active
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
                    <PageHeader title="New Subject" icon={<BookOpen className="w-6 h-6 text-indigo-600" />} showSearch={false} onSearch={()=>{}} />
                </div>
                <div className="flex gap-2">
                    <button onClick={() => router.push('/admin/subjects')} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Cancel</button>
                    <button disabled={saving} onClick={submit} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium shadow hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving…' : 'Create'}</button>
                </div>
            </div>
            <div className="w-[60%] mx-auto bg-white shadow-sm border border-gray-200 rounded-lg p-6 overflow-auto">
                <div className="space-y-5">
                    <div className="space-y-1">
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Name<span className="text-red-500 ml-0.5">*</span></label>
                        <input value={form.subjectName} onChange={e => setForm(f => ({ ...f, subjectName: e.target.value }))} className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm" placeholder="Subject name" />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Type</label>
                        <select value={form.subjectType} onChange={e => setForm(f => ({ ...f, subjectType: e.target.value }))} className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm bg-white"><option>Subject</option><option>Chapter</option><option>Topic</option><option>Sub Topic</option></select>
                    </div>
                    <div className="space-y-1">
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Parent ID</label>
                        <input type="number" value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: Number(e.target.value) }))} className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm" placeholder="0 for root" />
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
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Status</label>
                        <select value={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: Number(e.target.value) }))} className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm bg-white"><option value={1}>Active</option><option value={0}>Inactive</option></select>
                    </div>
                </div>
            </div>
            <div className="fixed top-4 right-4 space-y-2 z-50">{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</div>
        </div>
    );
}
