"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Toast from "@/components/Toast";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Users, ArrowLeft } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { fetchCandidateGroupsODataAction, updateCandidateGroupAction, type CandidateGroupRow } from "@/app/actions/admin/candidateGroups";

export default function EditCandidateGroupPage() {
  const params = useParams();
  const id = Number(params?.id);
  const router = useRouter();
  const { username } = useUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: any } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    parentId: 0,
    language: "English",
    isActive: 1,
    createdBy: "",
    createdDate: "",
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const filter = `CandidateGroupId eq ${id}`;
      const res = await fetchCandidateGroupsODataAction({ top: 1, skip: 0, filter });
      if (!mounted) return;
      if (res.status === 200 && res.data) {
        const row = res.data.rows.find(r => r.id === id);
        if (row) {
          setForm({
            name: row.name,
            parentId: row.parentId ?? 0,
            language: row.language || "English",
            isActive: row.isActive ?? 1,
            createdBy: row.createdBy || username || 'Admin',
            createdDate: row.createdDate || new Date().toISOString(),
          });
        } else {
          setToast({ message: 'Candidate Group not found', type: 'error' });
        }
      } else {
        setToast({ message: res.message || 'Failed to load group', type: 'error' });
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [id]);

  const submit = async () => {
    if (!form.name.trim()) { setToast({ message: 'Group name required', type: 'error' }); return; }
    setSaving(true);
    const nowIso = new Date().toISOString();
    const payload = {
      CandidateGroupId: id,
      CandidateGroupName: form.name.trim(),
      ParentId: form.parentId,
      Language: form.language,
      IsActive: form.isActive,
      CreatedBy: form.createdBy || username || 'Admin',
      CreatedDate: form.createdDate || nowIso,
      ModifiedBy: username || 'Admin',
      ModifiedDate: nowIso,
    } as any;
    const res = await updateCandidateGroupAction(id, payload);
    setSaving(false);
    if (res.status >= 200 && res.status < 300) {
      setToast(null);
      setShowSuccess(true);
    } else {
      setToast({ message: res.message || 'Update failed', type: 'error' });
    }
  };

  return (
    <div className="p-4 bg-gray-50 h-full flex flex-col">
      <div className="sticky top-0 z-20 bg-gray-50 pt-2 pb-3">
        <PageHeader icon={<Users className="w-6 h-6 text-indigo-600" />} title="Edit Candidate Group" onSearch={()=>{}} showSearch={false} />
      </div>
      <div className="bg-white shadow rounded-lg p-4 max-w-3xl">
        <div className="mb-4"><Link href="/admin/candidate-groups" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"><ArrowLeft className="w-4 h-4"/> Back</Link></div>
        {loading ? (
          <div className="py-20 flex justify-center text-sm text-gray-600">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Group Name</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Parent Id</label>
              <input type="number" value={form.parentId} onChange={e=>setForm(f=>({...f, parentId: Number(e.target.value||0)}))} className="w-full border rounded px-3 py-2" placeholder="0 for root" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Language</label>
              <input value={form.language} onChange={e=>setForm(f=>({...f, language: e.target.value}))} className="w-full border rounded px-3 py-2" placeholder="English" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Status</label>
              <select value={form.isActive} onChange={e=>setForm(f=>({...f, isActive: Number(e.target.value)}))} className="w-full border rounded px-3 py-2">
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          </div>
        )}
        <div className="mt-6 flex items-center gap-3">
          <button disabled={saving} onClick={submit} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md">{saving ? 'Saving…' : 'Update'}</button>
          <Link href="/admin/candidate-groups" className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">Cancel</Link>
        </div>
      </div>
      <div className="fixed top-4 right-4 z-50 space-y-2">{toast && <Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)} />}</div>
      <ConfirmationModal
        isOpen={showSuccess}
        onConfirm={() => { setShowSuccess(false); router.push('/admin/candidate-groups'); }}
        onCancel={() => { setShowSuccess(false); router.push('/admin/candidate-groups'); }}
        title="Candidate Group Updated Successfully!"
        message="Group data saved."
        confirmText="Go to Groups"
        cancelText=""
        variant="success"
        className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
      />
    </div>
  );
}
