"use client";

import { useEffect, useState, useRef, useLayoutEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Users } from "lucide-react";
import EditPageLoader from "@/components/EditPageLoader";
import { fetchCandidateByIdAction, updateCandidateAction } from "@/app/actions/admin/candidates/updateCandidate";
import { fetchCompaniesAction } from "@/app/actions/admin/companies";
import { fetchRolesAction } from "@/app/actions/admin/roles";

import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import { useUser } from "@/contexts/UserContext";
import Toast from "@/components/Toast";
import ConfirmationModal from "@/components/ConfirmationModal";
import { uploadToLocal } from "@/utils/uploadToLocal";
import PasswordInput from "@/components/PasswordInput";
import { validatePassword } from "@/utils/passwordValidation";

interface CompanyOption { id: number; name: string; }
type GroupNode = { id: number; name: string; children?: GroupNode[] };

// Sample lists for State and Country to match 'New' page UX
const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];
const COUNTRIES = [
  "India", "United States", "Canada", "United Kingdom", "Australia"
];

export default function EditCandidatePage() {
  const params = useParams();
  const router = useRouter();
  const maskedId = params?.id as string;
  const candidateId = parseInt(maskedId, 10);
  const { username } = useUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
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
    isHandicapped: false,
    userLogin: [{
      userName: "",
      password: "",
      displayName: "",
      role: "",
      userPhoto: null as string | null,
      hasPassword: false,
    }]
  });
  const [userLogin, setUserLogin] = useState({
    userName: "",
    password: "",
    displayName: "",
    role: "",
    userPhoto: null as string | null,
    hasPassword: false,
  });
  const [userPhotoPreview, setUserPhotoPreview] = useState<string | null>(null);
  const userPhotoInputRef = useRef<HTMLInputElement>(null);
  // Preserve scroll position for tree container
  const treeScrollRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);
  const onTreeScroll = () => {
    if (treeScrollRef.current) lastScrollTopRef.current = treeScrollRef.current.scrollTop;
  };
  const [toast, setToast] = useState<{ message: string; type: any } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Password validation state
  const [passwordValid, setPasswordValid] = useState(true); // Default to true for existing users
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Match 'New' page input styles
  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition";
  const selectCls = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition";
  const textareaCls = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition";

  // Fetch candidate details + companies + group tree
  useEffect(() => {
    if (!candidateId) {
      setToast({ message: "Invalid candidate ID", type: 'error' });
      setLoading(false);
      router.push("/admin/candidates");
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const [candRes, compRes, rolesRes, groupRes] = await Promise.all([
          fetchCandidateByIdAction(candidateId),
          fetchCompaniesAction({ top: 100, skip: 0 }),
          fetchRolesAction({ top: 200, skip: 0 }),
          apiHandler(endpoints.getCandidateGroupTreeOData, null as any),
        ]);
        if (candRes.error) throw new Error(candRes.errorMessage || candRes.message);
        const c = candRes.data;
        // Map candidate groups (assuming API returns candidateGroups array with ids)
        const candidateGroupIds: number[] = (c?.candidateGroupIds || c?.candidateGroups?.map((g: any) => g.candidateGroupId) || []).map((x: any) => Number(x)).filter((n: any) => Number.isFinite(n));
        if (compRes.data?.rows) {
          setCompanies(compRes.data.rows.map(r => ({ id: r.id, name: r.companyName })));
        }
        if (rolesRes.data?.rows) {
          setRoles(rolesRes.data.rows.map((r: any) => ({ id: r.name, name: r.name })));
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
          // Extract userLogin data from API response
          const userLoginData = c.userLogin && c.userLogin[0] ? c.userLogin[0] : {};
          const hasPassword = userLoginData.hasPassword || false;

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
            isHandicapped: c.isHandicapped === 1 || c.isHandicapped === true,
            userLogin: [{
              userName: userLoginData.userName || c.userName || "",
              password: hasPassword ? "****" : "",
              displayName: userLoginData.displayName || c.displayName || "",
              role: userLoginData.role || c.role || "",
              userPhoto: userLoginData.userPhoto || c.userPhoto || null,
              hasPassword: hasPassword,
            }]
          });
          // Load userLogin fields from candidate data if available
          setUserLogin({
            userName: userLoginData.userName || c.userName || "",
            password: hasPassword ? "****" : "",
            displayName: userLoginData.displayName || c.displayName || "",
            role: userLoginData.role || c.role || "",
            userPhoto: userLoginData.userPhoto || c.userPhoto || null,
            hasPassword: hasPassword,
          });
          // Set preview if existing photo exists
          if (userLoginData.userPhoto || c.userPhoto) {
            setUserPhotoPreview(userLoginData.userPhoto || c.userPhoto);
          }
        }
      } catch (e: any) {
        setToast({ message: e.message || "Failed to load candidate", type: "error" });
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

  // Restore scroll position on rerenders that change the tree/selection
  useLayoutEffect(() => {
    const el = treeScrollRef.current;
    if (el) {
      el.scrollTop = lastScrollTopRef.current;
    }
  }, [selectedGroupIds, expandedMap, groupTree]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUserLoginChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    index: number = 0
  ) => {
    const { name, value, type } = e.target;
    const fileValue = type === "file" ? (e.target as any).files?.[0] : value;

    // Update both userLogin state and form.userLogin array
    setUserLogin((prev) => ({
      ...prev,
      [name]: fileValue,
    }));

    setForm((prev) => ({
      ...prev,
      userLogin: prev.userLogin.map((u, i) =>
        i === index ? { ...u, [name]: fileValue } : u
      ),
    }));
  };

  // For file input (user photo)
  const handleUserPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number = 0) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      try {
        // Delete old image if it exists and is a profile image
        if (userLogin.userPhoto && userLogin.userPhoto.includes('/uploads/profiles/')) {
          let relativePath = userLogin.userPhoto;
          // If userPhoto is a full URL, extract the path
          if (relativePath.startsWith('http')) {
            try {
              const urlObj = new URL(relativePath);
              relativePath = urlObj.pathname;
            } catch { }
          }
          await fetch(`/api/uploads?path=${relativePath}`, { method: 'DELETE' });
        }

        // Upload the file and get the public URL
        const { url } = await uploadToLocal(file);

        setUserLogin((prev) => ({
          ...prev,
          userPhoto: url,
        }));

        setForm((prev) => ({
          ...prev,
          userLogin: prev.userLogin.map((u, i) =>
            i === index ? { ...u, userPhoto: url } : u
          ),
        }));

        setUserPhotoPreview(url);
      } catch (error) {
        console.error('File upload failed:', error);
        setToast({ message: 'Photo upload failed. Please try again.', type: 'error' });
      }
    }
  };

  // Helper function to clear password (keep existing)
  const handleKeepExistingPassword = () => {
    const newPassword = "****";
    setUserLogin(prev => ({ ...prev, password: newPassword }));
    setForm(prev => ({
      ...prev,
      userLogin: prev.userLogin.map((u, i) =>
        i === 0 ? { ...u, password: newPassword } : u
      ),
    }));
  };

  // Password handling functions for PasswordInput component
  const handlePasswordChange = useCallback((password: string) => {
    setUserLogin(prev => ({ ...prev, password }));
    setForm(prev => ({
      ...prev,
      userLogin: prev.userLogin.map((u, i) =>
        i === 0 ? { ...u, password } : u
      )
    }));
  }, []);

  const handlePasswordValidationChange = useCallback((isValid: boolean, errors: string[]) => {
    setPasswordValid(isValid);
    setPasswordErrors(errors);
  }, []);

  const validate = () => {
    const chosenGroupIds = selectedGroupIds;
    if (!form.firstName.trim()) { setToast({ message: "First name required", type: "error" }); return false; }
    if (!form.lastName.trim()) { setToast({ message: "Last name required", type: "error" }); return false; }
    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(form.email)) { setToast({ message: "Valid email required", type: "error" }); return false; }
    if (!form.phoneNumber.trim()) { setToast({ message: "Phone required", type: "error" }); return false; }
    if (!form.companyId) { setToast({ message: "Company required", type: "error" }); return false; }
    if (chosenGroupIds.length === 0) { setToast({ message: "At least one group required", type: "error" }); return false; }

    // User Login validation
    if (!userLogin.userName.trim()) { setToast({ message: "User name is required", type: "error" }); return false; }

    // Strong password validation
    // Only validate password if hasPassword is false (new user) or if password is being changed (not ****)
    if (!userLogin.hasPassword && !userLogin.password.trim()) {
      setToast({ message: "Password is required for new user", type: "error" });
      return false;
    }

    // If password is being set or changed, validate against strong password policy
    if (userLogin.password && userLogin.password.trim() && userLogin.password !== "****") {
      const passwordValidation = validatePassword(userLogin.password);
      if (!passwordValidation.isValid) {
        setToast({ message: passwordValidation.errors[0] || "Password does not meet requirements", type: "error" });
        return false;
      }
    }
    if (!userLogin.displayName.trim()) { setToast({ message: "Display name is required", type: "error" }); return false; }
    if (!userLogin.role.trim()) { setToast({ message: "Role is required", type: "error" }); return false; }

    return true;
  };

  const submit = async () => {
    if (!candidateId) {
      setToast({ message: "Invalid candidate ID", type: 'error' });
      return;
    }
    if (!validate()) return;
    setSaving(true);
    const chosenGroupIds = selectedGroupIds;
    // Prepare user login data - only include password if it's being updated
    const userLoginPayload: any = {
      userName: userLogin.userName.trim(),
      displayName: userLogin.displayName.trim(),
      role: userLogin.role.trim(),
      userPhoto: userLogin.userPhoto,
      isActive: form.isActive ? 1 : 0, // Pass isActive to user payload
    };

    // Only include password if it's not the placeholder and user is updating it
    if (!userLogin.hasPassword || (userLogin.password && userLogin.password !== "****")) {
      userLoginPayload.password = userLogin.password;
    }

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
      isHandicapped: form.isHandicapped ? 1 : 0,
      companyId: Number(form.companyId),
      candidateGroupIds: chosenGroupIds,
      modifiedBy: username || "system",
      userLogin: [userLoginPayload],
    };
    const res = await updateCandidateAction(payload);
    if (!res.error) {
      setToast(null);
      setShowSuccess(true);
    } else {
      setToast({ message: res.errorMessage || "Update failed", type: "error" });
    }
    setSaving(false);
  };

  if (loading) return <EditPageLoader message="Loading candidate..." />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="w-[85%] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/candidates"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-indigo-600" />
                </div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Edit Candidate
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/candidates"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </Link>
              <div className="flex items-center gap-3">
                <button
                  onClick={submit}
                  disabled={saving}
                  className={`px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm transition-colors ${saving
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                >
                  {saving ? "Updating..." : "Update Candidate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-[85%] mx-auto px-6 py-8">
        <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 relative">
          <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-6" autoComplete="off">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">First Name <span className="text-red-500">*</span></label>
                <input name="firstName" placeholder="First name" aria-label="First name" value={form.firstName} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Last Name <span className="text-red-500">*</span></label>
                <input name="lastName" placeholder="Last name" aria-label="Last name" value={form.lastName} onChange={handleChange} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Email <span className="text-red-500">*</span></label>
                <input type="email" name="email" placeholder="Email" aria-label="Email" value={form.email} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Phone Number <span className="text-red-500">*</span></label>
                <input name="phoneNumber" placeholder="Phone" aria-label="Phone" value={form.phoneNumber} onChange={handleChange} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Cell Phone</label>
                <input name="cellPhone" placeholder="Cell Phone" aria-label="Cell Phone" value={form.cellPhone} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Company</label>
                <select name="companyId" aria-label="Company" value={form.companyId} onChange={handleChange} className={selectCls}>
                  <option value="">Select company</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            {/* Active checkbox row to match 'New' */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 pt-6">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-800">Active</label>
              </div>
              <div className="pt-6">
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Specially Abled
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      id="handicapped-no-edit"
                      name="isHandicapped"
                      type="radio"
                      checked={!form.isHandicapped}
                      onChange={() => setForm(prev => ({ ...prev, isHandicapped: false }))}
                      className="h-4 w-4 text-indigo-600 border-gray-300"
                    />
                    <label htmlFor="handicapped-no-edit" className="text-sm text-gray-800">No</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="handicapped-yes-edit"
                      name="isHandicapped"
                      type="radio"
                      checked={form.isHandicapped}
                      onChange={() => setForm(prev => ({ ...prev, isHandicapped: true }))}
                      className="h-4 w-4 text-indigo-600 border-gray-300"
                    />
                    <label htmlFor="handicapped-yes-edit" className="text-sm text-gray-800">Yes</label>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Address</label>
                <textarea name="address" placeholder="Enter address" aria-label="Address" value={form.address} onChange={handleChange} className={textareaCls} rows={2} />
              </div>
              <div></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">City</label>
                <input name="city" placeholder="City" aria-label="City" value={form.city} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">State</label>
                <select aria-label="State" name="state" className={selectCls} value={form.state} onChange={handleChange}>
                  <option value="">Select state</option>
                  {STATES.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Postal Code</label>
                <input name="postalCode" placeholder="Postal Code" aria-label="Postal Code" value={form.postalCode} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Country</label>
                <select aria-label="Country" name="country" className={selectCls} value={form.country} onChange={handleChange}>
                  <option value="">Select country</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Notes</label>
              <textarea name="notes" placeholder="Additional notes (optional)" aria-label="Notes" value={form.notes} onChange={handleChange} className={textareaCls} rows={3} />
            </div>

            {/* --- User Login Section --- */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">User Login</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">User Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="userName"
                    className={inputCls}
                    placeholder="Enter user name"
                    value={userLogin.userName}
                    onChange={handleUserLoginChange}
                  />
                </div>
                <div>
                  {userLogin.hasPassword ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">
                        Password <span className="text-xs text-gray-500">(Leave blank to keep current)</span>
                      </label>
                      <PasswordInput
                        value={userLogin.password === "****" ? "" : userLogin.password}
                        onChange={handlePasswordChange}
                        onValidationChange={handlePasswordValidationChange}
                        placeholder="Enter new password to change existing one"
                        label=""
                        required={false}
                        showRequirements={Boolean(userLogin.password && userLogin.password !== "****")}
                        showStrengthIndicator={Boolean(userLogin.password && userLogin.password !== "****")}
                        className="mt-0"
                      />
                      {userLogin.password === "****" && (
                        <p className="text-xs text-gray-500 mt-1">
                          User has an existing password. Enter a new password to change it, or leave blank to preserve the existing password.
                        </p>
                      )}
                    </div>
                  ) : (
                    <PasswordInput
                      value={userLogin.password}
                      onChange={handlePasswordChange}
                      onValidationChange={handlePasswordValidationChange}
                      placeholder="Enter a strong password"
                      label="Password"
                      required={true}
                      showRequirements={true}
                      showStrengthIndicator={true}
                      className="mt-0"
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Display Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="displayName"
                    className={inputCls}
                    placeholder="Enter display name"
                    value={userLogin.displayName}
                    onChange={handleUserLoginChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Role <span className="text-red-500">*</span></label>
                  <select
                    name="role"
                    className={selectCls}
                    value={userLogin.role}
                    onChange={handleUserLoginChange}
                  >
                    <option value="">Select role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-800 mb-1">User Photo</label>
                <input
                  type="file"
                  name="userPhoto"
                  accept="image/*"
                  ref={userPhotoInputRef}
                  className={inputCls}
                  onChange={(e) => handleUserPhotoChange(e, 0)}
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Candidate Groups</h2>
              <div className="border border-gray-200 rounded-lg bg-white">
                <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50 rounded-t-lg">
                  <div className="text-sm text-gray-700">Select one or more groups to register</div>
                  <div className="text-xs text-gray-500">Selected: {selectedGroupIds.length}</div>
                </div>
                <div ref={treeScrollRef} onScroll={onTreeScroll} className="max-h-72 overflow-auto py-2">
                  {groupTree.length === 0 ? (
                    <div className="px-4 py-8 text-sm text-gray-500">No groups available</div>
                  ) : (
                    groupTree.map((n) => <TreeNode key={n.id} node={n} level={0} />)
                  )}
                </div>
              </div>
            </div>
            {/* --- End Register Test Groups Section --- */}
          </form>
        </div>
      </div>
      <div className="fixed top-4 right-4 z-50 space-y-2">{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</div>
      <ConfirmationModal
        isOpen={showSuccess}
        onConfirm={() => { setShowSuccess(false); router.push('/admin/candidates'); }}
        onCancel={() => { setShowSuccess(false); router.push('/admin/candidates'); }}
        title="Candidate Updated Successfully!"
        message="Candidate data saved."
        confirmText="Go to Candidates"
        cancelText=""
        variant="success"
        className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
      />
    </div>
  );
}
