"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { BookOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Toast from "@/components/Toast";
import { fetchSubjectsAdminAction, updateSubjectAction } from "@/app/actions/admin/subjects";

export default function EditSubjectPage() {
    const params = useParams();
    const id = Number(params?.id);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: any } | null>(null);
    const [form, setForm] = useState({ subjectName: "", subjectType: "Subject", parentId: 0, language: "English", isActive: 1 });

    useEffect(() => {
        (async () => {
            const res = await fetchSubjectsAdminAction();
            if (res.status === 200 && res.data) {
                const row = res.data.find(r => r.id === id);
                if (row) {
                    setForm({ subjectName: row.name, subjectType: row.type, parentId: row.parentId, language: row.language, isActive: row.isActive });
                } else {
                    setToast({ message: 'Subject not found', type: 'error' });
                }
            } else setToast({ message: res.message || 'Failed to load', type: 'error' });
            setLoading(false);
        })();
    }, [id]);

    const submit = async () => {
        if (!form.subjectName.trim()) { setToast({ message: 'Name required', type: 'error' }); return; }
        setSaving(true);
        const res = await updateSubjectAction(id, { ...form, subjectId: id } as any);
        setSaving(false);
        if (res.status === 200) { setToast({ message: 'Updated', type: 'success' }); setTimeout(() => router.push('/admin/subjects'), 600); }
        else setToast({ message: res.message || 'Failed', type: 'error' });
    };

    return (
        <div className="p-4 space-y-4">
            <PageHeader title="Edit Subject" icon={<BookOpen className="w-6 h-6 text-indigo-600" />} onSearch={() => { }} showSearch={false} />
            <Link href="/admin/subjects" className="inline-flex items-center text-sm text-indigo-600 hover:underline"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Link>
            {loading ? <div className="text-sm text-gray-600">Loading…</div> : (
                <div className="bg-white shadow rounded-md p-4 max-w-xl space-y-4">
                    <div className="space-y-1"><label className="block text-sm font-medium">Name</label><input value={form.subjectName} onChange={e => setForm(f => ({ ...f, subjectName: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" /></div>
                    <div className="space-y-1"><label className="block text-sm font-medium">Type</label><select value={form.subjectType} onChange={e => setForm(f => ({ ...f, subjectType: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm"><option>Subject</option><option>Chapter</option><option>Topic</option><option>Sub Topic</option></select></div>
                    <div className="space-y-1"><label className="block text-sm font-medium">Parent Id</label><input type="number" value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: Number(e.target.value) }))} className="w-full border rounded px-3 py-2 text-sm" /></div>
                    <div className="space-y-1"><label className="block text-sm font-medium">Language</label><input value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" /></div>
                    <div className="space-y-1"><label className="block text-sm font-medium">Status</label><select value={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: Number(e.target.value) }))} className="w-full border rounded px-3 py-2 text-sm"><option value={1}>Active</option><option value={0}>Inactive</option></select></div>
                    <div className="pt-2 flex gap-3"><button disabled={saving} onClick={submit} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm disabled:opacity-50">{saving ? 'Saving…' : 'Update'}</button><button onClick={() => router.push('/admin/subjects')} className="px-4 py-2 border rounded-md text-sm">Cancel</button></div>
                </div>
            )}
            <div className="fixed top-4 right-4 space-y-2">{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</div>
        </div>
    );
}
