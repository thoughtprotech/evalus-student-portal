"use client";

import { useState, ChangeEvent, FormEvent, useEffect, useRef, useLayoutEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ConfirmationModal from "@/components/ConfirmationModal";
import { ArrowLeft, UserPlus2 } from "lucide-react";
import { createCandidateAction } from "@/app/actions/dashboard/candidates/createCandidate";
import { fetchCompaniesAction } from "@/app/actions/admin/companies";
import { fetchCandidatesAction } from "@/app/actions/admin/candidates";
import { fetchRolesAction } from "@/app/actions/admin/roles";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import { useUser } from "@/contexts/UserContext";
import { uploadToLocal } from "@/utils/uploadToLocal";

// Indian States (sample, add more as needed)
const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

// Sample countries and candidate groups (replace/fetch as needed)
const COUNTRIES = [
  "India", "United States", "Canada", "United Kingdom", "Australia"
];
const CANDIDATE_GROUPS = [
  "General", "OBC", "SC", "ST", "EWS"
];

// Add this to your list of roles (replace with your actual roles if needed)
const ROLES1 = [
  { value: "candidate", display: "Candidate123" },
  { value: "admin", display: "Admin123" }
];

export default function AddCandidatePage() {
  const { username } = useUser();
  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition";
  const selectCls = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition";
  const textareaCls = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition";
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
    companyId: "", // store as string in form, convert later
    candidateGroupIds: [] as string[], // multi-select values as strings
    isActive: true,
    isHandicapped: false,
    userLogin: [
      {
        userName: "",
        password: "",
        displayName: "",
        role: "",
        userPhoto: null as string | null,
      }
    ]
  });
  const [userLogin, setUserLogin] = useState({
    userName: "",
    password: "",
    displayName: "",
    role: "",
    userPhoto: null as string | null,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [companies, setCompanies] = useState<{ id: number; name: string }[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  // Candidate Groups hierarchy (parent -> child)
  type GroupNode = { id: number; name: string; children?: GroupNode[] };
  const [groupTree, setGroupTree] = useState<GroupNode[]>([]);
  // Hierarchical selection state
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});
  const [idToNode, setIdToNode] = useState<Record<number, GroupNode>>({});
  const [userPhotoPreview, setUserPhotoPreview] = useState<string | null>(null);
  const userPhotoInputRef = useRef<HTMLInputElement>(null);
  // Separate state for handicapped to avoid any interference
  const [isHandicappedState, setIsHandicappedState] = useState(false);
  // Preserve scroll position for tree container
  const treeScrollRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);
  const onTreeScroll = () => {
    if (treeScrollRef.current) lastScrollTopRef.current = treeScrollRef.current.scrollTop;
  };
  const router = useRouter();

  /*
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  */

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    index?: number // optional index for userLogin
  ) => {
    const { name, value } = e.target;

    setForm((prev) => {
      // If we are updating a userLogin field
      if (typeof index === "number") {
        return {
          ...prev,
          userLogin: prev.userLogin.map((u, i) =>
            i === index ? { ...u, [name]: value } : u
          ),
        };
      }

      // Otherwise update top-level form field
      return { ...prev, [name]: value };
    });
  };

  /*
    const handleUserLoginChange = (
      e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      const { name, value, type } = e.target;
      setUserLogin((prev) => ({
        ...prev,
        [name]: type === "file" ? (e.target as any).files?.[0] : value,
      }));
    };
  
    // Restore scroll position on rerenders that change the tree/selection
    useLayoutEffect(() => {
      const el = treeScrollRef.current;
      if (el) {
        el.scrollTop = lastScrollTopRef.current;
      }
    }, [selectedGroupIds, expandedMap, groupTree]);
  
    */

  const handleUserLoginChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    index: number
  ) => {
    const { name, value, type } = e.target;

    setForm((prev) => ({
      ...prev,
      userLogin: prev.userLogin.map((u, i) =>
        i === index
          ? {
            ...u,
            [name]:
              type === "file"
                ? (e.target as HTMLInputElement).files?.[0] ?? null
                : value,
          }
          : u
      ),
    }));
  };


  /*
    // For file input (user photo)
    const handleUserPhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setUserLogin((prev) => ({
          ...prev,
          userPhoto: e.target.files![0],
        }));
        setUserPhotoPreview(URL.createObjectURL(e.target.files[0]));
      }
    };
    */

  const handleUserPhotoChange = async (e: ChangeEvent<HTMLInputElement>, index: number) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      try {
        // Upload the file and get the public URL
        const { url } = await uploadToLocal(file);

        // update userLogin[index].userPhoto with the URL
        setForm((prev) => ({
          ...prev,
          userLogin: prev.userLogin.map((u, i) =>
            i === index ? { ...u, userPhoto: url } : u
          ),
        }));

        // Set preview using the uploaded URL
        setUserPhotoPreview(url);
      } catch (error) {
        console.error('File upload failed:', error);
        toast.error('Photo upload failed. Please try again.');
      }
    }
  };



  const validate = () => {
    if (!form.firstName.trim()) {
      toast.error("First name is required");
      return false;
    }
    if (!form.lastName.trim()) {
      toast.error("Last name is required");
      return false;
    }
    if (
      !form.email.trim() ||
      !/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(form.email)
    ) {
      toast.error("Valid email is required");
      return false;
    }
    if (!form.phoneNumber.trim()) {
      toast.error("Phone number is required");
      return false;
    }

    // User Login validation
    if (!form.userLogin[0].userName.trim()) {
      toast.error("User name is required");
      return false;
    }
    if (!form.userLogin[0].password.trim()) {
      toast.error("Password is required");
      return false;
    }
    if (!form.userLogin[0].displayName.trim()) {
      toast.error("Display name is required");
      return false;
    }
    if (!form.userLogin[0].role.trim()) {
      toast.error("Role is required");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (isSaving) return;
    if (!validate()) return;

    setIsSaving(true);

    // Use selected group ids from the hierarchical selector
    const chosenGroupIds = selectedGroupIds;

    // Prepare payload (adjust as per your API)
    const payload = {
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
      companyId: form.companyId ? Number(form.companyId) : 0,
      candidateGroupIds: chosenGroupIds,
      createdBy: username || "system",
      modifiedBy: username || "system",
      isActive: form.isActive ? 1 : 0,
      isHandicapped: form.isHandicapped ? 1 : 0,
      userLogin: [
        {
          userName: form.userLogin[0].userName,
          password: form.userLogin[0].password,
          displayName: form.userLogin[0].displayName,
          role: form.userLogin[0].role,
          userPhoto: form.userLogin[0].userPhoto,
        }
      ]
    };

    const res = await createCandidateAction(payload);
    const { status, error, errorMessage } = res;
    const isSuccess = status >= 200 && status < 300 && !error;

    if (isSuccess) {
      setShowSuccessModal(true);
    } else {
      toast.error(errorMessage || "Failed to create candidate");
    }
    setIsSaving(false);
  };

  const handleSaveAndNew = async () => {
    if (isSaving) return;
    if (!validate()) return;

    setIsSaving(true);

    const chosenGroupIds = selectedGroupIds;

    // Debug: Log form state before creating payload
    console.log('Form state before payload creation:', {
      isHandicapped: form.isHandicapped,
      isHandicappedState: isHandicappedState,
      isActive: form.isActive,
      isHandicappedValue: isHandicappedState ? 1 : 0
    });

    const payload = {
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
      companyId: form.companyId ? Number(form.companyId) : 0,
      candidateGroupIds: chosenGroupIds,
      createdBy: username || "system",
      modifiedBy: username || "system",
      isActive: form.isActive ? 1 : 0,
      isHandicapped: isHandicappedState ? 1 : 0,
      userLogin: [
        {
          userName: form.userLogin[0].userName,
          password: form.userLogin[0].password,
          displayName: form.userLogin[0].displayName,
          role: form.userLogin[0].role,
          userPhoto: form.userLogin[0].userPhoto,
        }
      ]
    };

    const res = await createCandidateAction(payload);
    const { status, error, errorMessage } = res;
    const isSuccess = status >= 200 && status < 300 && !error;

    if (isSuccess) {
      setForm({
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
        candidateGroupIds: [],
        isActive: true,
        isHandicapped: false,
        userLogin: [
          {
            userName: "",
            password: "",
            displayName: "",
            role: "",
            userPhoto: null as string | null,
          }
        ]
      });
      // Reset selected groups and handicapped state
      setSelectedGroupIds([]);
      setIsHandicappedState(false);
    } else {
      toast.error(errorMessage || "Failed to create candidate");
    }
    setIsSaving(false);
  };

  // Load companies, roles and candidate group hierarchy
  useEffect(() => {
    (async () => {
      try {
        const [compRes, rolesRes, groupRes] = await Promise.all([
          fetchCompaniesAction({ top: 100, skip: 0 }),
          fetchRolesAction({ top: 200, skip: 0 }),
          apiHandler(endpoints.getCandidateGroupTreeOData, null as any),
        ]);

        if (compRes.data?.rows) {
          setCompanies(compRes.data.rows.map((r) => ({ id: r.id, name: r.companyName })));
        }
        if (rolesRes.data?.rows) {
          setRoles(rolesRes.data.rows.map((r: any) => ({ id: r.name, name: r.name })));
        }

        // Normalize group tree response to { id, name, children[] }
        const raw = (groupRes?.data as any)?.value ?? groupRes?.data ?? [];
        const pickChildren = (n: any): any[] => {
          const candidates = [
            n?.children,
            n?.Children,
            n?.childrens,
            n?.ChildNodes,
            n?.Items,
            n?.Nodes,
            n?.Groups,
            n?.Subgroups,
          ];
          for (const c of candidates) if (Array.isArray(c)) return c;
          return [];
        };
        const norm = (nodes: any[]): GroupNode[] =>
          (nodes || [])
            .map((n) => {
              const id = Number(
                n?.CandidateGroupId ?? n?.candidateGroupId ?? n?.CandidateGroupID ?? n?.GroupId ?? n?.GroupID ?? n?.Id ?? n?.id
              );
              const name =
                n?.GroupName ?? n?.CandidateGroupName ?? n?.name ?? n?.Group ?? n?.Name ?? n?.Title ?? n?.Label ??
                (Number.isFinite(id) ? `Group ${id}` : "Group");
              if (!Number.isFinite(id)) return null;
              return { id, name: String(name), children: norm(pickChildren(n)) } as GroupNode;
            })
            .filter(Boolean) as GroupNode[];

        const tree = Array.isArray(raw) ? norm(raw) : [];
        setGroupTree(tree);
        // Build id->node map for fast lookups
        const map: Record<number, GroupNode> = {};
        const walk = (nodes: GroupNode[]) => {
          for (const n of nodes) {
            map[n.id] = n;
            if (n.children?.length) walk(n.children);
          }
        };
        walk(tree);
        setIdToNode(map);
      } catch (e) {
        console.error("Init load failed", e);
      }
    })();
  }, []);

  // Helpers for hierarchical UI
  const collectDescendants = (node: GroupNode): number[] => {
    const ids: number[] = [];
    (node.children || []).forEach((c) => {
      ids.push(c.id, ...collectDescendants(c));
    });
    return ids;
  };

  // Full selection: node and all descendants selected
  const isNodeFullySelected = (node: GroupNode, list = selectedGroupIds) => {
    const allIds = [node.id, ...collectDescendants(node)];
    return allIds.every((id) => list.includes(id));
  };

  // Partial selection: some (self or descendants) selected, but not fully
  const isNodeIndeterminate = (node: GroupNode) => {
    const desc = collectDescendants(node);
    const anySelected = selectedGroupIds.includes(node.id) || desc.some((id) => selectedGroupIds.includes(id));
    return anySelected && !isNodeFullySelected(node);
  };

  // Remove any parent ids that are not fully selected given current list
  const normalizeSelection = (list: number[]) => {
    const set = new Set(list);
    const visit = (nodes: GroupNode[]) => {
      for (const n of nodes) {
        if (set.has(n.id) && !isNodeFullySelected(n, Array.from(set))) {
          set.delete(n.id);
        }
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
                  <UserPlus2 className="w-4 h-4 text-indigo-600" />
                </div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Add New Candidate
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/candidates"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back to Candidates
              </Link>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveAndNew}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-colors ${isSaving
                    ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  {isSaving ? "Saving..." : "Save & New"}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm transition-colors ${isSaving
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                >
                  {isSaving ? "Saving..." : "Save Candidate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-[85%] mx-auto px-6 py-8">
        <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            autoComplete="off"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  className={inputCls}
                  placeholder="Enter first name"
                  value={form.firstName}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  className={inputCls}
                  placeholder="Enter last name"
                  value={form.lastName}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className={inputCls}
                  placeholder="Enter email"
                  value={form.email}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  required
                  className={inputCls}
                  placeholder="Enter phone number"
                  value={form.phoneNumber}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Cell Phone
                </label>
                <input
                  type="text"
                  name="cellPhone"
                  className={inputCls}
                  placeholder="Enter cell phone"
                  value={form.cellPhone}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Company
                </label>
                <select
                  name="companyId"
                  aria-label="Company"
                  className={selectCls}
                  value={form.companyId}
                  onChange={handleInputChange}
                >
                  <option value="">Select company</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

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
                      id="handicapped-no"
                      type="radio"
                      checked={!isHandicappedState}
                      onChange={() => {
                        console.log('Setting isHandicapped to false');
                        setIsHandicappedState(false);
                        setForm(prev => ({ ...prev, isHandicapped: false }));
                      }}
                      className="h-4 w-4 text-indigo-600 border-gray-300"
                    />
                    <label htmlFor="handicapped-no" className="text-sm text-gray-800">No</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="handicapped-yes"
                      type="radio"
                      checked={isHandicappedState}
                      onChange={() => {
                        console.log('Setting isHandicapped to true');
                        setIsHandicappedState(true);
                        setForm(prev => ({ ...prev, isHandicapped: true }));
                      }}
                      className="h-4 w-4 text-indigo-600 border-gray-300"
                    />
                    <label htmlFor="handicapped-yes" className="text-sm text-gray-800">Yes</label>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Address
              </label>
              <textarea
                name="address"
                className={textareaCls}
                placeholder="Enter address"
                rows={2}
                value={form.address}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  className={inputCls}
                  placeholder="Enter city"
                  value={form.city}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  State
                </label>
                <select
                  aria-label="State"
                  name="state"
                  className={selectCls}
                  value={form.state}
                  onChange={handleInputChange}
                >
                  <option value="">Select state</option>
                  {STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="postalCode"
                  className={inputCls}
                  placeholder="Enter postal code"
                  value={form.postalCode}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Country
                </label>
                <select
                  aria-label="Country"
                  name="country"
                  className={selectCls}
                  value={form.country}
                  onChange={handleInputChange}
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                className={textareaCls}
                placeholder="Additional notes (optional)"
                rows={2}
                value={form.notes}
                onChange={handleInputChange}
              />
            </div>

            {/* --- User Login Section --- */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">User Login</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    User Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="userName"
                    className={inputCls}
                    placeholder="Enter user name"
                    value={form.userLogin[0].userName}
                    onChange={(e) => handleUserLoginChange(e, 0)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    className={inputCls}
                    placeholder="Enter password"
                    value={form.userLogin[0].password}
                    onChange={(e) => handleUserLoginChange(e, 0)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="displayName"
                    className={inputCls}
                    placeholder="Enter display name"
                    value={form.userLogin[0].displayName}
                    onChange={(e) => handleUserLoginChange(e, 0)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    className={selectCls}
                    value={form.userLogin[0].role}
                    onChange={(e) => handleUserLoginChange(e, 0)}
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
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  User Photo
                </label>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Register Test Groups</h2>
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

            {/* Bottom action buttons removed as per requirement (only header actions retained) */}
          </form>
        </div>
      </div>

      {/* Success Modal */}
      <ConfirmationModal
        isOpen={showSuccessModal}
        onConfirm={() => {
          setShowSuccessModal(false);
          router.push("/admin/candidates");
        }}
        onCancel={() => { }}
        title="Candidate Created Successfully! 🎉"
        message="Your candidate has been successfully created and saved to the database."
        confirmText="Go to Candidates"
        cancelText=""
        variant="success"
        className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
      />
    </div>
  );
}