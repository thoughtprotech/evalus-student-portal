"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Toast from "@/components/Toast";
import { createCandidateGroupAction } from "@/app/actions/admin/candidateGroups";
import { Users, ArrowLeft } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { fetchLanguagesAction } from "@/app/actions/dashboard/questions/fetchLanguages";
import type { GetLanguagesResponse } from "@/utils/api/types";

export default function NewCandidateGroupPage() {
  const router = useRouter();
  const { username } = useUser();
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<number>(0);
  const [language, setLanguage] = useState("");
  const [isActive, setIsActive] = useState(1);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: any } | null>(null);
  const [languages, setLanguages] = useState<GetLanguagesResponse[]>([]);
  const [langLoading, setLangLoading] = useState(false);

  const inputCls = "w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm bg-white";
  const selectCls = inputCls;

  const canSave = name.trim().length > 0;

  const save = async () => {
  if (!canSave) { setToast({ message: 'Enter group name', type: 'warning' }); return; }
  if (!language.trim()) { setToast({ message: 'Select language', type: 'error' }); return; }
    setSaving(true);
    const nowIso = new Date().toISOString();
    const payload = {
      CandidateGroupName: name.trim(),
      ParentId: parentId,
      Language: language,
      IsActive: isActive,
      CreatedBy: username || 'Admin',
      CreatedDate: nowIso,
      ModifiedBy: username || 'Admin',
      ModifiedDate: nowIso,
    };
    const res = await createCandidateGroupAction(payload);
    setSaving(false);
    if (res.status === 200) {
      router.push('/admin/candidate-groups');
    } else {
      setToast({ message: res.message || 'Create failed', type: 'error' });
    }
  };

  // Load active languages and default selection
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLangLoading(true);
      const res = await fetchLanguagesAction();
      if (mounted) {
        if (res.status === 200 && res.data) {
          const active = (res.data || []).filter((l: any) => (l.isActive ?? l.IsActive ?? 1) === 1);
          setLanguages(active);
          if (!language && active.length) setLanguage(active[0].language);
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
      {/* Header with back link and actions to mirror Subject layout */}
      <div className="flex items-start justify-between w-[60%] mx-auto mb-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/candidate-groups" className="inline-flex items-center text-sm text-indigo-600 hover:underline"><ArrowLeft className="w-4 h-4 mr-1"/> Back</Link>
          <PageHeader icon={<Users className="w-6 h-6 text-indigo-600" />} title="New Candidate Group" showSearch={false} onSearch={()=>{}} />
        </div>
        <div className="flex gap-2">
          <Link href="/admin/candidate-groups" className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Cancel</Link>
          <button onClick={save} disabled={!canSave || saving} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium shadow hover:bg-indigo-700 disabled:opacity-50">{saving?"Saving…":"Create"}</button>
        </div>
      </div>

      {/* Centered card */}
      <div className="w-[60%] mx-auto bg-white shadow-sm border border-gray-200 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Group Name<span className="text-red-500 ml-0.5">*</span></label>
          <input value={name} onChange={e=>setName(e.target.value)} className={inputCls} placeholder="e.g., Madhu Test Sub" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Parent Id</label>
          <input type="number" value={parentId} onChange={e=>setParentId(Number(e.target.value||0))} className={inputCls} placeholder="0 for root" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Language<span className="text-red-500 ml-0.5">*</span></label>
          <select
            value={language}
            onChange={e=>setLanguage(e.target.value)}
            className={selectCls}
            disabled={langLoading || languages.length === 0}
          >
            {!langLoading && languages.length === 0 && <option value="">No languages</option>}
            {languages.map(l => (
              <option key={l.language} value={l.language}>{l.language}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Status<span className="text-red-500 ml-0.5">*</span></label>
          <select value={isActive} onChange={e=>setIsActive(Number(e.target.value))} className={selectCls}>
            <option value={1}>Active</option>
            <option value={0}>Inactive</option>
          </select>
        </div>
      </div>

      <div className="fixed top-4 right-4 z-50 space-y-2">{toast && <Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)} />}</div>
    </div>
  );
}
