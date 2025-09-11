"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ConfirmationModal from "@/components/ConfirmationModal";
import { createCandidateGroupAction } from "@/app/actions/admin/candidateGroups";
import { Users, ArrowLeft, ChevronDown, ChevronUp, Circle, Check } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { fetchLanguagesAction } from "@/app/actions/dashboard/questions/fetchLanguages";
import type { GetLanguagesResponse } from "@/utils/api/types";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";

type GroupNode = { id: number; name: string; children?: GroupNode[] };

export default function NewCandidateGroupPage() {
  const router = useRouter();
  const { username } = useUser();
  // Mode selection
  type Mode = "ROOT" | "SUB";
  const [mode, setMode] = useState<Mode>("ROOT");

  // Root mode fields
  const [name, setName] = useState("");

  // Sub mode fields
  const [parentGroup, setParentGroup] = useState<{ id: number; name: string } | null>(null);
  const [subName, setSubName] = useState("");

  const [language, setLanguage] = useState("");
  const [isActive, setIsActive] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [languages, setLanguages] = useState<GetLanguagesResponse[]>([]);
  const [langLoading, setLangLoading] = useState(false);

  // Group tree dropdown state
  const [treeLoading, setTreeLoading] = useState(false);
  const [tree, setTree] = useState<GroupNode[]>([]);
  const [treeOpen, setTreeOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [treeFilter, setTreeFilter] = useState("");
  const [idToNode, setIdToNode] = useState<Record<number, GroupNode>>({});
  const [idToParent, setIdToParent] = useState<Record<number, number | null>>({});

  const inputCls = "w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm bg-white";
  const selectCls = inputCls;

  const canSave = useMemo(() => {
    if (!language.trim()) return false;
    if (mode === "ROOT") return name.trim().length > 0;
    return !!parentGroup && subName.trim().length > 0;
  }, [mode, name, parentGroup, subName, language]);

  const save = async () => {
  // Guard invalid states; button should already be disabled
  if (!language.trim()) return;
  if (mode === "ROOT" && !name.trim()) return;
  if (mode === "SUB" && !parentGroup) return;
  if (mode === "SUB" && !subName.trim()) return;

    setSaving(true);
    const nowIso = new Date().toISOString();
    const payload = {
      CandidateGroupName: (mode === "ROOT" ? name.trim() : subName.trim()),
      ParentId: (mode === "ROOT" ? 0 : parentGroup!.id),
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

  // Load group tree (on mount lazily or when switching to SUB)
  const ensureTreeLoaded = async () => {
    if (tree.length || treeLoading) return;
    setTreeLoading(true);
    try {
      const res = await apiHandler(endpoints.getCandidateGroupTreeOData, null as any);
      const raw = (res?.data as any)?.value ?? res?.data ?? [];
      const pickChildren = (n: any): any[] => {
        const candidates = [n?.children, n?.Children, n?.childrens, n?.ChildNodes, n?.Items, n?.Nodes, n?.Groups, n?.Subgroups];
        for (const c of candidates) if (Array.isArray(c)) return c;
        return [];
      };
      const norm = (nodes: any[]): GroupNode[] =>
        (nodes || [])
          .map((n) => {
            const id = Number(n?.CandidateGroupId ?? n?.candidateGroupId ?? n?.Id ?? n?.id);
            const name = n?.GroupName ?? n?.CandidateGroupName ?? n?.name ?? n?.Group ?? n?.Name ?? n?.Title ?? n?.Label;
            if (!Number.isFinite(id)) return null;
            return { id, name: String(name ?? `Group ${id}`), children: norm(pickChildren(n)) } as GroupNode;
          })
          .filter(Boolean) as GroupNode[];
      const built = Array.isArray(raw) ? norm(raw) : [];
      setTree(built);
      // Build id maps for breadcrumb
      const nodeMap: Record<number, GroupNode> = {};
      const parentMap: Record<number, number | null> = {};
      const walk = (nodes: GroupNode[], parent: number | null) => {
        for (const nd of nodes) {
          nodeMap[nd.id] = nd;
          parentMap[nd.id] = parent;
          if (nd.children?.length) walk(nd.children, nd.id);
        }
      };
      walk(built, null);
      setIdToNode(nodeMap);
      setIdToParent(parentMap);
    } catch (e: any) {
      // ignore
    }
    setTreeLoading(false);
  };

  useEffect(() => {
    if (mode === "SUB") ensureTreeLoaded();
  }, [mode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!treeOpen) return;
      const el = dropdownRef.current;
      if (el && !el.contains(e.target as Node)) setTreeOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [treeOpen]);

  const renderTree = (nodes: GroupNode[], level = 0) => {
    return (
      <div>
        {nodes.map((n) => (
          <TreeRow key={n.id} node={n} level={level} />
        ))}
      </div>
    );
  };

  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [collapsedAll, setCollapsedAll] = useState(false);
  const toggleExpand = (id: number) => {
    setCollapsedAll(false);
    setExpanded((m) => ({ ...m, [id]: !m[id] }));
  };

  const TreeRow = ({ node, level }: { node: GroupNode; level: number }) => {
  const hasChildren = (node.children || []).length > 0;
  // If user collapsed all, only show nodes explicitly re-opened
  const isExpanded = collapsedAll ? !!expanded[node.id] : (expanded[node.id] ?? level < 1);
    return (
      <div>
        <div className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer ${parentGroup?.id === node.id ? 'bg-indigo-50' : 'hover:bg-gray-50'}`} style={{ paddingLeft: level * 12 }}
          onClick={() => { setParentGroup({ id: node.id, name: node.name }); setTreeOpen(false); }}
          title={node.name}
        >
          {hasChildren ? (
            <button type="button" onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
              className="h-5 w-5 flex items-center justify-center rounded border border-gray-200 text-xs bg-white">
              {isExpanded ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
            </button>
          ) : (<span className="h-5 w-5" />)}
          <Circle className="w-2 h-2 text-gray-400" />
          <span className="text-sm text-gray-800 truncate">{node.name}</span>
          {parentGroup?.id === node.id && <Check className="w-3.5 h-3.5 text-indigo-600 ml-auto" />}
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-3 pl-3 border-l border-gray-200">
            {node.children!.map((c) => (
              <TreeRow key={c.id} node={c} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Expand/Collapse all helpers
  const expandAll = () => {
    const next: Record<number, boolean> = {};
    const walk = (nodes: GroupNode[]) => {
      for (const n of nodes) {
        next[n.id] = true;
        if (n.children?.length) walk(n.children);
      }
    };
    walk(tree);
    setCollapsedAll(false);
    setExpanded(next);
  };
  const collapseAll = () => {
    setExpanded({});
    setCollapsedAll(true);
  };

  // Filter tree by name and include ancestors of matches
  const filterTree = useMemo(() => {
    const q = (treeFilter || "").toLowerCase().trim();
    if (!q) return tree;
    const walk = (nodes: GroupNode[]): GroupNode[] =>
      nodes
        .map((n) => {
          const kids = n.children ? walk(n.children) : [];
          const match = n.name.toLowerCase().includes(q);
          if (match || kids.length) return { id: n.id, name: n.name, children: kids } as GroupNode;
          return null;
        })
        .filter(Boolean) as GroupNode[];
    return walk(tree);
  }, [tree, treeFilter]);

  const parentBreadcrumb = useMemo(() => {
    if (!parentGroup) return '';
    const names: string[] = [];
    let cur: number | null | undefined = parentGroup.id;
    while (cur != null) {
      const n = idToNode[cur];
      if (!n) break;
      names.push(n.name);
      cur = idToParent[cur] ?? null;
    }
    return names.reverse().join(' › ');
  }, [parentGroup, idToNode, idToParent]);

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Header with back link and actions to mirror Subject layout */}
      <div className="flex items-start justify-between w-[60%] mx-auto mb-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/candidate-groups" className="inline-flex items-center text-sm text-indigo-600 hover:underline"><ArrowLeft className="w-4 h-4 mr-1"/> Back</Link>
          <PageHeader icon={<Users className="w-6 h-6 text-indigo-600" />} title="New Candidate Group" showSearch={false} onSearch={()=>{}} />
        </div>
        <div className="flex gap-2">
          <Link href="/admin/candidate-groups" className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Cancel</Link>
          <button onClick={save} disabled={!canSave || saving} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium shadow hover:bg-indigo-700 disabled:opacity-50">{saving?"Saving…":"Create"}</button>
        </div>
      </div>

      {/* Centered card */}
      <div className="w-[60%] mx-auto bg-white shadow-sm border border-gray-200 rounded-lg p-6 space-y-5">
        {/* Mode selection */}
        <div className="flex gap-6">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="ROOT"
              checked={mode === "ROOT"}
              onChange={() => setMode("ROOT")}
              className="h-4 w-4 text-indigo-600 border-gray-300"
            />
            <span className="text-sm text-gray-800">Create a top-level group</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="SUB"
              checked={mode === "SUB"}
              onChange={() => setMode("SUB")}
              className="h-4 w-4 text-indigo-600 border-gray-300"
            />
            <span className="text-sm text-gray-800">Create a subgroup under an existing group</span>
          </label>
        </div>

        {mode === "ROOT" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Group Name<span className="text-red-500 ml-0.5">*</span></label>
              <input value={name} onChange={e=>setName(e.target.value)} className={inputCls} placeholder="Enter group name" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div ref={dropdownRef}>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Parent Group<span className="text-red-500 ml-0.5">*</span></label>
              <button
                type="button"
                onClick={async () => { await ensureTreeLoaded(); setTreeOpen(v=>!v); }}
                className="w-full flex items-center justify-between border border-gray-300 rounded-md px-3 py-2 text-sm bg-white hover:bg-gray-50"
              >
                <span className={`truncate ${parentGroup ? 'text-gray-900' : 'text-gray-500'}`}>{parentGroup ? (parentBreadcrumb || parentGroup.name) : (treeLoading ? 'Loading…' : 'Select a parent group')}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
              {treeOpen && (
                <div className="relative">
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow">
                    <div className="p-2 border-b border-gray-100 flex items-center gap-2">
                      <input
                        value={treeFilter}
                        onChange={(e)=>setTreeFilter(e.target.value)}
                        placeholder="Search groups..."
                        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      />
                      <button type="button" onClick={expandAll} className="text-xs text-gray-600 hover:text-indigo-700">Expand all</button>
                      <button type="button" onClick={collapseAll} className="text-xs text-gray-600 hover:text-indigo-700">Collapse all</button>
                    </div>
                    <div className="max-h-72 overflow-auto py-1">
                      {treeLoading ? (
                        <div className="p-3 text-sm text-gray-500">Loading groups…</div>
                      ) : (filterTree.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">No groups found</div>
                      ) : (
                        renderTree(filterTree)
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Subgroup Name<span className="text-red-500 ml-0.5">*</span></label>
              <input value={subName} onChange={e=>setSubName(e.target.value)} className={inputCls} placeholder="Enter subgroup name" />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Language<span className="text-red-500 ml-0.5">*</span></label>
          <select
            value={language}
            onChange={e=>setLanguage(e.target.value)}
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
          <select value={isActive} onChange={e=>setIsActive(Number(e.target.value))} className={selectCls}>
            <option value={1}>Active</option>
            <option value={0}>Inactive</option>
          </select>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showSuccessModal}
        variant="success"
        title="Group Created Successfully!"
        message={mode === 'ROOT' ? 'The top-level group has been created.' : 'The subgroup has been created under the selected group.'}
        confirmText="Go to List"
        cancelText=""
        onConfirm={() => { setShowSuccessModal(false); router.push('/admin/candidate-groups'); }}
        onCancel={() => setShowSuccessModal(false)}
      />
    </div>
  );
}
