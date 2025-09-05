"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import { useTestDraft } from "@/contexts/TestDraftContext";
import ImportantInstructions from "@/components/ImportantInstructions";

type Props = {
  registerValidator?: (fn: () => boolean) => void;
};

type GroupNode = {
  CandidateGroupId: number;
  GroupName: string;
  children?: GroupNode[];
};

export default function Step5Assign({ registerValidator }: Props) {
  const { draft, setDraft } = useTestDraft();
  const [groupTree, setGroupTree] = useState<GroupNode[]>([]);
  const [checkedGroups, setCheckedGroups] = useState<Record<number, boolean>>({});
  const [products, setProducts] = useState<{ ProductId: number; ProductName: string }[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const groupsRef = useRef<HTMLDivElement | null>(null);
  const productsRef = useRef<HTMLDivElement | null>(null);
  const groupsBtnRef = useRef<HTMLButtonElement | null>(null);
  const productsBtnRef = useRef<HTMLButtonElement | null>(null);
  const [groupsPlaceUp, setGroupsPlaceUp] = useState(false);
  const [productsPlaceUp, setProductsPlaceUp] = useState(false);
  const hydratedRef = useRef(false);
  const combosSigRef = useRef<string>("");
  const validateRef = useRef<() => boolean>(() => true);

  // Load data
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [groupRes, prodRes] = await Promise.all([
          apiHandler(endpoints.getCandidateGroupTreeOData, null as any),
          apiHandler(endpoints.getActiveTestProductsOData, null as any),
        ]);
        if (!mounted) return;
        const gdataAny: any = (groupRes as any)?.data;
        const raw = Array.isArray(gdataAny?.value)
          ? (gdataAny.value as any[])
          : Array.isArray(gdataAny)
          ? (gdataAny as any[])
          : [];
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
    n?.CandidateGroupId ??
    n?.candidateGroupId ??
    n?.CandidateGroupID ??
    n?.GroupId ??
    n?.GroupID ??
    n?.Id ??
    n?.id
              );
              const name =
                n?.GroupName ??
                n?.CandidateGroupName ??
    n?.name ??
                n?.Group ??
                n?.Name ??
                n?.Title ??
                n?.Label ??
                (Number.isFinite(id) ? `Group ${id}` : "Group");
              const kids = pickChildren(n);
              if (!Number.isFinite(id)) return null;
              return { CandidateGroupId: id, GroupName: String(name), children: norm(kids) } as GroupNode;
            })
            .filter(Boolean) as GroupNode[];

        const gdata: GroupNode[] = norm(raw);
        const pdata = ((prodRes?.data?.value ?? []) as any[]).map((p) => ({ ProductId: p.ProductId, ProductName: p.ProductName }));
        const cleanTree = Array.isArray(gdata) ? gdata : [];
        setGroupTree(cleanTree);
        // After loading tree, prune any checked ids not found in tree to avoid ghost selections
        const idSet = new Set<number>();
        const walk = (nodes: GroupNode[]) => {
          for (const n of nodes || []) {
            if (Number.isFinite(n.CandidateGroupId)) idSet.add(Number(n.CandidateGroupId));
            if (n.children && n.children.length > 0) walk(n.children);
          }
        };
        walk(cleanTree);
        setCheckedGroups((prev) => {
          const next: Record<number, boolean> = {};
          for (const [k, v] of Object.entries(prev)) {
            const id = Number(k);
            if (v && idSet.has(id)) next[id] = true;
          }
          return next;
        });
        setProducts(pdata);
      } catch {
        if (mounted) {
          setGroupTree([]);
          setProducts([]);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Hydrate UI state from draft.TestAssignments so selections persist when returning to Step 5
  useEffect(() => {
  if (hydratedRef.current) return; // run hydration only once
    try {
      const assignments: any[] = Array.isArray((draft as any)?.TestAssignments)
        ? (draft as any).TestAssignments
        : [];
      // Derive selected ids from TestAssignments (one- or two-sided)
      let pids = Array.from(
        new Set(
          assignments
            .map((a: any) => Number(a?.ProductId))
            .filter((n: any) => Number.isFinite(n))
        )
      );
      let gids = Array.from(
        new Set(
          assignments
            .map((a: any) => Number(a?.CandidateGroupId))
            .filter((n: any) => Number.isFinite(n))
        )
      );

      // If no assignments present (or empty arrays), fallback to independent selections persisted in draft
      if ((assignments?.length ?? 0) === 0) {
        const selP: any[] = Array.isArray((draft as any)?.SelectedProductIds)
          ? (draft as any).SelectedProductIds
          : [];
        const selG: any[] = Array.isArray((draft as any)?.SelectedCandidateGroupIds)
          ? (draft as any).SelectedCandidateGroupIds
          : [];
        pids = Array.from(new Set(selP.map((x) => Number(x)).filter((n) => Number.isFinite(n))));
        gids = Array.from(new Set(selG.map((x) => Number(x)).filter((n) => Number.isFinite(n))));
      }

      // Only update UI state if changed
      const arrEqAsSet = (a: number[], b: number[]) => {
        if (a.length !== b.length) return false;
        const sa = new Set(a);
        for (const v of b) if (!sa.has(v)) return false;
        return true;
      };
      if (!arrEqAsSet(pids, selectedProductIds)) {
        setSelectedProductIds(pids);
      }
      const currentGids = Object.keys(checkedGroups)
        .filter((k) => checkedGroups[Number(k)])
        .map((k) => Number(k));
      if (!arrEqAsSet(gids, currentGids)) {
        const next: Record<number, boolean> = {};
        gids.forEach((id) => (next[id] = true));
        setCheckedGroups(next);
      }
    } finally {
      hydratedRef.current = true;
    }
  }, [draft]);

  // Helpers: walk tree
  const collectDescendantIds = (node: GroupNode): number[] => {
    const out: number[] = [node.CandidateGroupId];
    (node.children ?? []).forEach((c) => out.push(...collectDescendantIds(c)));
    return out;
  };

  const getGroupLabel = (n: GroupNode): string => {
    return (
      (n as any).GroupName ??
      (n as any).CandidateGroupName ??
      (n as any).Group ??
      (n as any).Name ??
      `Group ${n.CandidateGroupId}`
    );
  };

  // Toggle a group: select/deselect node and all descendants
  const toggleGroup = (node: GroupNode, value: boolean) => {
    const ids = collectDescendantIds(node);
    setCheckedGroups((prev) => {
      const next = { ...prev } as Record<number, boolean>;
      if (value) {
        ids.forEach((id) => (next[id] = true));
      } else {
        ids.forEach((id) => { if (next[id]) delete next[id]; });
      }
      return next;
    });
  };

  // Render group tree with checkboxes (flat, indented rows inside dropdown)
  const renderTree = (nodes: GroupNode[], depth = 0) => (
    <ul>
      {nodes.map((n) => (
        <li key={n.CandidateGroupId}>
          <div className="px-3 py-1 hover:bg-gray-50">
            <label className="flex items-center gap-2" style={{ paddingLeft: depth * 12 }}>
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={!!checkedGroups[n.CandidateGroupId]}
                onChange={(e) => toggleGroup(n, e.target.checked)}
              />
              <span className="text-sm text-gray-800 truncate">{getGroupLabel(n)}</span>
            </label>
          </div>
          {n.children && n.children.length > 0 && renderTree(n.children, depth + 1)}
        </li>
      ))}
    </ul>
  );

  // Persist into draft selections and TestAssignments whenever selection changes
  useEffect(() => {
    if (!hydratedRef.current) return; // avoid clearing draft before initial hydration
    const groupIds = Object.keys(checkedGroups)
      .filter((k) => checkedGroups[Number(k)])
      .map(Number);

    // Build a signature so we can avoid unnecessary updates
    let sig = "NONE";
    if (groupIds.length > 0 && selectedProductIds.length > 0) {
      const pairs: string[] = [];
      for (const pid of selectedProductIds) for (const gid of groupIds) pairs.push(`${pid}:${gid}`);
      pairs.sort();
      sig = `GP:${pairs.join(",")}`;
    } else if (groupIds.length > 0) {
      const gids = [...groupIds].sort((a, b) => a - b);
      sig = `G:${gids.join(",")}`;
    } else if (selectedProductIds.length > 0) {
      const pids = [...selectedProductIds].sort((a, b) => a - b);
      sig = `P:${pids.join(",")}`;
    }

    // If absolutely nothing changed (same signature and same selected arrays), skip
    const sameSig = sig === combosSigRef.current;

    const prevSelG: number[] = Array.isArray((draft as any)?.SelectedCandidateGroupIds)
      ? (draft as any).SelectedCandidateGroupIds
      : [];
    const prevSelP: number[] = Array.isArray((draft as any)?.SelectedProductIds)
      ? (draft as any).SelectedProductIds
      : [];
      const eqSet = (a: number[], b: number[]) => {
        if (a.length !== b.length) return false;
        const s = new Set(a);
        for (const v of b) if (!s.has(v)) return false;
        return true;
      };

      // Decide new TestAssignments based on signature
      let nextAssignments: any[] = [];
      if (sig === "NONE") {
        nextAssignments = [];
      } else if (sig.startsWith("GP:")) {
        const csv = sig.slice(3);
        nextAssignments = csv.split(",").filter(Boolean).map((p) => {
          const [pid, gid] = p.split(":");
          return { ProductId: Number(pid), CandidateGroupId: Number(gid) };
        });
      } else if (sig.startsWith("G:")) {
        const csv = sig.slice(2);
        nextAssignments = csv.split(",").filter(Boolean).map((g) => ({ CandidateGroupId: Number(g) }));
      } else if (sig.startsWith("P:")) {
        const csv = sig.slice(2);
        nextAssignments = csv.split(",").filter(Boolean).map((p) => ({ ProductId: Number(p) }));
      }

      const prevAssignments: any[] = Array.isArray((draft as any)?.TestAssignments)
        ? (draft as any).TestAssignments
        : [];
      const assignChanged = (() => {
        if (prevAssignments.length !== nextAssignments.length) return true;
        // Shallow compare items by JSON string (small arrays; acceptable)
        for (let i = 0; i < prevAssignments.length; i++) {
          if (JSON.stringify(prevAssignments[i]) !== JSON.stringify(nextAssignments[i])) return true;
        }
        return false;
      })();

    const selGChanged = !eqSet(prevSelG, groupIds);
    const selPChanged = !eqSet(prevSelP, selectedProductIds);

    // If nothing actually changed, sync signature and bail without calling setDraft
    if (!assignChanged && !selGChanged && !selPChanged) {
      combosSigRef.current = sig;
      return;
    }

    // Update draft with only necessary changes
    setDraft((prev: any) => {
      const next: any = { ...(prev || {}) };
      if (selGChanged) next.SelectedCandidateGroupIds = groupIds;
      if (selPChanged) next.SelectedProductIds = selectedProductIds;
      if (assignChanged) next.TestAssignments = nextAssignments;
      combosSigRef.current = sig;
      return next;
    });
  }, [checkedGroups, selectedProductIds]);

  // Validation: relaxed per requirement – Step 5 has no blocking validations
  const validate = () => {
    setError(null);
    return true;
  };

  // Keep latest validate in ref and register once
  useEffect(() => {
    validateRef.current = () => validate();
  }, [checkedGroups, selectedProductIds]);

  useEffect(() => {
    if (registerValidator) {
      registerValidator(() => validateRef.current());
    }
  }, [registerValidator]);

  // Close dropdowns on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (groupsOpen && groupsRef.current && !groupsRef.current.contains(t)) setGroupsOpen(false);
      if (productsOpen && productsRef.current && !productsRef.current.contains(t)) setProductsOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [groupsOpen, productsOpen]);

  // Summaries for buttons
  // Build a set of valid group ids from the loaded tree to prevent ghost selections
  const validGroupIdSet = useMemo(() => {
    const ids = new Set<number>();
    const walk = (nodes: GroupNode[]) => {
      for (const n of nodes || []) {
        if (Number.isFinite(n.CandidateGroupId)) ids.add(Number(n.CandidateGroupId));
        if (n.children && n.children.length > 0) walk(n.children);
      }
    };
    walk(groupTree);
    return ids;
  }, [groupTree]);
  const selectedGroupCount = useMemo(() => {
    let count = 0;
    for (const [k, v] of Object.entries(checkedGroups)) {
      if (!v) continue;
      const id = Number(k);
      if (Number.isFinite(id) && validGroupIdSet.has(id)) count++;
    }
    return count;
  }, [checkedGroups, validGroupIdSet]);
  const selectedProductCount = selectedProductIds.length;
  // Perf: memoized helpers for products
  const productNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of products) m.set(p.ProductId, p.ProductName);
    return m;
  }, [products]);
  const selectedProductIdSet = useMemo(() => new Set(selectedProductIds), [selectedProductIds]);

  // Prune any selected products that no longer exist in the products list
  useEffect(() => {
    if (!Array.isArray(products) || products.length === 0) return;
    setSelectedProductIds((prev) => {
      const validIds = new Set(products.map((p) => p.ProductId));
      const next = prev.filter((id) => validIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [products]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Candidate Groups dropdown */}
          <div ref={groupsRef} className="relative">
            <label className="block text-sm font-medium text-gray-800 mb-1">Candidate Groups</label>
            <button
              type="button"
              ref={groupsBtnRef}
              className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2.5 text-left text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between"
              onClick={() => {
                const rect = groupsBtnRef.current?.getBoundingClientRect();
                const spaceBelow = rect ? window.innerHeight - rect.bottom : 0;
                setGroupsPlaceUp(spaceBelow < 320); // flip if near the footer
                setGroupsOpen((v) => !v);
              }}
            >
              <span className="truncate">
                {selectedGroupCount === 0 ? (
                  <span className="text-gray-500">Select candidate groups</span>
                ) : (
                  `${selectedGroupCount} selected`
                )}
              </span>
              <svg className="w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
            </button>
            {groupsOpen && (
              <div className={`absolute left-0 right-0 ${groupsPlaceUp ? "bottom-full mb-1" : "mt-1"} z-40 bg-white border border-gray-200 rounded-md shadow-lg max-h-72 overflow-y-auto`}> 
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
                  <span className="text-xs text-gray-600">Groups</span>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCheckedGroups({});
                    }}
                  >
                    Clear
                  </button>
                </div>
                {groupTree.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">No groups found.</div>
                ) : (
                  renderTree(groupTree)
                )}
              </div>
            )}
          </div>

          {/* Products dropdown */}
          <div ref={productsRef} className="relative">
            <label className="block text-sm font-medium text-gray-800 mb-1">Products</label>
            <button
              type="button"
              ref={productsBtnRef}
              className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2.5 text-left text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between"
              onClick={() => {
                const rect = productsBtnRef.current?.getBoundingClientRect();
                const spaceBelow = rect ? window.innerHeight - rect.bottom : 0;
                setProductsPlaceUp(spaceBelow < 320);
                setProductsOpen((v) => !v);
              }}
            >
              <span className="truncate">
                {(() => {
                  if (selectedProductCount === 0) return <span className="text-gray-500">Select products</span>;
                  const names = selectedProductIds
                    .map((id) => productNameById.get(id))
                    .filter((n): n is string => typeof n === 'string' && n.trim() !== '');
                  if (names.length === 0) return <span className="text-gray-500">Select products</span>;
                  if (names.length <= 2) return names.join(", ");
                  return `${names.length} selected`;
                })()}
              </span>
              <svg className="w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
            </button>
            {productsOpen && (
              <div className={`absolute left-0 right-0 ${productsPlaceUp ? "bottom-full mb-1" : "mt-1"} z-40 bg-white border border-gray-200 rounded-md shadow-lg max-h-72 overflow-y-auto`}>
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
                  <span className="text-xs text-gray-600">Products</span>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedProductIds([]);
                    }}
                  >
                    Clear
                  </button>
                </div>
                {products.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">No active products found.</div>
                ) : (
                  <ul className="py-1">
                    {products.map((p) => (
                      <li key={p.ProductId} className="px-3 py-1 hover:bg-gray-50">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={selectedProductIdSet.has(p.ProductId)}
                            onChange={(e) => {
                              setSelectedProductIds((prev) =>
                                e.target.checked
                                  ? Array.from(new Set([...prev, p.ProductId]))
                                  : prev.filter((id) => id !== p.ProductId)
                              );
                            }}
                          />
                          <span className="truncate">{p.ProductName}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>

      <div>
        <ImportantInstructions
          title="Assignment"
          detail="Pick candidate groups and/or products. If you choose both, we’ll create all combinations. You can also assign only to groups or only to products."
        />
      </div>
    </div>
  );
}
