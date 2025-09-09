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
import { useUser } from "@/contexts/UserContext";

interface CompanyOption { id: number; name: string; }
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
  const { username } = useUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  // Group tree + hierarchical selection state
  const [groupTree, setGroupTree] = useState<GroupNode[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});
  const [idToNode, setIdToNode] = useState<Record<number, GroupNode>>({});
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
  const candidateGroupIds: number[] = (c?.candidateGroupIds || c?.candidateGroups?.map((g: any) => g.candidateGroupId) || []).map((x: any) => Number(x)).filter((n: any) => Number.isFinite(n));
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
        const map: Record<number, GroupNode> = {};
        const walkMap = (nodes: GroupNode[]) => {
          for (const n of nodes) {
            map[n.id] = n;
            if (n.children?.length) walkMap(n.children);
          }
        };
        walkMap(tree);
        setIdToNode(map);

        // Pre-select exactly the candidate's existing groups
        if (Array.isArray(candidateGroupIds) && candidateGroupIds.length > 0) {
          setSelectedGroupIds(candidateGroupIds);
          // Expand roots by default and any ancestors of selected ids
          const parentOf: Record<number, number | undefined> = {};
          const walk = (nodes: GroupNode[], parentId?: number) => {
            for (const n of nodes) {
              parentOf[n.id] = parentId;
              if (n.children && n.children.length) walk(n.children, n.id);
            }
          };
          walk(tree);
          const expandSet = new Set<number>();
          for (const id of candidateGroupIds) {
            let cur = parentOf[id];
            while (cur) { expandSet.add(cur); cur = parentOf[cur]; }
          }
          setExpandedMap((m) => ({ ...m, ...Object.fromEntries(Array.from(expandSet).map((id) => [id, true])) }));
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

  // Helpers for hierarchical tree selection
  const collectDescendants = (node: GroupNode): number[] => {
    const ids: number[] = [];
    (node.children || []).forEach((c) => {
      ids.push(c.id, ...collectDescendants(c));
    });
    return ids;
  };
  const isNodeFullySelected = (node: GroupNode, list = selectedGroupIds) => {
    const allIds = [node.id, ...collectDescendants(node)];
    return allIds.every((id) => list.includes(id));
  };
  const isNodeIndeterminate = (node: GroupNode) => {
    const desc = collectDescendants(node);
    const anySelected = selectedGroupIds.includes(node.id) || desc.some((id) => selectedGroupIds.includes(id));
    return anySelected && !isNodeFullySelected(node);
  };
  const normalizeSelection = (list: number[]) => {
    const set = new Set(list);
    const visit = (nodes: GroupNode[]) => {
      for (const n of nodes) {
        if (set.has(n.id) && !isNodeFullySelected(n, Array.from(set))) set.delete(n.id);
        if (n.children?.length) visit(n.children);
      }
    };
    visit(groupTree);
    return Array.from(set);
  };
  const isChecked = (id: number) => {
    const node = idToNode[id];
    return node ? isNodeFullySelected(node) : selectedGroupIds.includes(id);
  };
  const toggleSelectNode = (node: GroupNode) => {
    const allIds = [node.id, ...collectDescendants(node)];
    setSelectedGroupIds((prev) => {
      const currentlyAllSelected = isNodeFullySelected(node, prev);
      const next = currentlyAllSelected
        ? prev.filter((id) => !allIds.includes(id))
        : Array.from(new Set([...prev, ...allIds]));
      return normalizeSelection(next);
    });
  };

  const toggleExpand = (id: number) =>
    setExpandedMap((m) => ({ ...m, [id]: !m[id] }));

  const TreeNode = ({ node, level }: { node: GroupNode; level: number }) => {
    const hasChildren = (node.children || []).length > 0;
    const expanded = expandedMap[node.id] ?? level < 1; // expand roots by default
    const cbRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
      if (cbRef.current) cbRef.current.indeterminate = isNodeIndeterminate(node);
    }, [selectedGroupIds, node]);
    return (
      <div>
        <div className="flex items-center gap-2 py-1" style={{ paddingLeft: level * 16 }}>
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpand(node.id)}
              className="h-5 w-5 flex items-center justify-center rounded hover:bg-gray-100 border border-gray-200 text-xs"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? "-" : "+"}
            </button>
          ) : (
            <span className="h-5 w-5" />
          )}
          <input
            type="checkbox"
            ref={cbRef}
            checked={isChecked(node.id)}
            onChange={() => toggleSelectNode(node)}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-800">{node.name}</span>
        </div>
        {hasChildren && expanded && (
          <div>
            {node.children!.map((c) => (
              <TreeNode key={c.id} node={c} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

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
  const chosenGroupIds = selectedGroupIds;
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
  const chosenGroupIds = selectedGroupIds;
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
      modifiedBy: username || "system",
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
            <div className="border border-gray-200 rounded-lg bg-white">
              <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50 rounded-t-lg">
                <div className="text-sm text-gray-700">Select one or more groups to register</div>
                <div className="text-xs text-gray-500">Selected: {selectedGroupIds.length}</div>
              </div>
              <div className="max-h-72 overflow-auto py-2">
                {groupTree.length === 0 ? (
                  <div className="px-4 py-8 text-sm text-gray-500">No groups available</div>
                ) : (
                  groupTree.map((n) => <TreeNode key={n.id} node={n} level={0} />)
                )}
              </div>
            </div>
          </div>
          {/* --- End Register Test Groups Section --- */}
        </div>
      </div>
    </div>
  );
}
