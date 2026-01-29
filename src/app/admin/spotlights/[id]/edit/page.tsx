"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { HelpCircle, ArrowLeft } from "lucide-react";
import Toast from "@/components/Toast";
import EditPageLoader from "@/components/EditPageLoader";
import ConfirmationModal from "@/components/ConfirmationModal";
import DateTimePicker from "@/components/form/DateTimePicker";
import { getSpotlightByIdAction, updateSpotlightAction } from "@/app/actions/admin/spotlights";
import { fetchCandidateGroupsODataAction, CandidateGroupRow } from "@/app/actions/admin/candidateGroups";

export default function EditSpotlightPage() {
    const params = useParams();
    const maskedId = params?.id as string;
    const id = parseInt(maskedId, 10);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: any } | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [validFrom, setValidFrom] = useState<string>("");
    const [validTo, setValidTo] = useState<string>("");
    const [addedDate, setAddedDate] = useState<string>("");
    const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
    const [groups, setGroups] = useState<CandidateGroupRow[]>([]);

    useEffect(() => {
        // Validate masked ID first
        if (id === null) {
            setToast({ message: 'Invalid spotlight ID', type: 'error' });
            setLoading(false);
            return;
        }

        (async () => {
            // Fetch both spotlight data and candidate groups
            const [spotlightRes, groupsRes] = await Promise.all([
                getSpotlightByIdAction(id),
                fetchCandidateGroupsODataAction({ top: 100, skip: 0, orderBy: "CandidateGroupName asc" })
            ]);

            if (spotlightRes.status === 200 && spotlightRes.data) {
                setName(spotlightRes.data.name || "");
                setDescription(spotlightRes.data.description || "");
                setValidFrom(spotlightRes.data.validFrom || "");
                setValidTo(spotlightRes.data.validTo || "");
                setAddedDate(spotlightRes.data.addedDate || "");
                
                // Set selected group IDs if present
                if (Array.isArray(spotlightRes.data.candidateRegisteredSpotlights)) {
                    setSelectedGroupIds(spotlightRes.data.candidateRegisteredSpotlights.map(x => Number(x.candidateGroupId)));
                }
            } else {
                setToast({ message: spotlightRes.message || "Failed to load spotlight", type: "error" });
            }

            if (groupsRes.status === 200 && groupsRes.data) {
                setGroups(groupsRes.data.rows);
            }

            setLoading(false);
        })();
    }, [id]);

    const submit = async () => {
        if (id === null) {
            setToast({ message: 'Invalid spotlight ID', type: 'error' });
            return;
        }
        if (!name.trim()) { setToast({ message: 'Name is required', type: 'error' }); return; }
        if (!validFrom || !validTo) { setToast({ message: 'Valid From and Valid To are required', type: 'error' }); return; }
        if (new Date(validFrom) > new Date(validTo)) { setToast({ message: 'Valid To should be after Valid From', type: 'error' }); return; }

        setSaving(true);
        const res = await updateSpotlightAction(id, { name, description, validFrom, validTo, addedDate: addedDate || undefined, selectedGroupIds });
        setSaving(false);
        if (res && res.status >= 200 && res.status < 300) {
            setShowSuccess(true);
        } else {
            setToast({ message: res?.message || res?.errorMessage || 'Update failed', type: 'error' });
        }
    };

    return (
        <div className="p-4 h-full flex flex-col">
            <div className="flex items-start justify-between w-[60%] mx-auto mb-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/spotlights" className="inline-flex items-center text-sm text-indigo-600 hover:underline"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Link>
                    <PageHeader title="Edit Spotlight" icon={<HelpCircle className="w-6 h-6 text-indigo-600" />} showSearch={false} onSearch={() => { }} />
                </div>
                <div className="flex gap-2">
                    <button onClick={() => router.push('/admin/spotlights')} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Cancel</button>
                    <button disabled={saving} onClick={submit} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium shadow hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving…' : 'Update'}</button>
                </div>
            </div>
            <div className="w-[60%] mx-auto bg-white shadow-sm border border-gray-200 rounded-lg p-6 overflow-auto">
                {loading ? <EditPageLoader message="Loading spotlight..." /> : (
                    <div className="space-y-5">
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Name<span className="text-red-500 ml-0.5">*</span></label>
                            <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm" placeholder="e.g., Hiring Spotlight" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Description<span className="text-red-500 ml-0.5">*</span></label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm" rows={4} placeholder="Details..." />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DateTimePicker label="Valid From" value={validFrom} onChange={setValidFrom} required maxDateTime={validTo || undefined} />
                            <DateTimePicker label="Valid To" value={validTo} onChange={setValidTo} required minDateTime={validFrom || undefined} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">
                                Candidate Groups
                            </label>
                            <div className="border rounded p-2 max-h-60 overflow-y-auto">
                                {groups.length === 0 ? (
                                    <p className="text-sm text-gray-500">Loading groups...</p>
                                ) : (
                                    <>
                                        {groups.map(group => (
                                            <div key={group.id} className="flex items-center mb-1">
                                                <input
                                                    type="checkbox"
                                                    className="mr-2"
                                                    checked={selectedGroupIds.includes(Number(group.id))}
                                                    onChange={e => {
                                                        setSelectedGroupIds(prev =>
                                                            e.target.checked
                                                                ? [...prev, Number(group.id)]
                                                                : prev.filter(id => id !== Number(group.id))
                                                        );
                                                    }}
                                                    id={`group_${group.id}`}
                                                />
                                                <label htmlFor={`group_${group.id}`} className="text-sm">{group.name}</label>
                                            </div>
                                        ))}
                                        <div className="text-xs text-right text-gray-500 mt-1">Selected: {selectedGroupIds.length}</div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="fixed top-4 right-4 space-y-2 z-50">{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</div>
            <ConfirmationModal
                isOpen={showSuccess}
                onConfirm={() => { setShowSuccess(false); router.push('/admin/spotlights'); }}
                onCancel={() => { setShowSuccess(false); router.push('/admin/spotlights'); }}
                title="Spotlight Updated"
                message="Your spotlight has been updated successfully."
                confirmText="Go to List"
                cancelText=""
                variant="success"
                className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
            />
        </div>
    );
}
