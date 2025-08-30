"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { BookOpen, ArrowLeft } from "lucide-react";
import { createSubjectAction, fetchSubjectsODataAction, type SubjectRow } from "@/app/actions/admin/subjects";
import ConfirmationModal from "@/components/ConfirmationModal";
import Toast from "@/components/Toast";
import Link from "next/link";
import { fetchLanguagesAction } from "@/app/actions/dashboard/questions/fetchLanguages";
import { useUser } from "@/contexts/UserContext";
import type { GetLanguagesResponse } from "@/utils/api/types";

export default function NewSubjectPage() {
    const router = useRouter();
    const [form, setForm] = useState({ subjectName: "", subjectType: "Subject", parentId: 0, language: "", isActive: 1 });
    const { username } = useUser();
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: any } | null>(null);
    const [languages, setLanguages] = useState<GetLanguagesResponse[]>([]);
    const [langLoading, setLangLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Subject hierarchy data
    const [subjectsLoading, setSubjectsLoading] = useState(false);
    const [subjects, setSubjects] = useState<SubjectRow[]>([]); // all rows

    // Selected ancestor ids for cascading selection (only meaning for non-root types)
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null); // a 'Subject' when creating Chapter/Topic/Sub Topic
    const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
    const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);

    // Filtered lists memoized for dropdowns
    const rootSubjects = useMemo(() => subjects.filter(s => s.type === 'Subject'), [subjects]);
    const chaptersForSelectedSubject = useMemo(
        () => selectedSubjectId ? subjects.filter(s => s.type === 'Chapter' && s.parentId === selectedSubjectId) : [],
        [subjects, selectedSubjectId]
    );
    const topicsForSelectedChapter = useMemo(
        () => selectedChapterId ? subjects.filter(s => s.type === 'Topic' && s.parentId === selectedChapterId) : [],
        [subjects, selectedChapterId]
    );

    const submit = async () => {
        // Basic required fields
        if (!form.subjectName.trim()) { setToast({ message: 'Name is required', type: 'error' }); return; }
        if (!form.language.trim()) { setToast({ message: 'Language is required', type: 'error' }); return; }

        // Determine parent and validate hierarchy based on type
        let computedParentId = 0;
        switch (form.subjectType) {
            case 'Subject':
                computedParentId = 0; // root
                break;
            case 'Chapter':
                if (!selectedSubjectId) { setToast({ message: 'Select a Subject', type: 'error' }); return; }
                computedParentId = selectedSubjectId;
                break;
            case 'Topic':
                if (!selectedSubjectId) { setToast({ message: 'Select a Subject', type: 'error' }); return; }
                if (!selectedChapterId) { setToast({ message: 'Select a Chapter', type: 'error' }); return; }
                computedParentId = selectedChapterId;
                break;
            case 'Sub Topic':
                if (!selectedSubjectId) { setToast({ message: 'Select a Subject', type: 'error' }); return; }
                if (!selectedChapterId) { setToast({ message: 'Select a Chapter', type: 'error' }); return; }
                if (!selectedTopicId) { setToast({ message: 'Select a Topic', type: 'error' }); return; }
                computedParentId = selectedTopicId;
                break;
            default:
                computedParentId = 0;
        }

        setSaving(true);
        const nowIso = new Date().toISOString();
        // Even though CreateSubjectRequest doesn't require audit fields, backend sample payload shows them.
        const res = await createSubjectAction({
            ...form,
            parentId: computedParentId,
            // Extra fields (if server ignores, harmless). Cast to any to satisfy narrower TS type.
            createdBy: username || 'System',
            modifiedBy: username || 'System',
            createdDate: nowIso,
            modifiedDate: nowIso,
        } as any);
        setSaving(false);
        if (res.status >= 200 && res.status < 300) {
            setToast({ message: 'Subject created', type: 'success' });
            setShowSuccessModal(true);
        } else {
            setToast({ message: res.message || 'Failed to create subject', type: 'error' });
        }
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

    // Load all subjects for parent selection (large upper bound to cover all)
    useEffect(() => {
        let mounted = true;
        (async () => {
            setSubjectsLoading(true);
            const res = await fetchSubjectsODataAction({ top: 2000, skip: 0, orderBy: 'SubjectName asc' });
            if (mounted) {
                if (res.status === 200 && res.data) {
                    setSubjects(res.data.rows);
                } else {
                    setToast({ message: res.message || 'Failed to load subjects', type: 'error' });
                }
            }
            setSubjectsLoading(false);
        })();
        return () => { mounted = false; };
    }, []);

    // When type changes reset selections and parentId
    useEffect(() => {
        setSelectedSubjectId(null); setSelectedChapterId(null); setSelectedTopicId(null);
        setForm(f => ({ ...f, parentId: 0 }));
    }, [form.subjectType]);

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
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Type<span className="text-red-500 ml-0.5">*</span></label>
                        <select value={form.subjectType} onChange={e => setForm(f => ({ ...f, subjectType: e.target.value }))} className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm bg-white"><option>Subject</option><option>Chapter</option><option>Topic</option><option>Sub Topic</option></select>
                    </div>
                    {form.subjectType !== 'Subject' && (
                        <div className="space-y-4">
                            {form.subjectType !== 'Subject' && (
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Subject<span className="text-red-500 ml-0.5">*</span></label>
                                    <select
                                        value={selectedSubjectId ?? ''}
                                        onChange={e => {
                                            const v = e.target.value ? Number(e.target.value) : null;
                                            setSelectedSubjectId(v); setSelectedChapterId(null); setSelectedTopicId(null);
                                        }}
                                        className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm bg-white"
                                    >
                                        <option value="">Select Subject</option>
                                        {rootSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            )}
                            {['Chapter','Topic','Sub Topic'].includes(form.subjectType) && form.subjectType !== 'Chapter' && (
                                <></>
                            )}
                            {['Topic','Sub Topic'].includes(form.subjectType) && (
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Chapter<span className="text-red-500 ml-0.5">*</span></label>
                                    <select
                                        value={selectedChapterId ?? ''}
                                        onChange={e => { const v = e.target.value ? Number(e.target.value) : null; setSelectedChapterId(v); setSelectedTopicId(null); }}
                                        className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm bg-white"
                                        disabled={!selectedSubjectId}
                                    >
                                        <option value="">{selectedSubjectId ? 'Select Chapter' : 'Select Subject first'}</option>
                                        {chaptersForSelectedSubject.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            )}
                            {form.subjectType === 'Sub Topic' && (
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Topic<span className="text-red-500 ml-0.5">*</span></label>
                                    <select
                                        value={selectedTopicId ?? ''}
                                        onChange={e => { const v = e.target.value ? Number(e.target.value) : null; setSelectedTopicId(v); }}
                                        className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm bg-white"
                                        disabled={!selectedChapterId}
                                    >
                                        <option value="">{selectedChapterId ? 'Select Topic' : 'Select Chapter first'}</option>
                                        {topicsForSelectedChapter.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            )}
                            {subjectsLoading && <p className="text-xs text-gray-500 italic">Loading hierarchy…</p>}
                        </div>
                    )}
                    <div className="space-y-1">
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Name<span className="text-red-500 ml-0.5">*</span></label>
                        <input value={form.subjectName} onChange={e => setForm(f => ({ ...f, subjectName: e.target.value }))} className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm" placeholder="Name" />
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
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Status<span className="text-red-500 ml-0.5">*</span></label>
                        <select value={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: Number(e.target.value) }))} className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm bg-white"><option value={1}>Active</option><option value={0}>Inactive</option></select>
                    </div>
                </div>
            </div>
            <div className="fixed top-4 right-4 space-y-2 z-50">{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</div>
            {/* Success Confirmation Modal */}
            <ConfirmationModal
                isOpen={showSuccessModal}
                onConfirm={() => { setShowSuccessModal(false); router.push('/admin/subjects'); }}
                onCancel={() => { setShowSuccessModal(false); router.push('/admin/subjects'); }}
                title="Subject Created Successfully!"
                message="The subject has been saved."
                confirmText="Go to Subjects"
                cancelText=""
                variant="success"
                className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
            />
        </div>
    );
}
