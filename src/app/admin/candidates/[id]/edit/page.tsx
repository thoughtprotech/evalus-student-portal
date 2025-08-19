"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { fetchCandidateByIdAction, updateCandidateAction } from "@/app/actions/admin/candidates/updateCandidate";
import { fetchCompaniesAction } from "@/app/actions/admin/companies";
import { fetchCandidatesAction } from "@/app/actions/admin/candidates";

interface CompanyOption { id: number; name: string; }
interface GroupOption { id: number; name: string; }

export default function EditCandidatePage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = Number(params?.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    cellPhone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    notes: "",
    companyId: "",
    candidateGroupIds: [] as string[],
    isActive: true,
  });

  // Fetch candidate details + companies + groups
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [candRes, compRes] = await Promise.all([
          fetchCandidateByIdAction(candidateId),
          fetchCompaniesAction({ top: 100, skip: 0 }),
        ]);
        if (candRes.error) throw new Error(candRes.errorMessage || candRes.message);
        const c = candRes.data;
        // Map candidate groups (assuming API returns candidateGroups array with ids)
        const candidateGroupIds: number[] = c?.candidateGroupIds || c?.candidateGroups?.map((g: any) => g.candidateGroupId) || [];
        if (compRes.data?.rows) {
          setCompanies(compRes.data.rows.map(r => ({ id: r.id, name: r.companyName })));
        }
        // TEMP: derive groups from all candidates until dedicated endpoint
        const groupsSet = new Map<number, string>();
        const allCand = await fetchCandidatesAction({ top: 200, skip: 0 });
        if (allCand.data?.rows) {
          allCand.data.rows.forEach(row => {
            if ((row as any).candidateGroup && !(row as any).candidateGroupId) return; // skip if no id
          });
        }
        // Placeholder groups (replace with real endpoint later)
        setGroups(candidateGroupIds.map(id => ({ id, name: `Group ${id}` })));
        if (mounted) {
          setForm({
            firstName: c.firstName || "",
            lastName: c.lastName || "",
            email: c.email || "",
            phoneNumber: c.phoneNumber || "",
            cellPhone: c.cellPhone || "",
            address: c.address || "",
            city: c.city || "",
            state: c.state || "",
            postalCode: c.postalCode || "",
            country: c.country || "",
            notes: c.notes || "",
            companyId: c.companyId ? String(c.companyId) : "",
            candidateGroupIds: candidateGroupIds.map(String),
            isActive: c.isActive === 1 || c.isActive === true,
          });
        }
      } catch (e: any) {
        toast.error(e.message || "Failed to load candidate");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [candidateId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.firstName.trim()) { toast.error("First name required"); return false; }
    if (!form.lastName.trim()) { toast.error("Last name required"); return false; }
    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(form.email)) { toast.error("Valid email required"); return false; }
    if (!form.phoneNumber.trim()) { toast.error("Phone required"); return false; }
    if (!form.companyId) { toast.error("Company required"); return false; }
    if (form.candidateGroupIds.length === 0) { toast.error("At least one group required"); return false; }
    return true;
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = {
      candidateId,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      cellPhone: form.cellPhone.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      postalCode: form.postalCode.trim(),
      country: form.country.trim(),
      notes: form.notes.trim(),
      isActive: form.isActive ? 1 : 0,
      companyId: Number(form.companyId),
      candidateGroupIds: form.candidateGroupIds.map(Number),
    };
    const res = await updateCandidateAction(payload);
    if (!res.error) {
      toast.success("Candidate updated");
      router.push("/admin/candidates");
    } else {
      toast.error(res.errorMessage || "Update failed");
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-600 flex items-center gap-2"><Loader2 className="animate-spin w-4 h-4"/> Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="w-[85%] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/candidates" className="text-gray-500 hover:text-gray-700"><ArrowLeft className="w-5 h-5"/></Link>
            <h1 className="text-2xl font-semibold text-gray-900">Edit Candidate</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50">Cancel</button>
            <button onClick={submit} disabled={saving} className={`px-4 py-2 text-sm rounded-lg text-white font-medium ${saving?"bg-gray-400":"bg-indigo-600 hover:bg-indigo-700"}`}>{saving?"Saving...":"Save Changes"}</button>
          </div>
        </div>
      </div>
      <div className="w-[85%] mx-auto px-6 py-8 max-w-2xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
              <input name="firstName" placeholder="First name" aria-label="First name" value={form.firstName} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Last Name *</label>
              <input name="lastName" placeholder="Last name" aria-label="Last name" value={form.lastName} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
              <input type="email" name="email" placeholder="Email" aria-label="Email" value={form.email} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
              <input name="phoneNumber" placeholder="Phone" aria-label="Phone" value={form.phoneNumber} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cell Phone</label>
              <input name="cellPhone" placeholder="Cell Phone" aria-label="Cell Phone" value={form.cellPhone} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Company *</label>
              <select name="companyId" aria-label="Company" value={form.companyId} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select company</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Candidate Groups *</label>
            <select multiple name="candidateGroupIds" aria-label="Candidate Groups" value={form.candidateGroupIds} onChange={(e)=>{
              const opts = Array.from(e.target.selectedOptions).map(o=>o.value); setForm(prev=>({...prev,candidateGroupIds:opts}));
            }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-32">
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
              <textarea name="address" placeholder="Address" aria-label="Address" value={form.address} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 pt-4">
                <input id="isActive" type="checkbox" checked={form.isActive} onChange={(e)=>setForm(prev=>({...prev,isActive:e.target.checked}))} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
              <input name="city" placeholder="City" aria-label="City" value={form.city} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
              <input name="state" placeholder="State" aria-label="State" value={form.state} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Postal Code</label>
              <input name="postalCode" placeholder="Postal Code" aria-label="Postal Code" value={form.postalCode} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
              <input name="country" placeholder="Country" aria-label="Country" value={form.country} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea name="notes" placeholder="Notes" aria-label="Notes" value={form.notes} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} />
          </div>
        </div>
      </div>
    </div>
  );
}
