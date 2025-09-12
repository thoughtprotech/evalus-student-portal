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
import { fetchLanguagesAction } from "@/app/actions/dashboard/questions/fetchLanguages";
import type { GetLanguagesResponse } from "@/utils/api/types";

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
    language: "",
    isActive: 1,
    createdBy: "",
    createdDate: "",
  });
  const [languages, setLanguages] = useState<GetLanguagesResponse[]>([]);
  const [langLoading, setLangLoading] = useState(false);

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
            language: row.language || "",
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

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLangLoading(true);
      const res = await fetchLanguagesAction();
      if (mounted) {
        if (res.status === 200 && res.data) {
          const active = (res.data || []).filter((l: any) => (l.isActive ?? l.IsActive ?? 1) === 1);
          setLanguages(active);
          if (!form.language && active.length) setForm(f => ({ ...f, language: active[0].language }));
        } else {
          setToast({ message: res.message || 'Failed to load languages', type: 'error' });
        }
      }
      setLangLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const submit = async () => {
  if (!form.name.trim()) { setToast({ message: 'Group name required', type: 'error' }); return; }
  if (!form.language.trim()) { setToast({ message: 'Language required', type: 'error' }); return; }
    setSaving(true);
    const nowIso = new Date().toISOString();
    // Use backend-preferred camelCase shape; id is provided in URL, and action will set candidateGroupId
    const payload = {
      candidateGroupName: form.name.trim(),
      parentId: form.parentId,
      language: form.language,
      isActive: form.isActive,
      createdBy: form.createdBy || username || 'Admin',
      createdDate: form.createdDate || nowIso,
      modifiedBy: username || 'Admin',
      modifiedDate: nowIso,
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

  const inputCls = "w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm bg-white";
  const selectCls = inputCls;

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Header + actions */}
      <div className="flex items-start justify-between w-[60%] mx-auto mb-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/candidate-groups" className="inline-flex items-center text-sm text-indigo-600 hover:underline"><ArrowLeft className="w-4 h-4 mr-1"/> Back</Link>
          <PageHeader icon={<Users className="w-6 h-6 text-indigo-600" />} title="Edit Candidate Group" showSearch={false} onSearch={()=>{}} />
        </div>
        <div className="flex gap-2">
          <Link href="/admin/candidate-groups" className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Cancel</Link>
          <button disabled={saving} onClick={submit} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium shadow hover:bg-indigo-700 disabled:opacity-50">{saving?"Saving…":"Update"}</button>
        </div>
      </div>

      {/* Centered card */}
      <div className="w-[60%] mx-auto bg-white shadow-sm border border-gray-200 rounded-lg p-6 space-y-4">
  {loading ? (
          <div className="py-12 text-center text-sm text-gray-600">Loading…</div>
        ) : (
          <>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Group Name<span className="text-red-500 ml-0.5">*</span></label>
              <input value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} className={inputCls} />
            </div>
            {/* Parent Id removed from Edit screen as requested */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Language<span className="text-red-500 ml-0.5">*</span></label>
              <select
                value={form.language}
                onChange={e=>setForm(f=>({...f, language: e.target.value}))}
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
              <select value={form.isActive} onChange={e=>setForm(f=>({...f, isActive: Number(e.target.value)}))} className={selectCls}>
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          </>
        )}
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
