"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import EditPageLoader from "@/components/EditPageLoader";
import { fetchCandidateByIdAction, updateCandidateAction } from "@/app/actions/admin/candidates/updateCandidate";
import { fetchCompaniesAction } from "@/app/actions/admin/companies";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";

interface CompanyOption { id: number; name: string; }
interface GroupOption { id: number; name: string; }
type GroupNode = { id: number; name: string; children?: GroupNode[] };

// Add this to your list of roles (replace with your actual roles if needed)
const ROLES = [
  { value: "candidate", display: "Candidate" },
  { value: "admin", display: "Admin" }
];

export default function EditCandidatePage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = Number(params?.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  // Group tree + selections for Register Test Groups
  const [groupTree, setGroupTree] = useState<GroupNode[]>([]);
  const [parentGroups, setParentGroups] = useState<GroupOption[]>([]);
  const [subGroups, setSubGroups] = useState<GroupOption[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string>("");
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);
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
  const [userLogin, setUserLogin] = useState({
    userName: "",
    password: "",
    displayName: "",
    role: "",
    userPhoto: null as File | null,
  });
  const [userPhotoPreview, setUserPhotoPreview] = useState<string | null>(null);
  const userPhotoInputRef = useRef<HTMLInputElement>(null);

  // Fetch candidate details + companies + group tree
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [candRes, compRes, groupRes] = await Promise.all([
          fetchCandidateByIdAction(candidateId),
          fetchCompaniesAction({ top: 100, skip: 0 }),
          apiHandler(endpoints.getCandidateGroupTreeOData, null as any),
        ]);
        if (candRes.error) throw new Error(candRes.errorMessage || candRes.message);
        const c = candRes.data;
        // Map candidate groups (assuming API returns candidateGroups array with ids)
        const candidateGroupIds: number[] = c?.candidateGroupIds || c?.candidateGroups?.map((g: any) => g.candidateGroupId) || [];
        if (compRes.data?.rows) {
          setCompanies(compRes.data.rows.map(r => ({ id: r.id, name: r.companyName })));
        }
        // Normalize group tree response
        const raw = (groupRes?.data as any)?.value ?? groupRes?.data ?? [];
        const pickChildren = (n: any): any[] => {
          const candidates = [n?.children, n?.Children, n?.childrens, n?.ChildNodes, n?.Items, n?.Nodes, n?.Groups, n?.Subgroups];
          for (const c of candidates) if (Array.isArray(c)) return c;
          return [];
        };
        const norm = (nodes: any[]): GroupNode[] =>
          (nodes || [])
            .map((n) => {
              const id = Number(n?.CandidateGroupId ?? n?.candidateGroupId ?? n?.CandidateGroupID ?? n?.GroupId ?? n?.GroupID ?? n?.Id ?? n?.id);
              const name = n?.GroupName ?? n?.CandidateGroupName ?? n?.name ?? n?.Group ?? n?.Name ?? n?.Title ?? n?.Label ?? (Number.isFinite(id) ? `Group ${id}` : "Group");
              if (!Number.isFinite(id)) return null;
              return { id, name: String(name), children: norm(pickChildren(n)) } as GroupNode;
            })
            .filter(Boolean) as GroupNode[];
        const tree = Array.isArray(raw) ? norm(raw) : [];
        setGroupTree(tree);
        setParentGroups(tree.map((g) => ({ id: g.id, name: g.name })));

        // Pre-select based on existing candidateGroupIds
        if (Array.isArray(candidateGroupIds) && candidateGroupIds.length > 0) {
          const childIdSet = new Set<number>();
          const parentOf: Record<number, number> = {};
          const walk = (nodes: GroupNode[], parentId?: number) => {
            for (const n of nodes) {
              if (parentId) parentOf[n.id] = parentId;
              if (n.children && n.children.length) {
                for (const c of n.children) childIdSet.add(c.id);
                walk(n.children, n.id);
              }
            }
          };
          walk(tree);
          // Pick first id; if it’s a child, set its parent; else treat as parent
          const first = Number(candidateGroupIds[0]);
          const parentId = parentOf[first] || first;
          setSelectedParentId(String(parentId));
          // Subgroups: any ids among candidateGroupIds that are children of selected parent
          const parentNode = tree.find((g) => g.id === parentId);
          const validChildIds = new Set<number>((parentNode?.children || []).map((c) => c.id));
          const preSubs = candidateGroupIds.filter((id) => validChildIds.has(Number(id))).map(String);
          setSelectedSubIds(preSubs);
          setSubGroups((parentNode?.children || []).map((c) => ({ id: c.id, name: c.name })));
        }
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
            candidateGroupIds: [],
            isActive: c.isActive === 1 || c.isActive === true,
          });
          // Load userLogin fields from candidate data if available
          setUserLogin({
            userName: c.userName || "",
            password: "",
            displayName: c.displayName || "",
            role: c.role || "",
            userPhoto: null,
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

  // When parent changes, refresh subgroup options and clear selection
  useEffect(() => {
    const parent = groupTree.find((g) => g.id === Number(selectedParentId));
    const children = parent?.children ?? [];
    setSubGroups(children.map((c) => ({ id: c.id, name: c.name })));
    setSelectedSubIds([]);
  }, [selectedParentId, groupTree]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUserLoginChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setUserLogin((prev) => ({
      ...prev,
      [name]: type === "file" ? (e.target as any).files?.[0] : value,
    }));
  };

  // For file input (user photo)
  const handleUserPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUserLogin((prev) => ({
        ...prev,
        userPhoto: e.target.files![0],
      }));
      setUserPhotoPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const validate = () => {
    const chosenGroupIds = selectedSubIds.length > 0 ? selectedSubIds : (selectedParentId ? [selectedParentId] : []);
    if (!form.firstName.trim()) { toast.error("First name required"); return false; }
    if (!form.lastName.trim()) { toast.error("Last name required"); return false; }
    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(form.email)) { toast.error("Valid email required"); return false; }
    if (!form.phoneNumber.trim()) { toast.error("Phone required"); return false; }
    if (!form.companyId) { toast.error("Company required"); return false; }
    if (chosenGroupIds.length === 0) { toast.error("At least one group required"); return false; }
    return true;
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    const chosenGroupIds = selectedSubIds.length > 0 ? selectedSubIds.map(Number) : (selectedParentId ? [Number(selectedParentId)] : []);
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
      candidateGroupIds: chosenGroupIds,
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

  if (loading) return <EditPageLoader message="Loading candidate..." />;

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
  <div className="w-[85%] mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-6 relative">
          {saving && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-lg">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="absolute -inset-3 bg-gradient-to-r from-indigo-200 via-blue-200 to-indigo-200 opacity-30 blur-xl animate-pulse rounded-full" />
                  <Save className="relative w-8 h-8 text-indigo-600 animate-pulse" />
                </div>
                <p className="text-xs font-medium text-gray-600">Saving...</p>
              </div>
            </div>
          )}
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
          {/* Register Test Groups moved to dedicated section below */}
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

          {/* --- User Login Section --- */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">User Login</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  User Name
                </label>
                <input
                  type="text"
                  name="userName"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Enter user name"
                  value={userLogin.userName}
                  onChange={handleUserLoginChange}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Enter password"
                  value={userLogin.password}
                  onChange={handleUserLoginChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  name="displayName"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Enter display name"
                  value={userLogin.displayName}
                  onChange={handleUserLoginChange}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={userLogin.role}
                  onChange={handleUserLoginChange}
                >
                  <option value="">Select role</option>
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.display}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                User Photo
              </label>
              <input
                type="file"
                name="userPhoto"
                accept="image/*"
                ref={userPhotoInputRef}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                onChange={handleUserPhotoChange}
              />
              {userPhotoPreview && (
                <div className="mt-2">
                  <img
                    src={userPhotoPreview}
                    alt="User Photo Preview"
                    className="h-16 w-16 object-contain border rounded"
                  />
                </div>
              )}
            </div>
          </div>
          {/* --- End User Login Section --- */}

          {/* --- Register Test Groups Section --- */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Register Test Groups</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Group</label>
                <select
                  aria-label="Candidate Group"
                  name="parentGroup"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                >
                  <option value="">Select group</option>
                  {parentGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subgroup(s)</label>
                <select
                  multiple
                  aria-label="Candidate Subgroup"
                  name="subGroup"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-32"
                  value={selectedSubIds}
                  disabled={!selectedParentId}
                  onChange={(e) => {
                    const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
                    setSelectedSubIds(opts);
                  }}
                >
                  {selectedParentId ? null : (
                    <option value="" disabled>
                      Select a group first
                    </option>
                  )}
                  {subGroups.map((sg) => (
                    <option key={sg.id} value={sg.id}>
                      {sg.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {/* --- End Register Test Groups Section --- */}
        </div>
      </div>
    </div>
  );
}
