"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ConfirmationModal from "@/components/ConfirmationModal";
import { createCandidateGroupAction } from "@/app/actions/admin/candidateGroups";
import { Users, ArrowLeft } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { fetchLanguagesAction } from "@/app/actions/dashboard/questions/fetchLanguages";
import type { GetLanguagesResponse } from "@/utils/api/types";

export default function NewCandidateGroupPage() {
  const router = useRouter();
  const { username } = useUser();
  // Only top-level group creation
  const [name, setName] = useState("");

  const [language, setLanguage] = useState("");
  const [isActive, setIsActive] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [languages, setLanguages] = useState<GetLanguagesResponse[]>([]);
  const [langLoading, setLangLoading] = useState(false);



  const inputCls = "w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm bg-white";
  const selectCls = inputCls;

  const canSave = useMemo(() => {
    return !!(language.trim() && name.trim());
  }, [name, language]);

  const save = async () => {
    // Guard invalid states; button should already be disabled
    if (!language.trim() || !name.trim()) return;

    setSaving(true);
    const nowIso = new Date().toISOString();
    const payload = {
      CandidateGroupName: name.trim(),
      ParentId: 0, // Always top-level group
      Language: language,
      IsActive: isActive,
      CreatedBy: username || 'Admin',
      CreatedDate: nowIso,
      ModifiedBy: username || 'Admin',
      ModifiedDate: nowIso,
    };
    const res = await createCandidateGroupAction(payload);
    setSaving(false);
    const statusNum = typeof (res as any)?.status === 'number' ? Number((res as any).status) : NaN;
    const noError = (res as any)?.error === false || (res as any)?.error == null;
    const ok = noError && (isNaN(statusNum) || (statusNum >= 200 && statusNum < 400));
    if (ok) {
      setShowSuccessModal(true);
    } else {
      // Silent failure: keep on page; optionally re-enable button
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
          <Link href="/admin/candidate-groups" className="inline-flex items-center text-sm text-indigo-600 hover:underline"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Link>
          <PageHeader icon={<Users className="w-6 h-6 text-indigo-600" />} title="New Candidate Group" showSearch={false} onSearch={() => { }} />
        </div>
        <div className="flex gap-2">
          <Link href="/admin/candidate-groups" className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Cancel</Link>
          <button onClick={save} disabled={!canSave || saving} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium shadow hover:bg-indigo-700 disabled:opacity-50">{saving ? "Saving…" : "Create"}</button>
        </div>
      </div>

      {/* Centered card */}
      <div className="w-[60%] mx-auto bg-white shadow-sm border border-gray-200 rounded-lg p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Group Name<span className="text-red-500 ml-0.5">*</span></label>
          <input value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Enter group name" />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Language<span className="text-red-500 ml-0.5">*</span></label>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
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
          <select value={isActive} onChange={e => setIsActive(Number(e.target.value))} className={selectCls}>
            <option value={1}>Active</option>
            <option value={0}>Inactive</option>
          </select>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showSuccessModal}
        variant="success"
        title="Group Created Successfully!"
        message="The candidate group has been created successfully."
        confirmText="Go to List"
        cancelText=""
        onConfirm={() => { setShowSuccessModal(false); router.push('/admin/candidate-groups'); }}
        onCancel={() => setShowSuccessModal(false)}
      />
    </div>
  );
}
