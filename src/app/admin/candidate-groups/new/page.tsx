"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Toast from "@/components/Toast";
import { createCandidateGroupAction } from "@/app/actions/admin/candidateGroups";
import { Users, ArrowLeft } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

export default function NewCandidateGroupPage() {
  const router = useRouter();
  const { username } = useUser();
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<number>(0);
  const [language, setLanguage] = useState("English");
  const [isActive, setIsActive] = useState(1);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: any } | null>(null);

  const canSave = name.trim().length > 0;

  const save = async () => {
    if (!canSave) { setToast({ message: 'Enter group name', type: 'warning' }); return; }
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

  return (
    <div className="p-4 bg-gray-50 h-full flex flex-col">
      <div className="sticky top-0 z-20 bg-gray-50 pt-2 pb-3">
  <PageHeader icon={<Users className="w-6 h-6 text-indigo-600" />} title="New Candidate Group" onSearch={()=>{}} showSearch={false} />
      </div>
      <div className="bg-white shadow rounded-lg p-4 max-w-3xl">
        <div className="mb-4"><Link href="/admin/candidate-groups" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"><ArrowLeft className="w-4 h-4"/> Back</Link></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Group Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g., Madhu Test Sub" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Parent Id</label>
            <input type="number" value={parentId} onChange={e=>setParentId(Number(e.target.value||0))} className="w-full border rounded px-3 py-2" placeholder="0 for root" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Language</label>
            <input value={language} onChange={e=>setLanguage(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="English" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Status</label>
            <select value={isActive} onChange={e=>setIsActive(Number(e.target.value))} className="w-full border rounded px-3 py-2">
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <button disabled={!canSave || saving} onClick={save} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md">{saving ? 'Saving…' : 'Save'}</button>
          <Link href="/admin/candidate-groups" className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">Cancel</Link>
        </div>
      </div>
      <div className="fixed top-4 right-4 z-50 space-y-2">{toast && <Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)} />}</div>
    </div>
  );
}
