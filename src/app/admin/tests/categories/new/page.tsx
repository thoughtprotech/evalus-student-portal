"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ConfirmationModal from "@/components/ConfirmationModal";
import { fetchTestCategoriesODataAction, createTestCategoryAction } from "@/app/actions/admin/test-categories";
import { BookOpenText, ArrowLeft, ChevronDown, ChevronUp, Circle, Check, Layers } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { fetchLanguagesAction } from "@/app/actions/dashboard/questions/fetchLanguages";
import type { GetLanguagesResponse } from "@/utils/api/types";

export default function NewTestCategoryPage() {
    const router = useRouter();
    const { username } = useUser();

    type Mode = "ROOT" | "SUB";
    const [mode, setMode] = useState<Mode>("ROOT");
    const [name, setName] = useState("");
    const [parentCategory, setParentCategory] = useState<{ id: number; name: string } | null>(null);

    const [language, setLanguage] = useState("");
    const [status, setStatus] = useState<number>(1);
    const [saving, setSaving] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [languages, setLanguages] = useState<GetLanguagesResponse[]>([]);
    const [langLoading, setLangLoading] = useState(false);

    const inputCls = "w-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-md px-3 py-2 text-sm bg-white";
    const selectCls = inputCls;

    const canSave = useMemo(() => name.trim().length > 0 && language.trim().length > 0 && (mode === 'ROOT' || !!parentCategory), [name, language, mode, parentCategory]);

    const save = async () => {
        if (!canSave) return;
        setSaving(true);
        const nowIso = new Date().toISOString();
        const payload = {
            name: name.trim(),
            type: mode === 'ROOT' ? 'Category' : 'Sub Category',
            parentId: mode === 'ROOT' ? 0 : (parentCategory?.id || 0),
            language,
            isActive: status,
            createdBy: username,
            createdDate: nowIso,
            modifiedBy: username,
            modifiedDate: nowIso,
        };
        const res = await createTestCategoryAction(payload);
        setSaving(false);
        const statusNum = typeof (res as any)?.status === 'number' ? Number((res as any).status) : NaN;
        const ok = (res as any)?.error === false || (isNaN(statusNum) || (statusNum >= 200 && statusNum < 400));
        if (ok) setShowSuccessModal(true);
    };

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

    type Node = { id: number; name: string; children?: Node[] };
    const [treeLoading, setTreeLoading] = useState(false);
    const [tree, setTree] = useState<Node[]>([]);
    const [treeOpen, setTreeOpen] = useState(false);
    const [treeFilter, setTreeFilter] = useState("");
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});
    const [collapsedAll, setCollapsedAll] = useState(false);
    const [idToNode, setIdToNode] = useState<Record<number, Node>>({});
    const [idToParent, setIdToParent] = useState<Record<number, number | null>>({});

    const ensureTreeLoaded = async () => {
        if (tree.length || treeLoading) return;
        setTreeLoading(true);
        try {
            const res = await fetchTestCategoriesODataAction({ top: 2000, skip: 0, orderBy: 'TestCategoryName asc' });
            const rows = res?.data?.rows || [];
            const byParent: Record<number, Node[]> = {};
            rows.forEach(r => { (byParent[r.parentId || 0] ||= []).push({ id: r.id, name: r.name }); });
            const attach = (n: Node): Node => ({ ...n, children: (byParent[n.id] || []).map(attach) });
            const roots = (byParent[0] || []).map(attach);
            setTree(roots);
            const nodeMap: Record<number, Node> = {}; const parentMap: Record<number, number | null> = {};
            const walk = (nodes: Node[], parent: number | null) => {
                for (const nd of nodes) { nodeMap[nd.id] = nd; parentMap[nd.id] = parent; if (nd.children?.length) walk(nd.children, nd.id); }
            };
            walk(roots, null);
            setIdToNode(nodeMap); setIdToParent(parentMap);
        } catch { }
        setTreeLoading(false);
    };

    useEffect(() => { if (mode === 'SUB') ensureTreeLoaded(); }, [mode]);

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => { if (!treeOpen) return; const el = dropdownRef.current; const target = e.target as unknown as HTMLElement | null; if (el && target && !el.contains(target)) setTreeOpen(false); };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [treeOpen]);

    const preserveScroll = (update: () => void) => {
        const el = scrollRef.current;
        const top = el?.scrollTop ?? 0;
        const left = el?.scrollLeft ?? 0;
        update();
        requestAnimationFrame(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = top;
                scrollRef.current.scrollLeft = left;
            }
        });
    };
    const toggleExpand = (id: number) => { preserveScroll(() => { setCollapsedAll(false); setExpanded(m => ({ ...m, [id]: !m[id] })); }); };
    const expandAll = () => { preserveScroll(() => { const next: Record<number, boolean> = {}; const walk = (nodes: Node[]) => { for (const n of nodes) { next[n.id] = true; if (n.children?.length) walk(n.children); } }; walk(tree); setCollapsedAll(false); setExpanded(next); }); };
    const collapseAll = () => { preserveScroll(() => { setExpanded({}); setCollapsedAll(true); }); };
    const filterTree = useMemo(() => {
        const q = (treeFilter || '').toLowerCase().trim(); if (!q) return tree;
        const walk = (nodes: Node[]): Node[] => nodes.map(n => { const kids = n.children ? walk(n.children) : []; const match = n.name.toLowerCase().includes(q); if (match || kids.length) return { id: n.id, name: n.name, children: kids } as Node; return null; }).filter(Boolean) as Node[];
        return walk(tree);
    }, [tree, treeFilter]);
    const parentBreadcrumb = useMemo(() => {
        if (!parentCategory) return ''; const names: string[] = []; let cur: number | null | undefined = parentCategory.id;
        while (cur != null) { const n = idToNode[cur]; if (!n) break; names.push(n.name); cur = idToParent[cur] ?? null; }
        return names.reverse().join(' › ');
    }, [parentCategory, idToNode, idToParent]);

    const TreeRow = ({ node, level }: { node: Node; level: number }) => {
        const hasChildren = (node.children || []).length > 0;
        const isExpanded = collapsedAll ? !!expanded[node.id] : (expanded[node.id] ?? level < 1);
        return (
            <div>
                <div data-node-id={node.id} className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer ${parentCategory?.id === node.id ? 'bg-indigo-50' : 'hover:bg-gray-50'}`} style={{ paddingLeft: level * 12 }}
                    onClick={() => { setParentCategory({ id: node.id, name: node.name }); setTreeOpen(false); }} title={node.name}>
                    {hasChildren ? (
                        <button type="button" onClick={(e) => {
                            e.stopPropagation();
                            const rowEl = (e.currentTarget as HTMLElement).closest('[data-node-id]') as HTMLElement | null; const anchor = rowEl || undefined;
                            const sc = scrollRef.current; let oldOffset: number | null = null; if (sc && anchor) { const a = anchor.getBoundingClientRect(); const s = sc.getBoundingClientRect(); oldOffset = a.top - s.top; }
                            toggleExpand(node.id);
                            requestAnimationFrame(() => { if (sc && anchor && oldOffset != null) { const newAnchor = sc.querySelector(`[data-node-id='${node.id}']`) as HTMLElement | null; if (newAnchor) { const a2 = newAnchor.getBoundingClientRect(); const s2 = sc.getBoundingClientRect(); const newOffset = a2.top - s2.top; sc.scrollTop += (newOffset - oldOffset); } } });
                        }} className="h-5 w-5 flex items-center justify-center rounded border border-gray-200 text-xs bg-white">
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                    ) : (<span className="h-5 w-5" />)}
                    <Circle className="w-2 h-2 text-gray-400" />
                    <span className="text-sm text-gray-800 truncate">{node.name}</span>
                    {parentCategory?.id === node.id && <Check className="w-3.5 h-3.5 text-indigo-600 ml-auto" />}
                </div>
                {hasChildren && isExpanded && (
                    <div className="ml-3 pl-3 border-l border-gray-200">
                        {node.children!.map(c => <TreeRow key={c.id} node={c} level={level + 1} />)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="p-4 h-full flex flex-col">
            <div className="flex items-start justify-between w-[60%] mx-auto mb-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/tests/categories" className="inline-flex items-center text-sm text-indigo-600 hover:underline"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Link>
                    <PageHeader icon={<Layers className="w-6 h-6 text-indigo-600" />} title="New Test Category" showSearch={false} onSearch={() => { }} />
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/tests/categories" className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Cancel</Link>
                    <button onClick={save} disabled={!canSave || saving} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium shadow hover:bg-indigo-700 disabled:opacity-50">{saving ? "Saving…" : "Create"}</button>
                </div>
            </div>

            <div className="w-[60%] mx-auto bg-white shadow-sm border border-gray-200 rounded-lg p-6 space-y-5">
                <div className="flex gap-6">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="mode" value="ROOT" checked={mode === 'ROOT'} onChange={() => setMode('ROOT')} className="h-4 w-4 text-indigo-600 border-gray-300" />
                        <span className="text-sm text-gray-800">Create a category</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="mode" value="SUB" checked={mode === 'SUB'} onChange={() => setMode('SUB')} className="h-4 w-4 text-indigo-600 border-gray-300" />
                        <span className="text-sm text-gray-800">Create a sub category under existing category</span>
                    </label>
                </div>

                {mode === 'ROOT' ? (
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Category Name<span className="text-red-500 ml-0.5">*</span></label>
                        <input value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Enter category name" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div ref={dropdownRef}>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Parent Category<span className="text-red-500 ml-0.5">*</span></label>
                            <button type="button" onClick={async () => { await ensureTreeLoaded(); setTreeOpen(v => !v); }} className="w-full flex items-center justify-between border border-gray-300 rounded-md px-3 py-2 text-sm bg-white hover:bg-gray-50">
                                <span className={`truncate ${parentCategory ? 'text-gray-900' : 'text-gray-500'}`}>{parentCategory ? (parentBreadcrumb || parentCategory.name) : (treeLoading ? 'Loading…' : 'Select a parent category')}</span>
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            </button>
                            {treeOpen && (
                                <div className="relative">
                                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow">
                                        <div className="p-2 border-b border-gray-100 flex items-center gap-2">
                                            <input value={treeFilter} onChange={(e) => setTreeFilter(e.target.value)} placeholder="Search categories..." className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
                                            <button type="button" onClick={expandAll} className="text-xs text-gray-600 hover:text-indigo-700">Expand all</button>
                                            <button type="button" onClick={collapseAll} className="text-xs text-gray-600 hover:text-indigo-700">Collapse all</button>
                                        </div>
                                        <div ref={scrollRef} className="max-h-72 overflow-auto py-1">
                                            {treeLoading ? (
                                                <div className="p-3 text-sm text-gray-500">Loading categories…</div>
                                            ) : (filterTree.length === 0 ? (
                                                <div className="p-3 text-sm text-gray-500">No categories found</div>
                                            ) : (
                                                <div>
                                                    {filterTree.map(n => <TreeRow key={n.id} node={n} level={0} />)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Sub Category Name<span className="text-red-500 ml-0.5">*</span></label>
                            <input value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Enter sub category name" />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Language<span className="text-red-500 ml-0.5">*</span></label>
                        <select value={language} onChange={e => setLanguage(e.target.value)} className={selectCls} disabled={langLoading || languages.length === 0}>
                            {!langLoading && languages.length === 0 && <option value="">No languages</option>}
                            {languages.map(l => (<option key={l.language} value={l.language}>{l.language}</option>))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Status</label>
                        <select value={status} onChange={e => setStatus(Number(e.target.value))} className={selectCls}>
                            <option value={1}>Active</option>
                            <option value={0}>Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showSuccessModal}
                variant="success"
                title="Category Created Successfully!"
                message={mode === 'ROOT' ? 'The category has been created.' : 'The sub category has been created under the selected parent.'}
                confirmText="Go to List"
                cancelText=""
                onConfirm={() => { setShowSuccessModal(false); router.push('/admin/tests/categories'); }}
                onCancel={() => setShowSuccessModal(false)}
            />
        </div>
    );
}
